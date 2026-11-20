from flask import Flask, render_template, jsonify, request
from apscheduler.schedulers.background import BackgroundScheduler
import uuid
import re
import urllib.request
import urllib.parse
import geojson
import os, time

# import geojson data from file
with open('data.geojson') as g:
    geo_data = geojson.load(g)

# camera image addresses from the data file. /selfie only downloads these, so
# nobody can make the server fetch other web addresses or local files
camera_urls = [f['properties']['url'] for f in geo_data['features']
               if f.get('properties', {}).get('url')]

def is_camera_url(url):
    # must be a normal web address (no file:// etc.) that starts with one of the
    # camera addresses (the site adds a random number to the end of them)
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        return False
    # ...and is on exactly the same website as that camera
    return any(url.startswith(cam) and parsed.netloc == urllib.parse.urlparse(cam).netloc
               for cam in camera_urls)

# saved selfies look exactly like "static/my_selfie<uuid>.jpg";
# /delete only deletes files with names like that
SELFIE_PATH = re.compile(r'static/my_selfie[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg')

# largest camera image we'll save (camera images are much smaller than this)
MAX_IMAGE_BYTES = 5 * 1024 * 1024

# kills thread when flask is exited
sched = BackgroundScheduler(daemon=True)

# check and delete image job
def delete_job():
    current_time = time.time()
    selfie_list = os.scandir('static')
    # loop through static directory
    for i in selfie_list:
        # jpgs older than 10 minutes get deleted
        if i.path.endswith('.jpg') and (int((current_time - os.path.getmtime(i))) >= 600):
            try:
                os.remove(i)
            except IOError:
                pass

# job scheduled for every minute
sched.add_job(delete_job, 'interval', minutes = 1)
sched.start()

app = Flask(__name__)

# routes
@app.route('/index')
@app.route('/')
def index():
    return render_template('index.html')

# selfie image grab endpoint
# (POST only: a GET used to crash because there was no image to return)
@app.route('/selfie', methods=['POST'])
def image_grab():
    # pass external image url from AJAX
    selfie_url = request.data.decode('utf-8').strip()
    # only camera images from data.geojson
    if not is_camera_url(selfie_url):
        return jsonify('not a camera image'), 400
    # create random id and save image file path
    id = str(uuid.uuid4())
    local_selfie = 'static/my_selfie' + id + '.jpg'
    # download the image (giving up after 10 seconds, and refusing anything
    # too big), then save it to the static folder
    try:
        with urllib.request.urlopen(selfie_url, timeout=10) as r:
            data = r.read(MAX_IMAGE_BYTES + 1)
    except Exception:
        return jsonify('camera could not be reached'), 502
    if len(data) > MAX_IMAGE_BYTES:
        return jsonify('image too large'), 400
    with open(local_selfie, 'wb') as f:
        f.write(data)
    return jsonify(local_selfie)

# selfie image delete endpoint
@app.route('/delete', methods=['POST'])
def image_delete():
    # pass image file name/path from AJAX
    selfie_id = request.data.decode('utf-8').strip()
    # only saved selfies ("static/my_selfie<uuid>.jpg"); anything else is
    # refused, so no other file on the server can be deleted
    if not SELFIE_PATH.fullmatch(selfie_id):
        return ('', 400)
    # check if image file exists and delete
    if os.path.exists(selfie_id):
        os.remove(selfie_id)
    return ('', 204)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

# geojson endpoint
@app.route('/data')
def geodata():
    return jsonify(geo_data)

# handles all after_requests
@app.after_request
def image_handler(response):
    # setting cache control
    response.cache_control.no_store = True
    response.cache_control.max_age = 0
    return response

if __name__ == '__main__':
    app.run(
        debug = True,
        port = 3000
    )