import os
import sys
import json
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yugra_project.settings')
django.setup()

from guide.models import Location, Event

def sync_from_json():
    json_path = os.path.join(os.getcwd(), 'frontend', 'src', 'db.json')
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    print(f"Loading data from {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Sync Locations
    locations_data = data.get('locations', [])
    print(f"Syncing {len(locations_data)} locations...")
    
    updated_locs = 0
    created_locs = 0
    
    for item in locations_data:
        loc_id = item.get('id')
        if not loc_id: continue
        
        defaults = {
            'name': item.get('name'),
            'latitude': item.get('latitude'),
            'longitude': item.get('longitude'),
            'description': item.get('description', ''),
            'category': item.get('category', ''),
            'working_hours': item.get('working_hours', ''),
            'photo_url': item.get('photo_url', ''),
            'rating': item.get('rating', 0.0),
        }
        
        obj, created = Location.objects.update_or_create(id=loc_id, defaults=defaults)
        if created: created_locs += 1
        else: updated_locs += 1

    print(f"Locations: {created_locs} created, {updated_locs} updated.")

    # 2. Sync Events (if they exist in db.json with mapping)
    # Note: Events usually require a foreign key to a location.
    # In db.json, they might be listed separately.
    events_data = data.get('events', [])
    if events_data:
        print(f"Syncing {len(events_data)} events...")
        updated_evs = 0
        for ev in events_data:
            # Simple sync by name if location exists
            loc_id = ev.get('locationId') or ev.get('location_id')
            if loc_id:
                try:
                    loc = Location.objects.get(id=loc_id)
                    Event.objects.update_or_create(
                        name=ev.get('name'),
                        defaults={
                            'description': ev.get('description', ''),
                            'location': loc,
                            'start_time': ev.get('startTime') or ev.get('start_time'),
                            'end_time': ev.get('endTime') or ev.get('end_time'),
                            'photo_url': ev.get('photo_url')
                        }
                    )
                    updated_evs += 1
                except Location.DoesNotExist:
                    pass
        print(f"Events: {updated_evs} synced.")

    print("\nSynchronization complete! Your database is now up to date.")

if __name__ == "__main__":
    sync_from_json()
