from flask import Flask, render_template, jsonify, request, send_file
import geojson
import urllib.request

app = Flask(__name__)

# import geojson data from file
with open('data.geojson') as g:
    data = geojson.load(g)

# routes
@app.route('/', methods=('GET', 'POST'))
def index():
    return render_template('index.html')

@app.route('/image', methods=['GET', 'POST'])
def image_grab():
    if request.method == 'POST':
        # pass external image url from AJAX POST
        image_url = request.data.decode('utf-8')
        # make request to url and download image file
        r = urllib.request.urlopen(image_url)
        with open('static/selfie_pause.jpg', 'wb') as f:
            f.write(r.read())
    # pass new local image url to AJAX GET
    return jsonify('../static/selfie_pause.jpg')

@app.route('/issues')
def issues():
    return render_template('issue.html')

@app.route('/about')
def about():
    return render_template('about.html')

# geojson endpoint
@app.route('/data')
def geodata():
    return jsonify(data)

if __name__ == '__main__':
    app.run(
        debug = True,
        port = 3000
    )