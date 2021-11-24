from flask import Flask, render_template, jsonify, request, send_file
import geojson
import urllib.request


app = Flask(__name__)

# importing geojson data
with open('data.geojson') as g:
    data = geojson.load(g)


@app.route('/', methods=('GET', 'POST'))
def index():
    return render_template('index.html')

@app.route('/image', methods=['GET', 'POST'])
def image_grab():
    if request.method == 'POST':
        image_url = request.data.decode('utf-8')
                
        r = urllib.request.urlopen(image_url)
        with open('static/selfie_pause.jpg', "wb") as f:
            f.write(r.read())
            
    return jsonify('../static/selfie_pause.jpg')
    

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