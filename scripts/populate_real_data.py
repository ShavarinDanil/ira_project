import os
import sys
import django

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yugra_project.settings')
django.setup()

from guide.models import Location, Event, Route

def update_photos():
    print("Updating real photos for KHMAO landmarks...")

    # Locations
    location_updates = [
        (["Народная", "Narodnaya"], "https://upload.wikimedia.org/wikipedia/commons/e/e0/Mont_Narodna%C3%AFa.jpg"),
        (["Музей природы и человека", "Nature and Man"], "https://upload.wikimedia.org/wikipedia/commons/7/77/Museum_of_Nature_and_Man%2C_Khanty-Mansiysk.jpg"),
        (["Археопарк", "Мамонты", "Archeopark"], "https://upload.wikimedia.org/wikipedia/commons/8/8c/%D0%9C%D0%B0%D0%BC%D0%B2%D0%BD%D1%82%D1%8B_in_Khanty-Mansiysk.JPG"),
        (["Биатлон", "Biathlon"], "https://ugrasport.com/wp-content/uploads/2018/03/biathlon_center.jpg"),
        (["Сургутский мост", "Bridge Surgut"], "https://upload.wikimedia.org/wikipedia/commons/0/0e/Yugra_Bridge_at_night.jpg"),
        (["Шахматная академия", "Chess Academy"], "https://upload.wikimedia.org/wikipedia/commons/3/36/Chess_Academy_Khanty-Mansiysk.jpg"),
        (["Музей геологии", "Oil and Gas Museum"], "https://upload.wikimedia.org/wikipedia/commons/e/ec/Museum_of_Oil_and_Gas%2C_Khanty-Mansiysk.jpg"),
        (["Парк Лосева", "Losev Park"], "https://upload.wikimedia.org/wikipedia/commons/2/2a/Losev_Park_Khanty-Mansiysk.jpg"),
        (["Торум Маа", "Torum Maa"], "https://upload.wikimedia.org/wikipedia/commons/b/be/Torum_Maa_Museum.jpg"),
        (["Газпром", "Gazprom"], "https://upload.wikimedia.org/wikipedia/commons/0/05/Gazprom_Transgaz_Surgut.jpg"),
    ]

    for keywords, url in location_updates:
        for kw in keywords:
            locs = Location.objects.filter(name__icontains=kw)
            if locs.exists():
                count = locs.update(photo_url=url)
                print(f"Updated {count} locations matching '{kw}' with real photo.")
                break

    # Routes
    route_updates = [
        (["мамонт", "Mammoth"], "https://upload.wikimedia.org/wikipedia/commons/8/8c/%D0%9C%D0%B0%D0%BC%D0%BE%D0%BD%D1%82%D1%8B_in_Khanty-Mansiysk.JPG"),
        (["нефтя", "Oil"], "https://upload.wikimedia.org/wikipedia/commons/e/ec/Museum_of_Oil_and_Gas%2C_Khanty-Mansiysk.jpg"),
        (["обзорн", "Sightseeing"], "https://upload.wikimedia.org/wikipedia/commons/0/0b/Khanty-Mansiysk_skyline.jpg"),
    ]

    for keywords, url in route_updates:
        for kw in keywords:
            routes = Route.objects.filter(name__icontains=kw)
            if routes.exists():
                count = routes.update(photo_url=url)
                print(f"Updated {count} routes matching '{kw}' with real photo.")
                break

    # Events
    event_updates = [
        (["лыжный", "Ski"], "https://upload.wikimedia.org/wikipedia/commons/2/23/Ski_marathon_competitors.jpg"),
        (["елка", "Christmas", "Ёлка"], "https://upload.wikimedia.org/wikipedia/commons/d/d1/Christmas_tree_in_Khanty-Mansiysk.jpg"),
        (["хоккей", "Hockey"], "https://upload.wikimedia.org/wikipedia/commons/e/e2/Ugra_Arena_Interior.jpg"),
    ]
    for keywords, url in event_updates:
        for kw in keywords:
            evs = Event.objects.filter(name__icontains=kw)
            if evs.exists():
                count = evs.update(photo_url=url)
                print(f"Updated {count} events matching '{kw}' with real photo.")
                break

if __name__ == "__main__":
    update_photos()
