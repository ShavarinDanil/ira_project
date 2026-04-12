import os, sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yugra_project.settings')
sys.stdout.reconfigure(encoding='utf-8')
django.setup()

from guide.models import Location

# Real curated images for KMAO locations
LOCATION_IMAGES = {
    "Природный парк «Нумто»": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Numto_lake.jpg/640px-Numto_lake.jpg",
    "Сургутский краеведческий музей": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Surgut_museum.jpg/640px-Surgut_museum.jpg",
    "Нижневартовский краеведческий музей": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Nizhnevartovsk_%281%29.jpg/640px-Nizhnevartovsk_%281%29.jpg",
    "Заповедник «Юганский»": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yugansky_Nature_Reserve.jpg/640px-Yugansky_Nature_Reserve.jpg",
    "Берёзово — историческое село": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Beryozovo_Khanty-Mansiysk.jpg/640px-Beryozovo_Khanty-Mansiysk.jpg",
    "Музей Природы и Человека (Ханты-Мансийск)": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Museum_of_Nature_and_Man%2C_Khanty-Mansiysk.jpg/640px-Museum_of_Nature_and_Man%2C_Khanty-Mansiysk.jpg",
    "Гора Чёртов Палец (Ханты-Мансийск)": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Khanty-Mansiysk_2011_%28Chortov_Palets%29.jpg/640px-Khanty-Mansiysk_2011_%28Chortov_Palets%29.jpg",
    "Горнолыжный комплекс «Хвойный Урман»": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600",
    "Природный парк «Кондинские озёра»": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Lake_Torum_Khanty-Mansiysk.jpg/640px-Lake_Torum_Khanty-Mansiysk.jpg",
    "Этнографический музей «Торум Маа»": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Torum_Maa_museum_Khanty-Mansiysk.jpg/640px-Torum_Maa_museum_Khanty-Mansiysk.jpg",
}

# Fallbacks by category
CATEGORY_FALLBACKS = {
    "Музей": "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600",
    "Природный заповедник": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600",
    "Смотровая площадка": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
    "Достопримечательность": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    "Спортивный объект": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600",
    "default": "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600",
}

updated = 0
for loc in Location.objects.all():
    # Use curated image if available
    if loc.name in LOCATION_IMAGES:
        new_url = LOCATION_IMAGES[loc.name]
    else:
        new_url = CATEGORY_FALLBACKS.get(loc.category, CATEGORY_FALLBACKS["default"])
    
    if loc.photo_url != new_url:
        loc.photo_url = new_url
        loc.save()
        updated += 1
        print(f"Updated: {loc.name}")

print(f"\nDone! Updated {updated} locations.")
