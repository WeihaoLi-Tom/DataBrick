# cropfile.py
#   Contains the function `crop_file_duration` used to validate and crop frame
#   rate of video and gif files.

from rest_framework.serializers import ValidationError
from moviepy.editor import VideoFileClip

import ffmpeg

import os
import uuid

from ..constants import FRAME_RATE, FRAME_MARGIN, RESOLUTION, VID_EXTENSION, TMP_PATH

def tmp_move(file_path: str, file_type: str=VID_EXTENSION) -> str:
    """Takes a path `file_path` and moves a file at this given location to 
    TMP_PATH/tmpfile_{unique_id}, returning this new path as a string."""
    os.makedirs(TMP_PATH, exist_ok=True)
    unique_id = str(uuid.uuid4())
    tmp_file_path = os.path.join(TMP_PATH, f'tmpfile_{unique_id}.{file_type}')
    os.rename(file_path, tmp_file_path)
    return tmp_file_path

def tmp_clean(file_path: str) -> None | Exception:
    """Attempts to delete a file at `file_path` if it exists. Returns None or an
    Exception if deletion raises an error."""
    try: 
        if os.path.exists(file_path): 
            os.remove(file_path)
            # Make sure the removed file is actually removed
            assert(not os.path.exists(file_path))
    except Exception as e:
        raise e

# Crop video resolution
def crop_file_resolution(file_path: str, crop_x: int, crop_y: int, show_frames: int,
                         resolution: tuple[int,int]=RESOLUTION):
    """Takes a video at `file_path`, and saves a file cropped from coords 
    (`crop_x`,`crop_y`) of dimensions `resolution` over the top of it. Raises an
    exception if cropping fails."""
    tmp_path = None
    try:
        # If resolution already matching, no need to crop
        video_clip = VideoFileClip(file_path)
        resolution = video_clip.size
        video_clip.close()
        if valid_resolution(resolution, strict=True): return

        # Move the original video to a temporary location (to avoid overwriting 
        # it during the resolution cropping process)
        tmp_path = tmp_move(file_path)

        # Then crop resolution of video using the provided coords
        crop_clip_resolution(tmp_path, file_path, crop_x, crop_y, show_frames)

    except Exception as e:
        raise e
    finally:
        if tmp_path: tmp_clean(tmp_path)

def crop_clip_resolution(input_path: str, out_path: str, crop_x: int, crop_y: int, 
                         show_frames: int, resolution: tuple[int, int]=RESOLUTION):
    """
    Crops a video using `ffmpeg-python` and saves it to `out_path`.
    Args:
        input_path (str): Path to the input video file.
        out_path (str): Path to save the cropped output video file.
        crop_x (int): X-coordinate of the top-left corner to start cropping.
        crop_y (int): Y-coordinate of the top-left corner to start cropping.
        resolution (tuple): A tuple (width, height) indicating the crop size.
    """
    try:
        # Define the cropping filter
        width, height = resolution
        ffmpeg.input(input_path) \
            .crop(x=crop_x, y=crop_y, width=width, height=height) \
            .output(out_path, codec='libx264') \
            .run(overwrite_output=True)
    
        # Get the duration of the input video
        probe = ffmpeg.probe(out_path)
        cropped_frames = int(probe['streams'][0]['nb_frames'])
        if cropped_frames > show_frames:
            cropped_output_path = tmp_move(out_path)  # Temporary path for cropped video

            input_file = ffmpeg.input(cropped_output_path)
            output_file = ffmpeg.output(input_file.trim(start_frame=0, end_frame=show_frames), out_path)
            ffmpeg.run(output_file)

            tmp_clean(cropped_output_path)
        elif (cropped_frames < show_frames):
            raise ValidationError(f"Video could not successfully crop to {width}x{height}.")                            
    except Exception as e:
        raise e

# Validate and crop video frames
def crop_file_duration(file_path: str, crop_frames: int, gif: bool,
                       fps: int=FRAME_RATE):
    """Takes a video or gif file at `file_path`, and saves a file of frame_count 
    `crop_frames` over the top of it if necessary. If frame count already equals
    crop_frames, does nothing. Raises a ValidationError if duration is outside 
    cropping margin FRAME_MARGIN or if cropping action fails frame accuracy."""
    # Find media type for error raising
    if gif: media_type = "GIF"
    else: media_type = "Video"

    try: 
        # If frame count already matching, no need to crop
        if validate_length(file_path, crop_frames): return

        # Move the original file to a temporary location (to avoid 
        # overwriting it during the duration cropping process)
        tmp_path = tmp_move(file_path)

        input_file = ffmpeg.input(tmp_path)
        output_file = ffmpeg.output(input_file.trim(start_frame=0, end_frame=crop_frames), file_path)
        ffmpeg.run(output_file)

        # Reopen VideoFileClip after cropping and check successful
        probe = ffmpeg.probe(file_path)
        frames = int(probe['streams'][0]['nb_frames'])
        if frames != crop_frames:
            raise ValidationError(f"{media_type} could not successfully crop to {crop_frames} frames, got {frames} frames instead.")                
        tmp_clean(tmp_path)
    except Exception as e:
        tmp_clean(tmp_path)
        raise e

def crop_image_resolution(image_path: str, crop_x: int, crop_y: int, 
                            resolution: tuple[int, int]=RESOLUTION):
    """
    Crop an image's resolution, so that it can be converted to a video later

    Args:
        image_path (str): Path to the input image file.
        crop_x (int): X-coordinate of the top-left corner to start cropping.
        crop_y (int): Y-coordinate of the top-left corner to start cropping.
        resolution (tuple): A tuple (width, height) indicating the crop size.
    """
    # Convert video to correct extension if necessary
    extension = os.path.splitext(image_path)[-1].lower()
    # Drop the '.'
    extension = extension[1:]

    try:
        tmp_path = tmp_move(image_path, extension)
        # Define the cropping filter
        width, height = resolution
        ffmpeg.input(tmp_path) \
            .crop(x=crop_x, y=crop_y, width=width, height=height) \
            .output(image_path, format='image2', pix_fmt='yuvj420p') \
            .run(overwrite_output=True)
    except Exception as e:
        raise e
    finally:
        tmp_clean(tmp_path)

def convert_video_from_image(image_path: str, output_path: str, duration: float, frame_rate: int, show_frames: int):
    """
    Creates a video from an image using `ffmpeg`.

    Args:
        image_path (str): Path to the input image file.
        output_path (str): Path to save the output video file.
        duration (float): Duration of the output video in seconds.
        frame_rate (int): Frame rate of the output video.
    """
    # Using ffmpeg to create a video from the image
    try:
        ffmpeg.input(image_path, loop=1, t=duration) \
              .output(output_path, vcodec='libx264', r=frame_rate, pix_fmt='yuv420p', shortest=None) \
              .run(overwrite_output=True)
        
        # Get the duration of the input video
        probe = ffmpeg.probe(output_path)
        cropped_frames = int(probe['streams'][0]['nb_frames'])
        if (cropped_frames < show_frames):
            duration_to_add = (show_frames-cropped_frames) / frame_rate
            tmp_path=tmp_move(output_path)
            # Duplicating the frame at the end of the video
            ffmpeg.input(tmp_path) \
                    .filter('tpad', stop_mode='clone', stop_duration=duration_to_add) \
                    .output(output_path, vcodec='libx264', acodec='aac') \
                    .run(overwrite_output=True)
            tmp_clean(tmp_path)
            
        if cropped_frames > show_frames:
            cropped_output_path = tmp_move(output_path)  # Temporary path for cropped video

            input_file = ffmpeg.input(cropped_output_path)
            output_file = ffmpeg.output(input_file.trim(start_frame=0, end_frame=show_frames), output_path)
            ffmpeg.run(output_file)
            tmp_clean(cropped_output_path)
        
    except Exception as e:
        raise e

def validate_length(file_path: str, crop_frames: int):
    """Takes a path to a video `file_path` and needed frame count `crop_frames`.
    Returns False if the video frame count doesn't match `crop_frames` but is
    longer than desired by less than a specified FRAME_MARGIN, and returns True
    if frame counts match. Raises a ValidationError otherwise."""
    probe = ffmpeg.probe(file_path)
    frames = int(probe['streams'][0]['nb_frames'])
    
    # Return True if frame counts match
    if frames == crop_frames: return True

    # Otherwise check if not enough frames / too many frames to shorten
    elif frames > crop_frames:
        # (Check if videos fit within margin)
        if frames < crop_frames + FRAME_MARGIN: return False
        relation = ">"
    else: relation = "<"

    raise ValidationError(f"Media frame count ({frames}) {relation} needed frame count ({crop_frames}).")

def valid_resolution(current_res: tuple[int,int], 
                        needed_res: tuple[int,int]=RESOLUTION, strict: bool=False) -> bool:
    """Returns true if resolution `current_res` exceeds `needed_res`. In the 
    case that `strict` is set to True, only returns true if resolution is 
    EXACTLY equal to that needed."""
    if strict: return current_res[0] == needed_res[0] and \
        current_res[1] == needed_res[1]
    return not(current_res[0] < needed_res[0] or current_res[1] < needed_res[1])