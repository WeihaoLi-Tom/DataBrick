# bricks/constants.py
from os import getenv

ACTION_TYPE_ADD = 'add'
ACTION_TYPE_REMOVE = 'remove'

ACTION_TYPE_CHOICES = [
    (ACTION_TYPE_ADD, 'Add'),
    (ACTION_TYPE_REMOVE, 'Remove')
]

# WALL CONTRAINTS
NUM_BRICKS = int(getenv('NUM_BRICKS', '226'))   # The number of bricks displayed on the melb connect wall
