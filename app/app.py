from flask import Flask, render_template, jsonify
import geojson

app = Flask(__name__)

with open('data.geojson') as g:
    data = geojson.load(g)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/data')
def geodata():
    return jsonify(data)

if __name__ == "__main__":
    app.run(
        debug = True,
        port = 3000
    )