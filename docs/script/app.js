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
// two-finger pinch still zooms, but no longer rotates the map
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
// elements used by the snap sequence (see index.html for what each one is)
var spacerCSS = document.querySelector('.slider-spacer');       // "having trouble?" help text
var camFrameCSS = document.querySelector('.cam-frame');         // live feed + dark frame (the iris clips this)
var printSlot = document.querySelector('.print-slot');          // slot the strip prints out of
var printStrip = document.querySelector('.print-strip');        // scroll area that holds the strip
var shotCounter = document.querySelector('.shot-counter');      // "● 2/4" over the feed
var shotCount = document.getElementById('shotCount');           // the "2/4" text inside it
var headerCSS = document.querySelector('.header-index');
var footerCSS = document.querySelector('.footer-index');
var mapCSS = document.querySelector('.map-class');
// (wrapperCSS removed: the page-wide blink it was used for is gone)
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
};
// where the sequence is: idle (SNAP showing) | shooting (photos being taken)
// | done (delete/save showing) | clearing (delete was tapped, animating out)
var snapState = 'idle';
// every pending setTimeout of the sequence, so it can all be cancelled at once
var snapTimers = [];
var currentStrip = null; // the photo strip being printed / shown

// functions
function openSlider() {
    // open slider and hide header/footer
    sliderCSS.classList.add('is-open');
    headerCSS.classList.add('is-open');
    footerCSS.classList.add('is-open');
}
// (re)start the live feed. Moved into its own function because setHTML and
// deleteBtn both need it
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
// setTimeout that resetSnap() can cancel
function later(fn, ms) {
    snapTimers.push(setTimeout(fn, ms));
}
// 7 -> "07", for the date on the strip
function pad(n) {
    return String(n).padStart(2, '0');
}
// tell the CSS iris how big to open (--iris-r), based on the frame's current size
function setIrisSize() {
    // the open iris must cover the frame's corners: half-diagonal / cos(30deg)
    var w = camFrameCSS.offsetWidth, h = camFrameCSS.offsetHeight;
    var r = Math.sqrt(w * w + h * h) / 2 / Math.cos(Math.PI / 6) + 4;
    camFrameCSS.style.setProperty('--iris-r', r + 'px');
}
// white flash over the feed for one photo; removed once its animation is over
function flash() {
    var f = document.createElement('div');
    f.className = 'flash';
    camFrameCSS.appendChild(f);
    setTimeout(function() { f.remove(); }, SNAP.flashMs + 50);
}
// make an empty strip under the slot and return it
function newStrip() {
    // one strip per snap sequence; photos are added to its top
    var strip = document.createElement('div');
    strip.className = 'strip';
    // start scrolled to the top
    printStrip.scrollTop = 0;
    // the strip starts right under the slot; while printing, hide anything
    // above the slot so photos look like they come out of it
    var slotTop = Math.round(printSlot.getBoundingClientRect().bottom - printStrip.getBoundingClientRect().top);
    strip.style.top = slotTop + 'px';
    printStrip.style.clipPath = 'inset(' + slotTop + 'px 0 0 0)';
    printStrip.appendChild(strip);
    return strip;
}
// take photo number i (0-3): flash, update the counter, print it onto the strip
function takeShot(i) {
    // the photo is whatever camera image is showing right now
    var src = cameraFeed.getAttribute('src');
    var now = new Date();
    flash();
    shotCount.textContent = (i + 1) + '/' + SNAP.shots;
    // build this photo's piece of the strip
    var card = document.createElement('div');
    card.className = 'print-card';
    var img = document.createElement('img');
    img.src = src;
    // description for screen readers
    img.alt = 'photo ' + (i + 1) + ' of ' + SNAP.shots;
    card.appendChild(img);
    // the first photo is the bottom end of the strip and carries its footer
    if (i === 0) {
        card.classList.add('strip-end');
        var footer = document.createElement('p');
        footer.className = 'strip-footer';
        var label = document.createElement('span');
        label.className = 'strip-location';
        // camera name, same as the slider's title (textContent: shown as plain text)
        label.textContent = clickedMarker.properties.name;
        var date = document.createElement('span');
        date.className = 'strip-date';
        // date as MM.DD.YY
        date.textContent = pad(now.getMonth() + 1) + '.' + pad(now.getDate()) + '.' + String(now.getFullYear()).slice(2);
        footer.appendChild(label);
        footer.appendChild(date);
        card.appendChild(footer);
    }
    // add it to the top of the strip, starting hidden above the slot, then
    // let it grow out: the whole strip moves down together as it prints
    currentStrip.insertBefore(card, currentStrip.firstChild);
    // 1. pull it up by its own height so it starts fully hidden above the slot
    card.style.marginTop = -card.getBoundingClientRect().height + 'px';
    // 2. make the browser apply that position before animating
    void card.offsetHeight;
    // 3. turn on the transition (.printing in main.scss) and slide it to 0
    card.classList.add('printing');
    card.style.marginTop = '0px';
    // ask for a fresh camera image right away, so the next photo is a new frame
    // (not after the last one: the feed is about to close)
    if (i < SNAP.shots - 1) {
        cameraFeed.src = clickedMarker.properties.url + Math.random();
    }
}
// cancel any running sequence and put everything back to the starting state,
// instantly. Used when the slider closes or another camera is picked.
function resetSnap() {
    // cancel every pending step of the sequence
    snapTimers.forEach(clearTimeout);
    snapTimers = [];
    snapState = 'idle';
    // remove the strip and un-clip/scroll its area
    currentStrip = null;
    printStrip.innerHTML = '';
    printStrip.style.clipPath = '';
    printStrip.scrollTop = 0;
    // feed visible again, slot open, counter hidden
    shotCounter.style.display = 'none';
    camFrameCSS.classList.remove('iris-close', 'iris-open');
    printSlot.classList.remove('closed');
    // delete/save hidden; SNAP and help text back in place
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
    // stop any snap sequence and clear the strip (replaces removing the old 'clicked' classes)
    resetSnap();
    // clear feed interval
    clearInterval(camInterval);
    // zoom out from last-clicked camera
    flyFromCamera();
}
// SNAP: take 4 photos (SNAP.delay apart) and print them onto one strip.
// Replaces the old single-photo version, which froze the feed and moved the slider up.
function selfieBtn() {
    // ignore extra taps while a sequence is already running
    if (snapState !== 'idle') return;
    snapState = 'shooting';
    // size the iris to the camera box before it's needed
    setIrisSize();
    // snap button slides out right, help text slides down
    sliderTextCSS.classList.add('out');
    spacerCSS.classList.add('out');
    // show the "● 0/4" counter over the feed
    shotCount.textContent = '0/' + SNAP.shots;
    shotCounter.style.display = 'block';
    // during the sequence, each photo triggers its own refresh instead of the timer
    clearInterval(camInterval);
    // empty strip under the slot, ready for the first photo
    currentStrip = newStrip();
    // when the last photo is taken (ms after tapping)
    var lastShot = SNAP.firstShot + (SNAP.shots - 1) * SNAP.delay;
    // schedule each photo; the wrapper function keeps the right i for each timer
    for (var i = 0; i < SNAP.shots; i++) {
        (function(i) {
            later(function() { takeShot(i); }, SNAP.firstShot + i * SNAP.delay);
        })(i);
    }
    // right after the last flash: hide the counter, close the iris and the slot
    later(function() {
        shotCounter.style.display = 'none';
        camFrameCSS.classList.remove('iris-open');
        camFrameCSS.classList.add('iris-close');
        printSlot.classList.add('closed');
    }, lastShot + SNAP.flashMs);
    // once the last print is out: delete/save slide in where the feed was
    later(function() {
        snapState = 'done';
        sliderButtonsCSS.classList.add('in');
        // printing is over: the strip may now be scrolled up over the buttons
        printStrip.style.clipPath = '';
    }, lastShot + SNAP.printMs);
}
function downloadBtn() {
    alert("Sorry! This function isn't available on the testing site");
}
// DELETE: send the strip away and go back to the live feed and SNAP
function deleteBtn() {
    // only works once the strip is finished (ignores double taps)
    if (snapState !== 'done') return;
    snapState = 'clearing';
    // delete/save slide back out
    sliderButtonsCSS.classList.remove('in');
    sliderButtonsCSS.classList.add('out');
    // the whole strip slides down and off the screen in one piece:
    // far enough to clear the visible area, wherever it's scrolled to
    var leaving = currentStrip;
    currentStrip = null;
    leaving.classList.add('leaving');
    leaving.style.transform = 'translateY(' + (printStrip.clientHeight + printStrip.scrollTop + 20) + 'px)';
    // load a fresh frame and restart the 1.5s refresh
    cameraFeed.src = clickedMarker.properties.url + Math.random();
    startFeed();
    // open the iris and the slot once the buttons are mostly gone
    later(function() {
        camFrameCSS.classList.remove('iris-close');
        camFrameCSS.classList.add('iris-open');
        printSlot.classList.remove('closed');
    }, SNAP.slideMs * 0.75);
    // after the strip has slid away, remove it. Only this strip, so a new snap
    // started meanwhile is untouched
    later(function() {
        leaving.remove();
        if (!currentStrip) {
            printStrip.style.clipPath = '';
            printStrip.scrollTop = 0;
        }
    }, SNAP.printMs + 50);
    // bring SNAP back in from the left and the help text back up
    later(function() {
        sliderButtonsCSS.classList.remove('out');
        spacerCSS.classList.remove('out');
        sliderTextCSS.classList.remove('out');
        // jump SNAP off the left edge with no animation...
        sliderTextCSS.classList.add('park');
        void sliderTextCSS.offsetWidth; // (makes the browser apply the parked position now)
        // ...then let it slide in to the middle
        sliderTextCSS.classList.remove('park');
        snapState = 'idle';
    }, SNAP.printMs);
    // remove the iris class after it finishes so nothing stays clipped
    later(function() {
        camFrameCSS.classList.remove('iris-open');
    }, SNAP.slideMs * 0.75 + SNAP.irisOpenMs + 50);
}
