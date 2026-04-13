from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username

class Location(models.Model):
    id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    working_hours = models.CharField(max_length=255, blank=True, null=True)
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    rating = models.FloatField(default=0.0)

    def __str__(self):
        return self.name

class Event(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='events', blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    ticket_link = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name

class Transport(models.Model):
    TYPES = [
        ('bus', 'Автобус'),
        ('shuttle', 'Маршрутка'),
        ('train', 'Электричка'),
        ('taxi', 'Такси'),
    ]
    city = models.CharField(max_length=100, default='Ханты-Мансийск')
    route_number = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPES)
    description = models.TextField()
    stops = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"[{self.city}] {self.route_number or ''} {self.name}"




class Route(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    duration_hours = models.FloatField()
    difficulty = models.CharField(max_length=50)
    photo_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name

class RoutePoint(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='points')
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    order = models.IntegerField()

    class Meta:
        ordering = ['order']

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    item_type = models.CharField(max_length=20, choices=[('location', 'Location'), ('event', 'Event'), ('route', 'Route')])
    item_id = models.BigIntegerField()
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'item_type', 'item_id')

class VisitedLocation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visited_locations')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='visited_by')
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'location')

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    rating = models.IntegerField()
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} on {self.location.name}"
