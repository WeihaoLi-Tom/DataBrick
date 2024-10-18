# bricks/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from .constants import ACTION_TYPE_CHOICES, NUM_BRICKS

class Status(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return str(self.name)


class Brick(models.Model):        
    id = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(NUM_BRICKS)], primary_key=True)
    # Tagged status of a brick - can have no status (assumed healthy)
    statuses = models.ManyToManyField(Status, related_name='bricks', blank=True)

    def __str__(self):
        return "Brick: " + str(self.id)


class BrickHistory(models.Model):
    brick = models.ForeignKey('Brick', related_name='history', on_delete=models.CASCADE)
    status = models.ForeignKey('Status', on_delete=models.CASCADE)
    action_type = models.CharField(max_length=10, choices=ACTION_TYPE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.brick} - {self.status} - {self.action_type} on {self.timestamp}"