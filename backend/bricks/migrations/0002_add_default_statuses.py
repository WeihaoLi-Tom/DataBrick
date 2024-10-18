from django.db import migrations

# 'NORMAL' ommitted - any brick without a status assigned is considered NORMAL.
DEFAULT_STATUSES = ['ALIGNMENT ISSUE', 'SIGNAL LOSS', 'PORT CLOSED', 'OFFLINE', 'GLUE TRIAL']

def create_default_statuses(apps, schema_editor):
    # Get the Status model from stored models registry
    Status = apps.get_model('bricks', 'Status')
        
    # Create statuses if they don't exist
    for status_name in DEFAULT_STATUSES:
        Status.objects.get_or_create(name=status_name)

# Code to remove default statuses if migration needs to be undone.
# def remove_default_statuses(apps, schema_editor):
#     Status = apps.get_model('bricks', 'Status')
#     Status.objects.filter(name__in=DEFAULT_STATUSES).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('bricks', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_statuses),
    ]
