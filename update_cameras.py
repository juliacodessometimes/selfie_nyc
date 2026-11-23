"""Download the NYC DOT camera list and save it as data.geojson."""
import json
import sys
import urllib.request

camera_api = 'https://webcams.nyctmc.org/api/cameras'
output = sys.argv[1] if len(sys.argv) > 1 else '/Users/lyra/Documents/GitHub/selfie_nyc/docs/script/data.geojson'

# download the camera list: a list of cameras like
# {"id", "name", "latitude", "longitude", "area", "isOnline": "true", "imageUrl"}
print('downloading', camera_api, '...')
request = urllib.request.Request(camera_api, headers={'User-Agent': 'selfie_nyc camera updater'})
with urllib.request.urlopen(request, timeout=30) as response:
    cameras = json.load(response)

# turn it into the GeoJSON the map uses: one point per online camera,
# with its name and image address
features = []
for cam in cameras:
    # isOnline is the text "true" (not true/false), so compare as text
    if str(cam.get('isOnline')).lower() != 'true' or not cam.get('imageUrl'):
        continue
    features.append({
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [float(cam['longitude']), float(cam['latitude'])],
        },
        'properties': {
            'name': cam.get('name', ''),
            # the site adds a random number to the end of this on every
            # refresh, so it gets a fresh image: ".../image?t=0.123"
            'url': cam['imageUrl'] + '?t=',
        },
    })

# don't overwrite a good file with an empty one
if not features:
    sys.exit('No online cameras in the response, so ' + output + ' was not changed.')

with open(output, 'w') as f:
    json.dump({'type': 'FeatureCollection', 'features': features}, f, indent=1)

print('saved', len(features), 'online cameras (of', len(cameras), 'total) to', output)
