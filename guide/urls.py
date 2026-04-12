from django.urls import path
from . import api_views

urlpatterns = [
    path('feed/', api_views.feed, name='api_feed'),
    path('login/', api_views.login, name='api_login'),
    path('register/', api_views.register, name='api_register'),
    path('logout/', api_views.logout, name='api_logout'),
    path('objects/', api_views.objects_list, name='api_objects'),
    path('routes/', api_views.routes_list, name='api_routes'),
    path('profile/', api_views.profile, name='api_profile'),
    path('weather/', api_views.weather, name='api_weather'),
    path('location/<int:location_id>/', api_views.location_detail, name='api_location_detail'),
    path('toggle_favorite/<int:location_id>/', api_views.toggle_favorite, name='api_toggle_favorite'),
    path('toggle_visited/<int:location_id>/', api_views.toggle_visited, name='api_toggle_visited'),
    path('current_user/', api_views.current_user, name='api_current_user'),
]
