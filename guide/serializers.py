from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Location, Event, Transport, Route, RoutePoint, Favorite, VisitedLocation, Review

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'avatar']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    class Meta:
        model = Event
        fields = '__all__'

class TransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = '__all__'

class RoutePointSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    class Meta:
        model = RoutePoint
        fields = ['id', 'location', 'order']

class RouteSerializer(serializers.ModelSerializer):
    points = RoutePointSerializer(many=True, read_only=True)
    class Meta:
        model = Route
        fields = ['id', 'name', 'description', 'duration_hours', 'difficulty', 'points']

class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = '__all__'

class VisitedLocationSerializer(serializers.ModelSerializer):
    location_id = serializers.IntegerField(source='location.id', read_only=True)
    class Meta:
        model = VisitedLocation
        fields = ['id', 'user', 'location_id', 'visited_at']

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, default=serializers.CharField(source='user.username'))
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'rating', 'text', 'created_at']
