mapboxgl.accessToken = 'pk.eyJ1IjoiamNha2VzMzMiLCJhIjoiY2p4ZGkyb2JyMDExcDNvb2dxZXFuYmY4cSJ9.m21aYnJvrMrnEGEa0AeimQ'
// mapbox map
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jcakes33/cksmb94hl0zk218qjo6mcfawn',
    center: [-73.985130, 40.758896], // starting position
    zoom: 14,
    scrollZoom: false,
    // keep the map flat: no accidental tilt or rotate on touch
    dragRotate: false,
    touchPitch: false
});
map.touchZoomRotate.disableRotation();
var geoLocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    // map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // draw an arrow next to indicate device direction
    showUserHeading: true
});
// CSS
var sliderCSS = document.querySelector('.slider');
var sliderTextCSS = document.querySelector('.slider-text');
var sliderButtonsCSS = document.querySelector('.slider-buttons');
var spacerCSS = document.querySelector('.slider-spacer');
var camFrameCSS = document.querySelector('.cam-frame');
var printStrip = document.querySelector('.print-strip');
var shotCounter = document.querySelector('.shot-counter');
var shotCount = document.getElementById('shotCount');
var headerCSS = document.querySelector('.header-index');
var footerCSS = document.querySelector('.footer-index');
var mapCSS = document.querySelector('.map-class');
// elements
var cameraFeed = document.getElementById('camFeed');
var cameraLocation = document.getElementById('location');
// other var
var clickedMarker;
var camInterval;
// loading map
map.addControl(geoLocate, 'bottom-right');
map.on('load', () => {
    fetch('https://raw.githubusercontent.com/juliacodessometimes/selfie_nyc/main/app/data.geojson')
    // fetching scraped data file
    .then(response => response.json())
    .then((data) => {
        // add data source
        map.addSource('source_id', {
            type: 'geojson',
            data: data
        });
        // symbol layer for unselected active camers
        map.addLayer({
            'id': 'active-cameras',
            'interactive': true,
            'type': 'symbol',
            'source': 'source_id',
            'layout': {
                'icon-image': 'icon',
                'icon-allow-overlap': true,
                'icon-size': [
                    'interpolate', ['linear'], ['zoom'], 
                    8, .001, // zoom is x or less, then size
                    20, 0.25 // zoom is x or more, then size
                ]
            }
        });
        // event listener for clicking on a camera
        map.on('click', 'active-cameras', (feature) => {
            // clicked marker variable
            clickedMarker = feature.features[0];
            // check if selected source/layer exists, and remove
            if (map.getLayer('selected')) {
                map.removeLayer('selected');
            }
            if (map.getSource('selected-data')) {
                map.removeSource('selected-data');
            }
            map.addSource('selected-data', {
                'type': 'geojson',
                'data': clickedMarker
            });
            map.addLayer({
                'id': 'selected',
                'interactive': false,
                'type': 'symbol',
                'source': 'selected-data',
                'layout': {
                    'icon-image': 'icon_select',
                    'icon-allow-overlap': true,
                    'icon-size': [
                        'interpolate', ['linear'], ['zoom'], 
                        8, .001,
                        20, 0.25
                    ]
                }
            });
            // open the slider that holds camera data
            openSlider();
            // set the slider html
            setHTML(clickedMarker);
            // fly to the marker
            flyToCamera(clickedMarker);
        });
        // change mouse on hover
        map.on('mouseenter', 'active-cameras', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'active-cameras', () => {
            map.getCanvas().style.cursor = '';
        });
    });
    // fly to user location on map load
    if (navigator.geolocation) {
        geoLocate.trigger();
    }
});
// snap sequence settings (animation lengths must match main.scss)
var SNAP = {
    shots: 4,          // photos per strip
    delay: 1500,       // ms between photos
    firstShot: 300,    // ms after tapping snap, so the button can slide away first
    printMs: 720,      // $print_dur
    slideMs: 480,      // $slide_dur
    flashMs: 280,      // $flash_dur
    irisOpenMs: 480,   // $iris_open_dur
    printGap: 10,      // px between prints
    leaveStagger: 80   // ms between prints leaving on delete (lowest goes first)
};
var snapState = 'idle'; // idle | shooting | done | clearing
var snapTimers = [];
var prints = [];

// functions
function openSlider() {
    // open slider and hide header/footer
    sliderCSS.classList.add('is-open');
    headerCSS.classList.add('is-open');
    footerCSS.classList.add('is-open');
}
function startFeed() {
    // refresh the camera image every 1.5 seconds
    clearInterval(camInterval);
    camInterval = setInterval(function() {
        cameraFeed.src = clickedMarker.properties.url + Math.random();
    }, 1500);
}
function setHTML(clickedMarker) {
    // a new camera cancels any snap sequence that's running
    resetSnap();
    // set heading text to cross-street
    cameraLocation.innerHTML = clickedMarker.properties.name;
    // pre-load camera feed image
    cameraFeed.src = "assets/loading.png";
    startFeed();
}
function flyToCamera(clickedMarker) {
    var height = mapCSS.offsetHeight;
    map.flyTo({
        center: clickedMarker.geometry.coordinates,
        zoom: 17,
        speed: 1.8,
        offset: [0, -(height*.41)]
    });
}
function flyFromCamera() {
    // zoom out from last clicked camera location
    map.flyTo({
        center: clickedMarker.geometry.coordinates,
        zoom: 14,
        speed: 1.6
    });
}

// snap sequence helpers
function later(fn, ms) {
    snapTimers.push(setTimeout(fn, ms));
}
function pad(n) {
    return String(n).padStart(2, '0');
}
function setIrisSize() {
    // the open iris must cover the frame's corners: half-diagonal / cos(30deg)
    var w = camFrameCSS.offsetWidth, h = camFrameCSS.offsetHeight;
    var r = Math.sqrt(w * w + h * h) / 2 / Math.cos(Math.PI / 6) + 4;
    camFrameCSS.style.setProperty('--iris-r', r + 'px');
}
function flash() {
    var f = document.createElement('div');
    f.className = 'flash';
    camFrameCSS.appendChild(f);
    setTimeout(function() { f.remove(); }, SNAP.flashMs + 50);
}
function layoutPrints(extra) {
    // newest print sits right under the slot; older ones are pushed down
    var n = prints.length;
    prints.forEach(function(p, k) {
        var step = p.offsetHeight + SNAP.printGap;
        p.style.transform = 'translateY(' + ((n - 1 - k) * step + (extra || 0)) + 'px)';
    });
}
function takeShot(i) {
    var src = cameraFeed.getAttribute('src');
    var now = new Date();
    flash();
    shotCount.textContent = (i + 1) + '/' + SNAP.shots;
    // build the print: image + caption
    var print = document.createElement('div');
    print.className = 'print';
    var card = document.createElement('div');
    card.className = 'print-card';
    var img = document.createElement('img');
    img.src = src;
    img.alt = 'photo ' + (i + 1) + ' of ' + SNAP.shots;
    var caption = document.createElement('p');
    caption.className = 'print-caption';
    var label = document.createElement('span');
    label.textContent = 'selfie_nyc ' + (i + 1) + '/' + SNAP.shots;
    var time = document.createElement('span');
    time.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    caption.appendChild(label);
    caption.appendChild(time);
    card.appendChild(img);
    card.appendChild(caption);
    print.appendChild(card);
    printStrip.appendChild(print);
    prints.push(print);
    layoutPrints(0);
    // ask for a fresh camera image right away, so the next photo is a new frame
    if (i < SNAP.shots - 1) {
        cameraFeed.src = clickedMarker.properties.url + Math.random();
    }
}
function resetSnap() {
    // put everything back to the starting state, instantly
    snapTimers.forEach(clearTimeout);
    snapTimers = [];
    snapState = 'idle';
    prints = [];
    printStrip.innerHTML = '';
    shotCounter.style.display = 'none';
    camFrameCSS.classList.remove('iris-close', 'iris-open');
    sliderButtonsCSS.classList.remove('in', 'out');
    sliderTextCSS.classList.remove('out', 'park');
    spacerCSS.classList.remove('out');
}

// button functions
function toggleBtn() {
    // close slider button functions
    // remove selected source/layer
    if (map.getLayer('selected')) {
        map.removeLayer('selected');
    }
    if (map.getSource('selected-data')) {
        map.removeSource('selected-data');
    }
    // close slider and bring header/footer back
    headerCSS.classList.remove('is-open');
    footerCSS.classList.remove('is-open');
    sliderCSS.classList.remove('is-open');
    resetSnap();
    // clear feed interval
    clearInterval(camInterval);
    // zoom out from last-clicked camera
    flyFromCamera();
}
function selfieBtn() {
    if (snapState !== 'idle') return;
    snapState = 'shooting';
    setIrisSize();
    // snap button slides out right, help text slides down
    sliderTextCSS.classList.add('out');
    spacerCSS.classList.add('out');
    shotCount.textContent = '0/' + SNAP.shots;
    shotCounter.style.display = 'block';
    // during the sequence, each photo triggers its own refresh instead of the timer
    clearInterval(camInterval);
    var lastShot = SNAP.firstShot + (SNAP.shots - 1) * SNAP.delay;
    for (var i = 0; i < SNAP.shots; i++) {
        (function(i) {
            later(function() { takeShot(i); }, SNAP.firstShot + i * SNAP.delay);
        })(i);
    }
    // right after the last flash: close the iris
    later(function() {
        shotCounter.style.display = 'none';
        camFrameCSS.classList.remove('iris-open');
        camFrameCSS.classList.add('iris-close');
    }, lastShot + SNAP.flashMs);
    // once the last print is out: delete/save slide in where the feed was
    later(function() {
        snapState = 'done';
        sliderButtonsCSS.classList.add('in');
    }, lastShot + SNAP.printMs);
}
function downloadBtn() {
    alert("Sorry! This function isn't available on the testing site");
}
function deleteBtn() {
    if (snapState !== 'done') return;
    snapState = 'clearing';
    // delete/save slide back out, prints slide away down
    sliderButtonsCSS.classList.remove('in');
    sliderButtonsCSS.classList.add('out');
    // prints slide down and off the screen, lowest one first
    var leaving = prints;
    prints = [];
    leaving.forEach(function(p, k) {
        p.classList.add('leaving');
        p.style.transitionDelay = (k * SNAP.leaveStagger) + 'ms';
        p.style.transform = 'translateY(' + ((leaving.length - 1 - k) * (p.offsetHeight + SNAP.printGap) + window.innerHeight) + 'px)';
    });
    // load a fresh frame, then open the iris once the buttons are mostly gone
    cameraFeed.src = clickedMarker.properties.url + Math.random();
    startFeed();
    later(function() {
        camFrameCSS.classList.remove('iris-close');
        camFrameCSS.classList.add('iris-open');
    }, SNAP.slideMs * 0.75);
    // clean up and bring snap back in from the left, help text back up
    // remove only these prints, so a new snap started meanwhile is untouched
    later(function() {
        leaving.forEach(function(p) { p.remove(); });
    }, SNAP.printMs + (leaving.length - 1) * SNAP.leaveStagger + 50);
    later(function() {
        sliderButtonsCSS.classList.remove('out');
        spacerCSS.classList.remove('out');
        sliderTextCSS.classList.remove('out');
        sliderTextCSS.classList.add('park');
        void sliderTextCSS.offsetWidth; // apply the parked position before sliding in
        sliderTextCSS.classList.remove('park');
        snapState = 'idle';
    }, SNAP.printMs);
    // remove the iris class after it finishes so nothing stays clipped
    later(function() {
        camFrameCSS.classList.remove('iris-open');
    }, SNAP.slideMs * 0.75 + SNAP.irisOpenMs + 50);
}
