import os
import sys
import json
import django

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yugra_project.settings')
django.setup()

from guide.models import Route

def load_routes():
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'src', 'db.json')
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    routes_data = data.get('routes', [])
    if not routes_data:
        print("No routes found in db.json")
        return

    print(f"Deleting existing routes...")
    Route.objects.all().delete()

    print(f"Loading {len(routes_data)} routes from db.json...")
    for rd in routes_data:
        Route.objects.create(
            id=rd.get('id'),
            name=rd.get('name'),
            description=rd.get('description'),
            photo_url=rd.get('photo_url'),
            duration_hours=rd.get('duration_hours', 0),
            difficulty=rd.get('difficulty', 'Средний')
        )
    
    print("Success! Routes updated.")

if __name__ == "__main__":
    load_routes()
