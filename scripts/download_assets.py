import json
import os
import requests
from urllib.parse import urlparse

def download_images():
    db_path = os.path.join('frontend', 'src', 'db.json')
    assets_dir = os.path.join('frontend', 'public', 'assets', 'images')
    
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
    
    with open(db_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Starting image download to {assets_dir}...")
    
    # Process locations
    for loc in data.get('locations', []):
        url = loc.get('photo_url')
        if url and url.startswith('http'):
            filename = f"location_{loc['id']}.jpg"
            save_path = os.path.join(assets_dir, filename)
            if download_file(url, save_path):
                loc['photo_url'] = f"/assets/images/{filename}"
                print(f"Saved: {filename}")
    
    # Process events
    for event in data.get('events', []):
        url = event.get('photo_url')
        if url and url.startswith('http'):
            filename = f"event_{event['id']}.jpg"
            save_path = os.path.join(assets_dir, filename)
            if download_file(url, save_path):
                event['photo_url'] = f"/assets/images/{filename}"
                print(f"Saved: {filename}")
                
    # Process routes
    for route in data.get('routes', []):
        url = route.get('photo_url')
        if url and url.startswith('http'):
            filename = f"route_{route['id']}.jpg"
            save_path = os.path.join(assets_dir, filename)
            if download_file(url, save_path):
                route['photo_url'] = f"/assets/images/{filename}"
                print(f"Saved: {filename}")

    # Write back to db.json
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Image download and database update complete!")

def download_file(url, path):
    try:
        if os.path.exists(path):
            return True
        r = requests.get(url, stream=True, timeout=10)
        if r.status_code == 200:
            with open(path, 'wb') as f:
                for chunk in r.iter_content(1024):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

if __name__ == "__main__":
    download_images()
