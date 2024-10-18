from django.contrib import admin
from django.forms import ModelForm
from .models import Show, Video, Location

# Register your models here.
admin.site.register([Show])

# Register videos
class VideoAdminForm(ModelForm):
    class Meta:
        model = Video
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Don't allow reassigning videos
        if self.instance.pk:
            self.fields['show'].disabled = True

class VideoAdmin(admin.ModelAdmin):
    form = VideoAdminForm
    list_display = ('title', 'show', 'uploaded_at')

admin.site.register(Video, VideoAdmin)

# Register locations
class LocationAdminForm(ModelForm):
    class Meta:
        model = Video
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.show:
            self.fields['video'].queryset = Video.objects.filter(show=self.instance.show)
        else:
            self.fields['video'].queryset = Video.objects.none()

class LocationAdmin(admin.ModelAdmin):
    form = LocationAdminForm
    list_display = ('location_number', 'show', 'video')

admin.site.register(Location, LocationAdmin)