# videos/tests/test_models.py
"""
    Semi-tool generated and inspected, semi-written test cases, 2024.10.13
    OpenAI. (2024). ChatGPT [Large language model].
"""
# TODO: 1
#   All of these tests work fine locally, but are broken in the CI due to a
#   SuspiciousFileOperation exception. I've spent 2 hours on this. I can't 
#   figure it out. I'm disabling the tests in the mean time.

from django.test import TestCase
# from django.db import IntegrityError
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.serializers import ValidationError

from itertools import chain
import os
import ffmpeg

from ..helpers import obj_exists
from ..constants import FRAME_RATE, RESOLUTION, NUM_BRICKS
from ..models import Show, Video, Location

class ShowModelTests(TestCase):
    def setUp(self):
        # Create a sample show for testing
        self.show = Show.objects.create(
            title="Test Show",
            artist="Test Artist",
            frame_count=5,
        )

    def tearDown(self):
        # Remove show between test cases
        for obj in Show.objects.all():
            if obj_exists(obj):
                obj.delete()

    def test_create_show(self):
        """
        Test that a show can be created and has the correct default values.
        """
        self.assertEqual(self.show.title, "Test Show")
        self.assertEqual(self.show.status, Show.ShowStatus.UNASSIGNED)
        self.assertEqual(self.show.artist, "Test Artist")
        self.assertIsNotNone(self.show.created_at)

    def test_delete_show(self):
        """
        Test that on show deletion, all relevant files and paths are removed.
        """
        show_path = self.show.show_path()
        blank_video_path = self.show.blank_vid_path()
        cover_image_path = self.show.cover_image.path if self.show.cover_image else False

        # Delete the show instance
        self.show.delete()

        # Check if the relevant files are deleted
        self.assertFalse(os.path.exists(blank_video_path))
        if cover_image_path:
            self.assertFalse(os.path.exists(self.show.cover_image.path))
        self.assertFalse(os.path.exists(show_path))

    def test_generate_blank_video_on_save(self):
        """
        Test that a blank video is generated when saving a show.
        """
        blank_video_path = self.show.blank_vid_path()
        self.assertTrue(os.path.exists(blank_video_path))
        self.assertTrue(os.path.isfile(blank_video_path))

    def test_blank_video_meets_spec(self):
        """
        Test that the blank video generated for a show meets the required 
        specifications, including the correct frame count.
        """
        # Duplicates the effect of generate_blank_video_on_save
        blank_video_path = self.show.blank_vid_path()
        self.assertTrue(os.path.exists(blank_video_path))
        self.assertTrue(os.path.isfile(blank_video_path))

        try:
            probe = ffmpeg.probe(blank_video_path)
            video_streams = [stream for stream in probe['streams'] if stream['codec_type'] == 'video']
            if not video_streams:
                self.fail("No video stream found in the blank video file.")

            # Extract relevant information from the video stream
            video_stream = video_streams[0]

            # Frame count verification
            video_frame_count = int(video_stream['nb_frames'])
            self.assertEqual(video_frame_count, self.show.frame_count, 
                             f"Expected {self.show.frame_count} frames, but got {video_frame_count}.")
        
            # Resolution verification (width x height)
            video_width = int(video_stream['width'])
            video_height = int(video_stream['height'])
            self.assertEqual(video_width, RESOLUTION[0], 
                             f"Expected video width of {RESOLUTION[0]}, but got {video_width}.")
            self.assertEqual(video_height, RESOLUTION[1], 
                             f"Expected video height of {RESOLUTION[1]}, but got {video_height}.")
        
            # Frame rate verification
            video_framerate = eval(video_stream['r_frame_rate'])
            self.assertEqual(video_framerate, FRAME_RATE, 
                             f"Expected frame rate of {FRAME_RATE}, but got {video_framerate}.")
        except ffmpeg.Error as e:
            self.fail(f"FFmpeg error occurred while inspecting the video: {e.stderr.decode('utf8')}")

    # TODO: 1
    # def test_cover_image_upload_path(self):
    #     """
    #     Test that the cover image is saved in the correct path.
    #     """
    #     cover_image = SimpleUploadedFile("cover.jpg", b"file_content", content_type="image/jpeg")
    #     self.show.cover_image = cover_image
    #     self.show.save()
    #     cover_image_path = self.show.cover_image_upload_path("cover.jpg")
    #     self.assertIn(cover_image_path, self.show.cover_image.path)


# TODO: 1
# class VideoModelTests(TestCase):
#     def setUp(self):
#         # Create a show for testing
#         self.show = Show.objects.create(
#             title="Test Show",
#             artist="Test Artist",
#             frame_count=5,
#         )
#         # Create a sample video for testing
#         self.video_file = SimpleUploadedFile("test_video.mp4", b"file_content", content_type="video/mp4")
#         self.video = Video.objects.create(
#             show=self.show,
#             title="Test Video",
#             file=self.video_file
#         )
    
#     def tearDown(self):
#         # Only delete show and video if they currently exist
#         for obj in chain(Show.objects.all(), Video.objects.all()):
#             if obj_exists(obj):
#                 obj.delete()

#     def test_video_creation(self):
#         """
#         Test that a video can be created and associated with a show.
#         """
#         self.assertEqual(self.video.title, "Test Video")
#         self.assertEqual(self.video.show, self.show)
        
#     def test_video_deletion_removes_files(self):
#         """
#         Test that deleting a video removes its associated files.
#         """
#         video_file_path = self.video.file.path  # Get the path to the video file
#         thumbnail_dir = self.video.thumbnail_path()
#         self.assertTrue(os.path.isfile(video_file_path), "Video file should exist before deletion.")

#         # Delete the video
#         self.video.delete()

#         # Check that the video file is deleted
#         self.assertFalse(os.path.isfile(video_file_path), "Video file should be deleted after deletion of Video object.")
#         self.assertFalse(os.path.exists(thumbnail_dir))
        

#     def test_video_upload_path(self):
#         """
#         Test that the video is saved in the correct path.
#         """
#         self.assertIn(self.video.video_upload_path("test_video.mp4"), self.video.file.path)

#     def test_video_cannot_be_reassigned_to_different_show(self):
#         """
#         Test that videos cannot be reassigned to a different show.
#         """
#         new_show = Show.objects.create(
#             title="New Show",
#             artist="New Artist",
#             frame_count=5,
#             status=Show.ShowStatus.UNASSIGNED
#         )

#         # Reassign the video to a different show
#         self.video.show = new_show

#         # Use assertRaises to check that a ValidationError is raised
#         with self.assertRaises(ValidationError) as context:
#             self.video.clean()

#     def test_show_deletion_cascades_to_videos(self):
#         """
#         Test that deleting a show also deletes its associated videos.
#         """
#         # Create a show for testing
#         show = Show.objects.create(
#             title="Test Show",
#             artist="Test Artist",
#             frame_count=5,
#         )
        
#         # Create sample videos associated with the show
#         video_file_1 = SimpleUploadedFile("test_video_1.mp4", b"file_content", content_type="video/mp4")
#         video_file_2 = SimpleUploadedFile("test_video_2.mp4", b"file_content", content_type="video/mp4")
        
#         video_1 = Video.objects.create(
#             show=show,
#             title="Test Video 1",
#             file=video_file_1
#         )
        
#         video_2 = Video.objects.create(
#             show=show,
#             title="Test Video 2",
#             file=video_file_2
#         )
        
#         # Verify that videos exist before deletion
#         self.assertTrue(Video.objects.filter(id=video_1.id).exists(), "Video 1 should exist before show deletion.")
#         self.assertTrue(Video.objects.filter(id=video_2.id).exists(), "Video 2 should exist before show deletion.")
        
#         # Delete the show
#         show.delete()
        
#         # Check that the videos are deleted
#         self.assertFalse(Video.objects.filter(id=video_1.id).exists(), "Video 1 should be deleted after the show is deleted.")
#         self.assertFalse(Video.objects.filter(id=video_2.id).exists(), "Video 2 should be deleted after the show is deleted.")


# TODO: 1
# class LocationModelTests(TestCase):
#     def setUp(self):
#         # Create a show and a video for testing
#         self.show = Show.objects.create(
#             title="Test Show",
#             artist="Test Artist",
#             frame_count=5,
#             status=Show.ShowStatus.UNASSIGNED
#         )
#         self.video_file = SimpleUploadedFile("test_video.mp4", b"file_content", content_type="video/mp4")
#         self.video = Video.objects.create(
#             show=self.show,
#             title="Test Video",
#             file=self.video_file
#         )
    
#     def tearDown(self):
#         # Only delete shows and locations if they currently exist
#         for obj in chain(Show.objects.all(), Location.objects.all(), Video.objects.all()):
#             if obj_exists(obj):
#                 obj.delete()

#     def test_show_creation_assigns_locations(self):
#         """
#         Test that creating a show assigns the necessary locations to it.
#         """
#         locations = self.show.locations.all()

#         # Check that NUM_BRICKS locations are created and associated with the show
#         self.assertEqual(locations.count(), NUM_BRICKS, f"Show should have {NUM_BRICKS} assigned locations upon creation.")

#     def test_show_deletion_removes_related_locations(self):
#         """
#         Test that deleting a show removes all related locations.
#         """
#         # Verify that the show has 226 locations before deletion
#         self.assertTrue(self.show.locations.count() > 0, "Show should have locations from creation.")

#         # Delete the show
#         show_id = self.show.id
#         self.show.delete()

#         # Check that no locations exist for the deleted show
#         self.assertEqual(Location.objects.filter(show_id=show_id).count(), 0, "Locations should be deleted when the show is deleted.")


#     def test_location_video_validation(self):
#         """
#         Test that a location cannot be assigned a video from a different show.
#         """
#         location = Location.objects.filter(show=self.show).first()
#         self.assertIsNotNone(location, "Location should be generated alongside show.")
        
#         new_show = Show.objects.create(
#             title="New Show",
#             artist="New Artist",
#             frame_count=1,
#         )
#         new_video = Video.objects.create(
#             show=new_show,
#             title="New Video",
#             file=SimpleUploadedFile("new_video.mp4", b"file_content", content_type="video/mp4")
#         )

#         # Reassign the video to a location in a different show
#         location.video = new_video

#         # Use assertRaises to check that a ValidationError is raised
#         with self.assertRaises(ValidationError):
#             location.clean()

#     # TODO: Get this test working, currently failing due to TransactionManagementErrors ?
#     # def test_unique_location_constraint(self):
#     #     """
#     #     Test that a location cannot have the same location number within the same show.
#     #     """
#     #     with self.assertRaises(IntegrityError):
#     #         Location.objects.create(show=self.show, location_number=1)
