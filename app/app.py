from flask import Flask, render_template, jsonify, request, send_file
import geojson
import urllib.request

app = Flask(__name__)

# importing geojson data
with open('data.geojson') as g:
    data = geojson.load(g)

test_url = data['features'][20]['properties']['url']
r = urllib.request.urlopen(test_url)
with open("selfie_pause.jpg", "wb") as f:
    f.write(r.read())

@app.route('/', methods=('GET', 'POST'))
def index():
    return render_template('index.html')

@app.route('/image', methods=['GET', 'POST'])
def image_grab():
    if request.method == 'POST':
        test = request.data
        
        print(test.decode('utf-8'))
        
        r = urllib.request.urlopen(test.decode('utf-8'))
        with open("selfie_pause.jpg", "wb") as f:
            f.write(r.read())
            
        return render_template("issue.html")
    return 'nothing here lol'
    


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