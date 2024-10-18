# videos/helpers.py
# Helper functions for code in this videos app

from django.core.exceptions import ObjectDoesNotExist
from rest_framework.serializers import ValidationError

def obj_exists(obj):
    """Helper function. Returns true if an object exists in a database, returns
    false if otherwise."""
    try:
        # Try to refresh the object from the database
        obj.refresh_from_db()
    except ObjectDoesNotExist:
        return False
    else:
        return True
    
def clean_error_message(error):
    """ Takes a serializers.ValidationError `error` and converts it to 
    string form, dropping all the unnecessary fluff around the error itself.
    Returns this string. """
    # If error is a ValidationError, clean it
    if isinstance(error, ValidationError):
        error_message = str(error)
        # Strip unnecessary parts of error
        error_message = error_message.replace("ErrorDetail(string=", "").replace(", code='invalid')", "")
        error_message = error_message.replace("[", "").replace("]", "").replace('"', "").replace("'", "")
        return error_message

    # Otherwise, return it as is
    return str(error)