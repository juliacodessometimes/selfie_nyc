from flask import Flask, render_template, jsonify, request
from apscheduler.schedulers.background import BackgroundScheduler
import uuid
import urllib.request
import geojson
import os, time

# import geojson data from file
with open('data.geojson') as g:
    geo_data = geojson.load(g)

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
@app.route('/selfie', methods=['GET', 'POST'])
def image_grab():
    if request.method == 'POST':
        # pass external image url from AJAX
        selfie_url = request.data.decode('utf-8')
        # create random id and save image file path
        id = str(uuid.uuid4())
        local_selfie = 'static/my_selfie' + id + '.jpg'
        # make request to url and download image file to static folder
        r = urllib.request.urlretrieve(selfie_url, local_selfie)
    return jsonify(local_selfie)

# selfie image delete endpoint
@app.route('/delete', methods=['GET', 'POST'])
def image_delete():
    if request.method == 'POST':
        # pass image file name/path from AJAX
        selfie_id = str(request.data.decode('utf-8'))
        # check if image file name/path exists and delte
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