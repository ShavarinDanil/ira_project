import json
import os
import sys
import django

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yugra_project.settings')
django.setup()

from guide.models import Location, Event, Route, Transport
from guide.serializers import LocationSerializer, EventSerializer, RouteSerializer, TransportSerializer

def export():
    print("Exporting database to JSON...")
    data = {
        'locations': LocationSerializer(Location.objects.all().order_by('-rating'), many=True).data,
        'events': EventSerializer(Event.objects.all().order_by('start_time'), many=True).data,
        'routes': RouteSerializer(Route.objects.all(), many=True).data,
        'transports': TransportSerializer(Transport.objects.all(), many=True).data
    }
    
    output_path = os.path.join('frontend', 'src', 'db.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully exported to {output_path}")

if __name__ == "__main__":
    export()
