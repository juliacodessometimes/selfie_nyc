from flask import Flask, render_template, jsonify, request
import urllib.request
import geojson
from datetime import datetime

app = Flask(__name__)

# import geojson data from file
with open('data.geojson') as g:
    data = geojson.load(g)

# routes
@app.route('/index')
@app.route('/')
def index():
    return render_template('index.html')

# AJAX endpoint
@app.route('/selfie', methods=['GET', 'POST'])
def image_grab():
    if request.method == 'POST':
        # pass external image url from AJAX POST
        selfie_url = request.data.decode('utf-8')
        local_selfie = 'static/selfie' + '.jpg'
        # make request to url and download image file to static folder
        r = urllib.request.urlretrieve(selfie_url, local_selfie)
    return jsonify(local_selfie)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

@app.route('/issues')
def issues():
    return render_template('issue.html')

# geojson endpoint
@app.route('/data')
def geodata():
    return jsonify(data)

# setting cache control
@app.after_request
def add_header(response):
    response.cache_control.no_store = True
    response.cache_control.max_age = 0
    return response

if __name__ == '__main__':
    app.run(
        debug = True,
        port = 3000
    )