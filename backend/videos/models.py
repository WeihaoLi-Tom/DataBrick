# videos/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from rest_framework.serializers import ValidationError
from moviepy.editor import ColorClip

import os
import shutil

# For vid generation
from .constants import RESOLUTION, FRAME_RATE, TIME_LIMIT, VID_EXTENSION, SHOW_PATH, NUM_BRICKS, MEDIA_PATH_MAX_LENGTH

class Show(models.Model):
    # Tagged state of a show
    class ShowStatus(models.TextChoices):
        UNASSIGNED = 'unassigned', 'Unassigned'
        IN_DESIGN = 'in_design', 'In Design'
        PENDING_APPROVAL = 'pending_approval', 'Pending Approval'
        APPROVED = 'approved', 'Approved'
        ARCHIVED = 'archived', 'Archived'

    def show_path(instance):
        """Returns the root directory for all files related to this show"""
        return os.path.join(settings.MEDIA_ROOT[:-1], SHOW_PATH, str(instance.id))

    def cover_image_upload_path(instance, filename):
        # Extracting file extension from the original filename
        ext = filename.split('.')[-1]
        # Constructing the new file path using show id
        return os.path.join(instance.show_path(), f"cover_image.{ext}")

    title = models.CharField(max_length=100)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    cover_image = models.ImageField(upload_to=cover_image_upload_path, blank=True, null=True, max_length=MEDIA_PATH_MAX_LENGTH)
    
    artist = models.CharField(max_length=100, null=True, blank=True)
    frame_count = models.PositiveIntegerField(editable=True, validators=[MaxValueValidator(FRAME_RATE*TIME_LIMIT)])
    status = models.CharField(max_length=20, choices=ShowStatus.choices, default=ShowStatus.UNASSIGNED)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title}, by {self.artist} | ({self.get_status_display()})"
    
    # Override save method to generate video locs and blank vids for the show
    def save(self, *args, **kwargs):
        gen_blank_video_flag = False

        # If frame count changes, regenerate blank video...
        if self.pk:
            old_frame_count = Show.objects.get(pk=self.pk).frame_count
            if self.frame_count != old_frame_count:
                gen_blank_video_flag = True
        # ...or first time saving, generate blank video
        else: 
            gen_blank_video_flag = True

        # If first save, save twice
        if not self.pk:
            # Once without cover , to generate ID
            temp_image = self.cover_image  
            self.cover_image = None
            super(Show, self).save(*args, **kwargs)

            # Secondly with cover image, overwriting with ID present
            self.cover_image = temp_image
            kwargs.pop('force_insert', None)
            super(Show, self).save(*args, **kwargs)
        else:
            # Default save behavior
            super(Show, self).save(*args, **kwargs)

        # Generate blank video if necessary
        if gen_blank_video_flag: self.generate_blank_video()

        # Set video locations blank by default
        if not Location.objects.filter(show=self).exists():
            locations = [Location(show_id=self.id, location_number=i) for i in range(1, NUM_BRICKS+1)]
            Location.objects.bulk_create(locations)

    # Override delete method to clear all lingering files
    def delete(self, *args, **kwargs):
        # Delete cover image
        if self.cover_image and os.path.isfile(self.cover_image.path):
            os.remove(self.cover_image.path)

        # Delete blank video
        blank_video_path = self.blank_vid_path()
        if os.path.isfile(blank_video_path): os.remove(blank_video_path)

        # Remove showid folder (also achieves the above, but they're still 
        #   present just for safety)
        show_dir = self.show_path()
        if os.path.exists(show_dir): shutil.rmtree(show_dir)

        # Call the parent delete method
        super().delete(*args, **kwargs)

    def generate_blank_video(self, frame_count=None) -> str:
        """Generates a blank video for a 'Show' instance using moviepy. Can take 
        an overriding `frame_count` for blank video length if desired - leave 
        blank to use show instances frame_count value.
        """
        # Output file path
        blank_video_path = self.blank_vid_path()

        # Create directory if it doesn't exist
        directory = os.path.dirname(blank_video_path)
        if not os.path.exists(directory):
            os.makedirs(directory)

        # Use supplied frame count if given, otherwise, self frame count
        duration = (frame_count if frame_count else self.frame_count) / FRAME_RATE

        # Generate and save video
        black_clip = ColorClip(size=RESOLUTION, color=(0,0,0), duration=duration)
        black_clip = black_clip.set_fps(FRAME_RATE)
        black_clip.write_videofile(blank_video_path, codec="libx264", verbose=False)
        black_clip.close()

        # Return output file path
        return blank_video_path
    
    def blank_vid_path(self) -> str:
        """Returns the designated path to a shows blank video"""
        return os.path.join(self.show_path(), f"blank.{VID_EXTENSION}")
    
    def videos_path(self) -> str:
        return os.path.join(self.show_path(), 'videos')
    
    def thumbnails_path(self) -> str:
        return os.path.join(self.show_path(), 'thumbnails')


class Video(models.Model):
    def video_upload_path(instance, filename) -> str:
        # Constructing new file path stemming from show id
        return os.path.join(instance.show.videos_path(), filename)
    
    def thumbnail_path(instance) -> str:
        return os.path.join(instance.show.thumbnails_path(), str(instance.id))
    
    # Foreign key - show
    show = models.ForeignKey(Show, related_name='videos', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    file = models.FileField(upload_to=video_upload_path, max_length=MEDIA_PATH_MAX_LENGTH)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('show', 'file')

    # Override delete method to clear all lingering files
    def delete(self, *args, **kwargs):
        # Delete video file
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)

        # Delete thumbnails
        thumbnail_dir = self.thumbnail_path()
        if os.path.exists(thumbnail_dir): shutil.rmtree(thumbnail_dir)

        # Call the parent delete method
        super().delete(*args, **kwargs)

    def clean(self):
        # Extra validation to ensure videos aren't set to different shows
        if self.pk and self.show_id != Video.objects.get(pk=self.pk).show_id:
            raise ValidationError("Videos cannot be reassigned to different shows.")

    def __str__(self):
        return self.title + " | in " + str(self.show)


class Location(models.Model):
    # Foreign keys - show, video
    show = models.ForeignKey(Show, related_name='locations', on_delete=models.CASCADE)
    video = models.ForeignKey(Video, related_name='locations', on_delete=models.SET_NULL, null=True, blank=True)
    location_number = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(226)])

    class Meta:
        unique_together = ('show', 'location_number')

    def clean(self):
        # Extra validation to ensure videos from different shows aren't set to a location
        if self.video and self.video.show != self.show:
            raise ValidationError("The video must belong to the same show as the location.")

    def __str__(self):
        if self.pk: return f"{self.show.title}, L:{self.location_number}\
            {'' if self.video == None else f' - ({self.video.title})'}"
        else: return "Deleted Location"
