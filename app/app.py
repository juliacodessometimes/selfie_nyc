from flask import Flask, render_template, jsonify, request
import uuid
import urllib.request
import geojson
from datetime import datetime

app = Flask(__name__)

# import geojson data from file
with open('data.geojson') as g:
    geo_data = geojson.load(g)

# routes
@app.route('/index')
@app.route('/')
def index():
    return render_template('index.html')

# AJAX endpoint
@app.route('/selfie', methods=['GET', 'POST'])
def image_grab():
    if request.method == 'POST':
        # pass external image url from AJAX
        selfie_url = request.data.decode('utf-8')
        # create random id and save image file path
        id = str(uuid.uuid4())
        local_selfie = 'static/selfie' + id + '.jpg'
        # make request to url and download image file to static folder
        r = urllib.request.urlretrieve(selfie_url, local_selfie)
    return jsonify(local_selfie)

@app.route('/selfie/<test_image>')
def delete_image(test_image):
    print(test_image)
    return 'Hello'

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


@app.after_request
def image_handler(response):
    # setting cache control
    response.cache_control.no_store = True
    response.cache_control.max_age = 0
    # deleting old files
    return response

if __name__ == '__main__':
    app.run(
        debug = True,
        port = 3000
    )