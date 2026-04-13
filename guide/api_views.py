import requests
from django.db.models import Avg
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from .models import Location, Event, Route, Transport, Favorite, VisitedLocation, Review
from .serializers import (UserSerializer, LocationSerializer, EventSerializer, 
                          RouteSerializer, TransportSerializer, ReviewSerializer)

User = get_user_model()

KMAO_CITIES = [
    {"name": "Ханты-Мансийск", "lat": 61.003, "lon": 69.017},
    {"name": "Сургут",         "lat": 61.254, "lon": 73.396},
    {"name": "Нижневартовск",  "lat": 60.938, "lon": 76.570},
    {"name": "Нефтеюганск",    "lat": 61.096, "lon": 72.610},
    {"name": "Когалым",        "lat": 62.264, "lon": 74.479},
    {"name": "Лянтор",         "lat": 61.616, "lon": 72.155},
]

def get_weather_data(city_index=0):
    city = KMAO_CITIES[city_index % len(KMAO_CITIES)]
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={city['lat']}&longitude={city['lon']}"
            f"&current_weather=true"
        )
        # Reduced timeout to 1.5s to prevent UI hangs
        r = requests.get(url, timeout=1.5)
        cw = r.json().get('current_weather', {})
        return {
            'temperature': cw.get('temperature', 0),
            'windspeed': cw.get('windspeed', 0),
            'city': city['name'],
            'all_cities': [c['name'] for c in KMAO_CITIES],
        }
    except Exception:
        return {'temperature': 0, 'windspeed': 0, 'city': city['name'], 'all_cities': [c['name'] for c in KMAO_CITIES]}

def get_meta(user):
    fav_ids = set()
    visited_ids = set()
    if user.is_authenticated:
        fav_ids = set(Favorite.objects.filter(user=user, item_type='location').values_list('item_id', flat=True))
        visited_ids = set(VisitedLocation.objects.filter(user=user).values_list('location_id', flat=True))
    return {'fav_ids': list(fav_ids), 'visited_ids': list(visited_ids)}

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user:
        auth_login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    return Response({'error': 'Неверный логин или пароль'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    phone = request.data.get('phone', '')
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Пользователь с таким именем уже существует'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, email=email, password=password,
                                    first_name=first_name, last_name=last_name, phone=phone)
    auth_login(request, user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'user': UserSerializer(user).data,
        'token': token.key
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    auth_logout(request)
    return Response({'status': 'ok'})

@api_view(['GET'])
@permission_classes([AllowAny])
def feed(request):
    locations = Location.objects.order_by('-rating')[:50]
    events = Event.objects.select_related('location').order_by('start_time')[:30]
    weather = get_weather_data()
    return Response({
        'locations': LocationSerializer(locations, many=True).data,
        'events': EventSerializer(events, many=True).data,
        'weather': weather,
        'meta': get_meta(request.user)
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def objects_list(request):
    search = request.GET.get('q', '')
    category = request.GET.get('category', '')
    locations = Location.objects.all()
    if search:
        locations = locations.filter(name__icontains=search)
    if category:
        locations = locations.filter(category__icontains=category)
    categories = Location.objects.values_list('category', flat=True).distinct()
    return Response({
        'locations': LocationSerializer(locations.order_by('name')[:300], many=True).data,
        'categories': list(categories),
        'meta': get_meta(request.user)
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def routes_list(request):
    routes = Route.objects.all()
    transports_raw = Transport.objects.order_by('city', 'type')
    transports_by_city = {}
    for t in transports_raw:
        if t.city not in transports_by_city:
            transports_by_city[t.city] = []
        transports_by_city[t.city].append(TransportSerializer(t).data)
    
    return Response({
        'routes': RouteSerializer(routes, many=True).data,
        'transports_by_city': transports_by_city
    })

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def location_detail(request, location_id):
    try:
        location = Location.objects.get(id=location_id)
    except Location.DoesNotExist:
        return Response(status=404)
        
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Необходима авторизация'}, status=status.HTTP_401_UNAUTHORIZED)
        rating = request.data.get('rating')
        text = request.data.get('text')
        if rating and text:
            Review.objects.create(user=request.user, location=location, rating=int(rating), text=text)
            avg_rating = Review.objects.filter(location=location).aggregate(Avg('rating'))['rating__avg']
            location.rating = round(avg_rating, 1) if avg_rating else 0.0
            location.save()
            return Response({'status': 'ok'})
            
    reviews = location.reviews.select_related('user').order_by('-created_at')
    return Response({
        'location': LocationSerializer(location).data,
        'reviews': ReviewSerializer(reviews, many=True).data,
        'meta': get_meta(request.user)
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'POST' and request.FILES.get('avatar'):
        request.user.avatar = request.FILES['avatar']
        request.user.save()
        return Response({'status': 'ok', 'avatar': request.user.avatar.url})

    favorites = Favorite.objects.filter(user=request.user, item_type='location').order_by('-added_at')
    review_count = request.user.reviews.count()
    visited_count = request.user.visited_locations.count()
    
    fav_locations = []
    for fav in favorites:
        try:
            loc = Location.objects.get(id=fav.item_id)
            fav_locations.append(loc)
        except Location.DoesNotExist:
            pass
            
    return Response({
        'user': UserSerializer(request.user).data,
        'fav_locations': LocationSerializer(fav_locations, many=True).data,
        'review_count': review_count,
        'visited_count': visited_count,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, location_id):
    fav, created = Favorite.objects.get_or_create(user=request.user, item_type='location', item_id=location_id)
    if not created:
        fav.delete()
        status_action = 'removed'
    else:
        status_action = 'added'
    return Response({'status': status_action})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_visited(request, location_id):
    location = Location.objects.get(id=location_id)
    visited, created = VisitedLocation.objects.get_or_create(user=request.user, location=location)
    if not created:
        visited.delete()
        status_action = 'removed'
    else:
        status_action = 'added'
    return Response({'status': status_action})

@api_view(['GET'])
@permission_classes([AllowAny])
def weather(request):
    city_index = int(request.GET.get('city', 0))
    weather_data = get_weather_data(city_index)
    return Response({'weather': weather_data, 'city_index': city_index})

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def current_user(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    return Response(None)
