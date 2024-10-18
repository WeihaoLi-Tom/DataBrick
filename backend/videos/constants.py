# videos/constants.py
from os import getenv

# VIDEO FILE CONSTRAINTS
RESOLUTION = (854, 480)         # Pixels:   480p 16:9
FRAME_RATE = 30                 # FPS:      30 FPS
MARGIN_ON = True                # (bool):   Indicates if longer videos will be trimmed or rejected
TRIM_MARGIN = 60                # Frames:   Longer videos (but by less than this amount) will be trimmed
TIME_LIMIT = 5*60               # Seconds:  5 minute cap

# OUTPUT FILE TYPES
VID_EXTENSION = 'mp4'           # Preferred video file extension
IMG_EXTENSION = 'jpeg'          # Preferred video thumbnail image file extension

# OUTPUT DIRECTORIES
SHOW_PATH = 'shows'             # Path inside settings.MEDIA_ROOT in which shows will be stored
TMP_PATH = 'tmp'                # Path for temporarily moved files to be stored


# -------------------- === !!! Advised NOT to touch !!! === --------------------
# VIDEO FILE CONSTRAINTS
FRONTEND_FPS_RANGE = 5          # Frontend validation will allow +/- these frames
FRAME_DECIMAL_TOLERANCE = 1     # Decimal place accuracy of framerate
FRAME_MARGIN = TRIM_MARGIN if MARGIN_ON else 0      # The frame margin for accepting videos too long

# MIGRATION GENERATION - (`py manage.py makemigrations`)
MEDIA_PATH_MAX_LENGTH = 300     # The maximum path length for an uploaded and stored file. 

# WALL CONSTRAINTS
NUM_BRICKS = int(getenv('NUM_BRICKS', '226'))   # The number of bricks displayed on the melb connect wall
