from django.contrib import admin
from .models import Brick, Status

# Register your models here.
@admin.register(Brick)
class BrickAdmin(admin.ModelAdmin):
    # list_display = ('id', 'brick')
    filter_horizontal = ('statuses',)

admin.site.register(Status)