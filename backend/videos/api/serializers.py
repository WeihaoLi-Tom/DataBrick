# videos/api/serializers.py
from rest_framework.serializers import ModelSerializer, PrimaryKeyRelatedField, SerializerMethodField, ValidationError

from django.conf import settings
from django.contrib.auth.models import User
from moviepy.editor import VideoFileClip, ImageClip

import os

from .cropfile import validate_length, valid_resolution
from ..constants import *
from ..helpers import clean_error_message
from ..models import Video, Show, Location

class LocationSerializer(ModelSerializer):
    video = PrimaryKeyRelatedField(queryset=Video.objects.all(), allow_null=True)

    class Meta:
        model = Location
        fields = ['id', 'location_number', 'show', 'video']
        read_only_fields = ['id', 'location_number', 'show']


class ShowSerializer(ModelSerializer):
    # Include all locations for this show
    locations = LocationSerializer(many=True, read_only=False, required=False)
    artist_username = SerializerMethodField()

    class Meta:
        model = Show
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 'cover_image',
                  'artist', 'videos', 'frame_count', 'status', 'locations', 'artist_username']
        read_only_fields = ['id', 'created_at']

    def get_artist_username(self, obj):
        if obj.artist:
            try:
                artist = User.objects.get(id=obj.artist)
                return artist.username
            except User.DoesNotExist:
                return None
        return None


class VideoSerializer(ModelSerializer):
    show = PrimaryKeyRelatedField(queryset=Show.objects.all(), allow_null=False)

    class Meta:
        model = Video
        fields = ['id', 'title', 'file', 'show']
        read_only_fields = ['id', 'show', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def validate_file(self, file):
        # Check that a file has been uploaded
        if not file:
            raise ValidationError("No file uploaded.")

        # Get the show instance associated with this video
        show = None
        if self.instance and self.instance.show:
            show = self.instance.show
        else:
            show_id = self.initial_data.get('show') or self.validated_data.get('show')
            show = Show.objects.filter(id=show_id).first()

        # If no show found, invalid video upload
        if not show: raise ValidationError("Associated show not found.")

        # Check file extensions
        file_type = file.content_type
        extension = file.name.split('.')[-1].lower()
        try:
            # Store the file locally temporarily, in order to inspect it
            file_path = os.path.join(settings.MEDIA_ROOT[:-1], file.name)
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

            if file_type.startswith('video/') or extension == 'gif':
                # Keep track of if the extension is a video or gif
                GIF = "GIF"
                if extension == 'gif':
                    media_type = GIF
                else:
                    media_type = "Video"

                # Check video / gif file attributes
                try:
                    video_clip = VideoFileClip(file_path)
                    duration = video_clip.duration
                    resolution = video_clip.size
                    fps = video_clip.fps
                    show_frames = show.frame_count

                    # Validation conditions
                    if duration > TIME_LIMIT:
                        raise ValidationError(
                            f"{media_type} is too long. Maximum allowed duration is {TIME_LIMIT // 60} minutes.")
                    if not valid_resolution(resolution):
                        raise ValidationError(
                            f"{media_type} resolution is too small. Must be at least {RESOLUTION[0]} x {RESOLUTION[1]}.")
                    # todo - check this rounding doesn't allow inconsistent uploads...
                    if round(fps, FRAME_DECIMAL_TOLERANCE) != FRAME_RATE:
                        raise ValidationError(f"{media_type} framerate must be {FRAME_RATE}fps.")

                    # Validate frame count separately (strict set to False; remember to crop later!)
                    video_clip.close()
                    validate_length(file_path, show_frames)

                except Exception as e:
                    raise ValidationError(f"Failed to process {media_type.lower()} file: {clean_error_message(e)}")
                finally:
                    video_clip.close()

            elif file_type.startswith('image/'):
                # Validate image file (store source image somewhere perhaps?) - todo
                try:
                    image_clip = ImageClip(file_path)
                    resolution = image_clip.size

                    # Validation conditions
                    if not valid_resolution(resolution):
                        raise ValidationError(
                            f"Image resolution is too small. Must be at least {RESOLUTION[0]} x {RESOLUTION[1]}.")

                except Exception as e:
                    raise ValidationError(f"Failed to process image file: {clean_error_message(e)}")
                finally:
                    image_clip.close()

            # If non-valid file extension, raise an error and do not save
            else:
                raise ValidationError("Unsupported file extension.")

        except Exception as e:
            raise ValidationError(f"Failed to handle file: {clean_error_message(e)}")
        finally:
            # Clean up temporary file if it exists
            if file_path and os.path.isfile(file_path): os.remove(file_path)

        return file