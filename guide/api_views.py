import requests
from django.db.models import Avg
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import connection
from .models import Location, Event, Route, Transport, Favorite, VisitedLocation, Review
from .serializers import (UserSerializer, LocationSerializer, EventSerializer, 
                          RouteSerializer, TransportSerializer, ReviewSerializer)

User = get_user_model()

def dictfetchall(cursor):
    """Return all rows from a cursor as a dict"""
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.description and cursor.fetchall()
    ]

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
    fav_ids = []
    visited_ids = []
    if user.is_authenticated:
        with connection.cursor() as cursor:
            cursor.execute("SELECT item_id FROM guide_favorite WHERE user_id = %s AND item_type = 'location'", [user.id])
            fav_ids = [row[0] for row in cursor.fetchall()]
            
            cursor.execute("SELECT location_id FROM guide_visitedlocation WHERE user_id = %s", [user.id])
            visited_ids = [row[0] for row in cursor.fetchall()]
            
    return {'fav_ids': fav_ids, 'visited_ids': visited_ids}

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user:
        auth_login(request, user)
        return Response(UserSerializer(user).data)
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
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM guide_user WHERE username = %s", [username])
        if cursor.fetchone():
            return Response({'error': 'Пользователь с таким именем уже существует'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Для создания пользователя всё же используем Django create_user (для хеширования пароля), 
    # но проверку существования выше сделали через RAW SQL
    user = User.objects.create_user(username=username, email=email, password=password,
                                    first_name=first_name, last_name=last_name, phone=phone)
    auth_login(request, user)
    return Response(UserSerializer(user).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    auth_logout(request)
    return Response({'status': 'ok'})

@api_view(['GET'])
@permission_classes([AllowAny])
def feed(request):
    with connection.cursor() as cursor:
        # Raw SQL выборка мест
        cursor.execute("SELECT * FROM guide_location ORDER BY rating DESC LIMIT 50")
        locations = dictfetchall(cursor)
        
        # Raw SQL выборка событий с JOIN места
        cursor.execute("""
            SELECT e.*, l.name as location_name 
            FROM guide_event e
            LEFT JOIN guide_location l ON e.location_id = l.id
            ORDER BY e.start_time ASC LIMIT 30
        """)
        events = dictfetchall(cursor)

    weather = get_weather_data()
    return Response({
        'locations': locations,  # Данные уже в формате словарей
        'events': events,
        'weather': weather,
        'meta': get_meta(request.user)
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def objects_list(request):
    search = request.GET.get('q', '')
    category = request.GET.get('category', '')
    
    sql = "SELECT * FROM guide_location WHERE 1=1"
    params = []
    if search:
        sql += " AND name LIKE %s"
        params.append(f"%{search}%")
    if category:
        sql += " AND category LIKE %s"
        params.append(f"%{category}%")
    
    sql += " ORDER BY name LIMIT 300"
    
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        locations = dictfetchall(cursor)
        
        cursor.execute("SELECT DISTINCT category FROM guide_location")
        categories = [row[0] for row in cursor.fetchall()]

    return Response({
        'locations': locations,
        'categories': categories,
        'meta': get_meta(request.user)
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def routes_list(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM guide_route")
        routes = dictfetchall(cursor)
        
        cursor.execute("SELECT * FROM guide_transport ORDER BY city, type")
        transports_raw = dictfetchall(cursor)
    
    transports_by_city = {}
    for t in transports_raw:
        city = t['city']
        if city not in transports_by_city:
            transports_by_city[city] = []
        transports_by_city[city].append(t)
    
    return Response({
        'routes': routes,
        'transports_by_city': transports_by_city
    })

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def location_detail(request, location_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM guide_location WHERE id = %s", [location_id])
        location_rows = dictfetchall(cursor)
        if not location_rows:
            return Response(status=404)
        location = location_rows[0]
            
        if request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({'error': 'Необходима авторизация'}, status=status.HTTP_401_UNAUTHORIZED)
            rating = request.data.get('rating')
            text = request.data.get('text')
            if rating and text:
                # Raw SQL INSERT для отзыва
                cursor.execute("""
                    INSERT INTO guide_review (user_id, location_id, rating, text, created_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, [request.user.id, location_id, int(rating), text])
                
                # Raw SQL обновление рейтинга места
                cursor.execute("SELECT AVG(rating) FROM guide_review WHERE location_id = %s", [location_id])
                avg_rating = cursor.fetchone()[0]
                new_rating = round(float(avg_rating), 1) if avg_rating else 0.0
                cursor.execute("UPDATE guide_location SET rating = %s WHERE id = %s", [new_rating, location_id])
                return Response({'status': 'ok'})
                
        # Raw SQL выборка отзывов с JOIN пользователя
        cursor.execute("""
            SELECT r.*, u.username as user_name
            FROM guide_review r
            JOIN guide_user u ON r.user_id = u.id
            WHERE r.location_id = %s
            ORDER BY r.created_at DESC
        """, [location_id])
        reviews = dictfetchall(cursor)

    return Response({
        'location': location,
        'reviews': reviews,
        'meta': get_meta(request.user)
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'POST' and request.FILES.get('avatar'):
        request.user.avatar = request.FILES['avatar']
        request.user.save()
        return Response({'status': 'ok', 'avatar': request.user.avatar.url})

    with connection.cursor() as cursor:
        # RAW SQL: получение избранных локаций через JOIN или IN
        cursor.execute("""
            SELECT l.* FROM guide_location l
            JOIN guide_favorite f ON l.id = f.item_id
            WHERE f.user_id = %s AND f.item_type = 'location'
            ORDER BY f.added_at DESC
        """, [request.user.id])
        fav_locations = dictfetchall(cursor)
        
        # RAW SQL: подсчет отзывов и посещений
        cursor.execute("SELECT COUNT(*) FROM guide_review WHERE user_id = %s", [request.user.id])
        review_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM guide_visitedlocation WHERE user_id = %s", [request.user.id])
        visited_count = cursor.fetchone()[0]
            
    return Response({
        'user': UserSerializer(request.user).data,
        'fav_locations': fav_locations,
        'review_count': review_count,
        'visited_count': visited_count,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, location_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM guide_favorite WHERE user_id = %s AND item_type = 'location' AND item_id = %s", 
                       [request.user.id, location_id])
        row = cursor.fetchone()
        if row:
            cursor.execute("DELETE FROM guide_favorite WHERE id = %s", [row[0]])
            status_action = 'removed'
        else:
            cursor.execute("INSERT INTO guide_favorite (user_id, item_type, item_id, added_at) VALUES (%s, %s, %s, NOW())", 
                           [request.user.id, 'location', location_id])
            status_action = 'added'
    return Response({'status': status_action})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_visited(request, location_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM guide_visitedlocation WHERE user_id = %s AND location_id = %s", 
                       [request.user.id, location_id])
        row = cursor.fetchone()
        if row:
            cursor.execute("DELETE FROM guide_visitedlocation WHERE id = %s", [row[0]])
            status_action = 'removed'
        else:
            cursor.execute("INSERT INTO guide_visitedlocation (user_id, location_id, visited_at) VALUES (%s, %s, NOW())", 
                           [request.user.id, location_id])
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
