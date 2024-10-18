# videos/api/views.py
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework import status
from rest_framework.test import APIRequestFactory
from rest_framework.viewsets import ModelViewSet

from django.conf import settings
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from moviepy.editor import VideoFileClip

from PIL import Image
from io import BytesIO
import os
import uuid
import zipfile
import shutil
from django.views.decorators.csrf import csrf_exempt

from .cropfile import crop_file_duration, crop_file_resolution, crop_clip_resolution, convert_video_from_image, crop_image_resolution, tmp_clean
from .serializers import VideoSerializer, ShowSerializer, LocationSerializer
from ..constants import *
from ..helpers import clean_error_message, obj_exists
from ..models import Video, Show, Location

def artist_list(request):
    print("artist_list view was called")
    artists = User.objects.filter(is_superuser=0)
    artist_data = [{"id": artist.id, "username": artist.username, "email": artist.email} for artist in artists]
    return JsonResponse(artist_data, safe=False)

@csrf_exempt
def assign_artist(request, show_id):
    if request.method == "POST":
        artist_id = request.POST.get('artist_id')
        if not artist_id:
            return JsonResponse({'error': 'Artist ID is required.'}, status=400)

        show = get_object_or_404(Show, id=show_id)
        show.artist = artist_id

        # If artist is unassigned and show isn't approved, set status unassigned
        if int(artist_id) == 0:
            if show.status != Show.ShowStatus.APPROVED: show.status = Show.ShowStatus.UNASSIGNED 
        # Otherwise, for show assignment set it into/ back into in design status
        else: show.status = Show.ShowStatus.IN_DESIGN
        show.save()

        return JsonResponse({'message': 'Artist assigned successfully!'})

# View set for Show model
class ShowViewSet(ModelViewSet):
    queryset = Show.objects.all()
    serializer_class = ShowSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_frame_count = int(instance.frame_count)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Drop all videos if frame rate changed
        if request.data.get('frame_count') and (int(request.data.get('frame_count')) != old_frame_count):
            video_viewset = VideoViewSet()
            for video in instance.videos.all():
                video_viewset.perform_destroy(video)
                
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def perform_destroy(self, instance: Show):
        showid = instance.id

        # -- Delete children videos --
        # Create a fake request, since perform_destroy needs a request context
        factory = APIRequestFactory()
        request = factory.delete('/videos/')

        for video in instance.videos.all():
            # Create a viewset instance with the video to be destroyed
            video_viewset = VideoViewSet(request=request)
            video_viewset.perform_destroy(video)

        # Remove videos folder
        video_dir = instance.videos_path()
        if os.path.exists(video_dir): 
            shutil.rmtree(video_dir)
        # Remove thumbnail folder
        thumbnail_dir = instance.thumbnails_path()
        if os.path.exists(thumbnail_dir): 
            shutil.rmtree(thumbnail_dir)
        # Delete blank video
        tmp_clean(instance.blank_vid_path())
        
        # Prepare to delete cover image and show folder (don't delete if in use)
        if instance.cover_image: cover_image_path = instance.cover_image.path
        else: cover_image_path = ""
        show_dir = instance.show_path()
            
        # Remove self instance
        super().perform_destroy(instance)

        # NOW delete cover image
        if os.path.isfile(cover_image_path): os.remove(cover_image_path)

        # Remove showid folder finally
        if os.path.exists(show_dir): shutil.rmtree(show_dir)

    def create(self, request, *args, **kwargs):
        locations_data = request.data.pop('locations', [])  # Remove locations data from request

        # Create Show instance
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        show = serializer.save()  # Save the Show instance

        # Create or update locations
        for location_data in locations_data:
            location_data['show'] = show.id  # Associate location with the new show
            location_serializer = LocationSerializer(data=location_data)
            location_serializer.is_valid(raise_exception=True)
            location_serializer.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def retrieve(self, request, *args, **kwargs):
        show = self.get_object()
        serializer = self.get_serializer(show)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def videos(self, request, pk=None):
        try:
            show = self.get_object()  # Retrieve the Show instance

            # Fetch the videos associated with the show using ForeignKey
            show_videos = Video.objects.filter(show=show)
            serializer = VideoSerializer(show_videos, many=True, context={'request': request})

            return Response(serializer.data)

        except Exception as e:
            raise ValidationError({'detail': f"Video retrieval failed: {str(e)}"})
    
    @action(detail=False, methods=['get', 'patch'], url_path='artist/(?P<artist>[^/.]+)')
    def artist(self, request, artist=None):
        try:
            shows = Show.objects.filter(artist=artist)  # Retrieve the Show instance

            show_data = []
            for show in shows:
                data = ShowSerializer(show).data
                data['cover_image'] = request.build_absolute_uri(show.cover_image.url) if show.cover_image else None
                show_data.append(data)

            return Response(show_data)

        except Exception as e:
            raise ValidationError({'detail': f"Show retrieval failed: {str(e)}"})
        
    @action(detail=True, methods=['get'])
    def locations(self, request, pk=None):
        try:
            show = self.get_object()  # Retrieve the Show instance

            # Fetch the videos associated with the show using ForeignKey
            show_locations = Location.objects.filter(show=show)
            serializer = LocationSerializer(show_locations, many=True)

            return Response(serializer.data)

        except Exception as e:
            raise ValidationError({'detail': f"Location retrieval failed: {str(e)}"})

    @action(detail=True, methods=['get', 'patch'], url_path='locations/location_number=(?P<location_number>[^/.]+)')
    def location(self, request, pk=None, location_number=None):
        try:
            show = self.get_object()  # Retrieve the Show instance

            # Fetch the videos associated with the show using ForeignKey
            show_locations = Location.objects.get(show=show, location_number=location_number)

            if request.method == 'GET':
                # Serialize and return the location data
                serializer = LocationSerializer(show_locations)
                return Response(serializer.data)
            
            elif request.method == 'PATCH':
                # Deserialize the provided data and update the location
                serializer = LocationSerializer(show_locations, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            raise ValidationError({'detail': f"Location retrieval failed: {str(e)}"})
        
    @action(detail=True, methods=['post'])
    def clear_locations(self, request, pk=None):
        # Fetch the Show instance
        show = self.get_object()

        # Set video field to None for all locations associated with the show
        show_locations = Location.objects.filter(show=show, video__isnull=False)
        updated_count = show_locations.update(video=None)

        # Serialize the updated locations
        serialized_locations = LocationSerializer(show_locations, many=True)

        return Response({"message": f"Updated {updated_count} locations to set video as null.", "data": serialized_locations.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def save_wall_distribution(self, request, pk=None):
        print("Received wall distribution data.")
        # Extract brickDistribution from QueryDict and transform it
        brick_distribution = {}
        for key, value in request.data.items():
            if key.startswith('brickDistribution[') and key.endswith(']'):
                location_number = key[len('brickDistribution['):-1]
                video_id = value  # Since value is a list with a single element
                brick_distribution[location_number] = video_id
                
        show = self.get_object()

        for brick_loc, video_id in brick_distribution.items():
            location_number = int(brick_loc)

            try:
                video = Video.objects.get(id=int(video_id))
            except Video.DoesNotExist:
                video = None

            location, created = Location.objects.update_or_create(
                show=show,
                location_number=location_number,
                defaults={'video': video}
            )

        return Response({"message": "Wall distribution saved successfully!"}, status=status.HTTP_201_CREATED)

    # need about 1 min and you can see the download
    @action(detail=True, methods=['get'])
    def download_all_videos(self, request, pk=None):
        # Get show instance
        show = get_object_or_404(Show, pk=pk)
        locations = Location.objects.filter(show_id=show.id)

        # Generate blank video if not existent
        blank_video_path = show.blank_vid_path()
        if not os.path.exists(blank_video_path):
            show.generate_blank_video()

        # Create zip file buffer and then create the zip file
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:

            # Loop through all locations
            for i in range(1, 227):
                try:
                    location = locations.get(location_number=i)
                    video_path = location.video.file.path if location.video else blank_video_path
                    # Catch the case of missing video files from backend
                    if not os.path.exists(video_path): video_path = blank_video_path
                # Catch the case where a Location instance is missing for a Show
                except Location.DoesNotExist:
                    video_path = blank_video_path

                video_name = f'{i}.{VID_EXTENSION}'
                zip_file.write(video_path, arcname=video_name)

        zip_buffer.seek(0)
        # Stream response back (instead of standard HttpResponse) to manage large file sizes
        response = StreamingHttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename={show.title}_all_videos.zip'
        return response
    
    @action(detail=False, methods=['get'], url_path='statuses')
    def retrieve_show_statuses(self, request):
        try:
            # Get all ShowStatus choices
            statuses = Show.ShowStatus.choices
            
            # Format the response as a list of dictionaries
            status_list = [{"value": value, "display": display} for value, display in statuses]

            return Response(status_list, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f"Status retrieval failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


# View set for Video model
class VideoViewSet(ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_destroy(self, instance: Video):
        # Delete Videos from backend when deleted online
        # Prestore important info for path deletion
        if instance.file: file_path = instance.file.path
        else: file_path = "" 
        thumbnail_dir = instance.thumbnail_path()           

        # Delete video instance
        super().perform_destroy(instance)

        # Delete video file
        if os.path.isfile(file_path):
            os.remove(file_path)

        # Remove thumbnails
        if os.path.exists(thumbnail_dir): 
            shutil.rmtree(thumbnail_dir)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['show'] = self.request.data.get('show')  # Pass the show context
        return context

    def perform_create(self, serializer):
        try:
            show_id = self.request.data.get('show')
            show = Show.objects.get(id=show_id)
            video = serializer.save(show=show)

            # Get the uploaded file object from the request
            uploaded_file = self.request.FILES.get('file')
            if not uploaded_file:
                raise ValidationError("No file uploaded.")    
            # Get the MIME type from the uploaded file
            mime_type = uploaded_file.content_type

            # Convert video to correct extension if necessary
            original_file_path = video.file.path
            extension = os.path.splitext(original_file_path)[-1].lower()
            # Drop the '.'
            extension = extension[1:]

            crop_x = int(self.request.data.get('crop_x', 0))
            crop_y = int(self.request.data.get('crop_y', 0))

            if extension == VID_EXTENSION:
                try:
                    # Crop duration and resolution if necessary
                    crop_file_duration(original_file_path, show.frame_count, gif=False)
                    crop_file_resolution(original_file_path, crop_x, crop_y, show.frame_count)
                except Exception as e:
                    # If exception occurs mid move, can crash here if missing the below check
                    if os.path.exists(original_file_path): os.remove(original_file_path)
                    if obj_exists(video): video.delete()
                    raise ValidationError(f"Error cropping either duration or resolution of file type {VID_EXTENSION}: {str(e) if (len(str(e)) < 100) else 'Error message too long to display.'}")
            # Only convert if not already the desired extension
            elif extension != VID_EXTENSION:
                unique_id = uuid.uuid4()
                converted_file_path = os.path.splitext(original_file_path)[0] + '_' + str(unique_id) + '.' + VID_EXTENSION

                # Attempt to save the video_clip made
                try:
                    # Create video clip
                    if mime_type.startswith('video/') or extension == 'gif': 
                        # Crop duration first if necessary
                        crop_file_duration(original_file_path, show.frame_count, gif=(extension=='gif'))
                        # Crop the video resolution using the provided coordinates
                        crop_clip_resolution(original_file_path, converted_file_path, crop_x, crop_y, show.frame_count)
                    elif mime_type.startswith('image/'):
                        duration = show.frame_count / FRAME_RATE
                        crop_image_resolution(original_file_path, crop_x, crop_y)
                        convert_video_from_image(original_file_path, converted_file_path, duration, FRAME_RATE, show.frame_count)
                    else:
                        # Cannot convert - should've already detected this via 
                        #   validation, but consider this a failsafe
                        raise ValidationError("Unsupported file extension.")

                    os.remove(original_file_path)
                    video.file.name = os.path.relpath(converted_file_path, settings.MEDIA_ROOT)
                    video.save()
                except Exception as e:
                    if os.path.exists(original_file_path): os.remove(original_file_path)
                    if obj_exists(video): video.delete()
                    raise ValidationError(f"Failed to convert {extension} to {VID_EXTENSION}: {clean_error_message(e)}")

        except ValidationError as ve:
            # Clean error message before raising it
            raise ValidationError({'file': clean_error_message(ve)})
        except Show.DoesNotExist:
            raise ValidationError({'file': f"Show with id={show_id} does not exist."})
        
    @action(detail=True, methods=['get'])
    def frame(self, request, pk=None):
        video = self.get_object()
        # Retrieve frame number
        frame_num = request.query_params.get('frame', 0)
        if frame_num == None:
            raise ValidationError({'file': f"No frame number provided."})

        try: 
            # Retrieve the video file path
            video_file_path = video.file.path

            # Generate thumbnail directory if it doesn't exist 
            thumbnail_dir = video.thumbnail_path()
            if not os.path.exists(thumbnail_dir): os.makedirs(thumbnail_dir)

            thumbnail_file_path = os.path.join(thumbnail_dir, f"{frame_num}.{IMG_EXTENSION}")

            # Check for and return thumbnail if it already exists
            if os.path.exists(thumbnail_file_path):
                with open(thumbnail_file_path, 'rb') as thumbnail:
                    return HttpResponse(thumbnail.read(), content_type='image/jpeg')

            # Load video and find timestamp
            video_clip = VideoFileClip(video_file_path)
            fps = video_clip.fps
            timestamp = int(frame_num)/fps

            frame = video_clip.get_frame(float(timestamp))

            # Convert frame to image
            original_image = Image.fromarray(frame)
            image = original_image.resize((RESOLUTION[0] // 2, RESOLUTION[1] // 2))
            buffer = BytesIO()
            image.save(buffer, format=IMG_EXTENSION.upper(), quality=1)

            # Save thumbnail for future use
            with open(thumbnail_file_path, 'wb') as thumbnail:
                thumbnail.write(buffer.getvalue())

            video_clip.close()

            # Return thumbnail generated
            return HttpResponse(buffer.getvalue(), content_type="image/jpeg")
        
        except Exception as e:
            raise ValidationError({'file': f"Frame retrieval failed: {str(e)}"}) 
        
    @action(detail=False, methods=['get'])
    def upload_constraints(self, request):
        """
        Return constraints for video and image uploads
        """
        constraints = {
            "maxDuration": TIME_LIMIT,  # 5 minutes in seconds
            "minWidth": RESOLUTION[0],     # Minimum width
            "minHeight": RESOLUTION[1],    # Minimum height
            "allowedFrameRate": FRAME_RATE,  # Frame rate in fps
            "frameRateMargin": FRONTEND_FPS_RANGE
        }
        return Response(constraints)


# View set for Location model
class LocationViewSet(ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    parser_classes = (MultiPartParser, FormParser)

    def convert_brick_to_location_number(self, brick_loc):
        return int(brick_loc)