mapboxgl.accessToken = 'pk.eyJ1IjoiamNha2VzMzMiLCJhIjoiY2p4ZGkyb2JyMDExcDNvb2dxZXFuYmY4cSJ9.m21aYnJvrMrnEGEa0AeimQ'
// mapbox map
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jcakes33/cksmb94hl0zk218qjo6mcfawn',
    center: [-73.985130, 40.758896], // starting position
    zoom: 14,
    scrollZoom: false
});
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
var headerCSS = document.querySelector('.header-index');
var footerCSS = document.querySelector('.footer-index');
var wrapperCSS = document.querySelector('.wrapper-index');
var mapCSS = document.querySelector('.map-class');
var spacerCSS = document.querySelector('.slider-spacer');
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
// functions
function openSlider() {
    // open slider and hide header/footer
    sliderCSS.classList.add('is-open');
    headerCSS.classList.add('is-open');
    footerCSS.classList.add('is-open');
}
function setHTML(clickedMarker) {
    // load all HTML for slider div

    // set heading text to cross-street
    cameraLocation.innerHTML = clickedMarker.properties.name;
    // pre-load camera feed image
    cameraFeed.src = "assets/loading.png";
    //cameraFeed.src = clickedMarker.properties.url;
    // clear any previous intervals
    clearInterval(camInterval);
    // set interval
    camInterval = setInterval(function() {
        // set interval that refreshes camera feed image every 1.5 seconds
        cameraFeed.src = clickedMarker.properties.url + Math.random();
    }, 1500);
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
    // toggle slider and header css
    headerCSS.classList.toggle('is-open');
    footerCSS.classList.toggle('is-open');
    sliderCSS.classList.remove('is-open');
    sliderTextCSS.classList.remove('clicked');
    sliderButtonsCSS.classList.remove('clicked');
    sliderCSS.classList.remove('clicked');
    spacerCSS.classList.remove('clicked');
    
    // clear feed interval
    clearInterval(camInterval);
    // zoom out from last-clicked camera
    flyFromCamera();
}
function selfieBtn() {
    // camera feed settings
    selfiePath = cameraFeed.getAttribute('src');
    clearInterval(camInterval);
    camFeed.src = selfiePath;
    // CSS animations
    sliderCSS.classList.add('clicked');
    sliderTextCSS.classList.add('clicked');
    sliderButtonsCSS.classList.add('clicked');
    wrapperCSS.classList.add('clicked');
    spacerCSS.classList.add('clicked');
}
function downloadBtn() {
    alert("Sorry! This function isn't available on the testing site");
}
function deleteBtn() {
    // delete button functions
    sliderCSS.classList.remove('clicked');
    sliderTextCSS.classList.remove('clicked');
    sliderButtonsCSS.classList.remove('clicked');
    wrapperCSS.classList.remove('clicked');
    spacerCSS.classList.remove('clicked');
    // pre-load camera feed image
    cameraFeed.src = clickedMarker.properties.url + Math.random();
    clearInterval(camInterval);
    camInterval = setInterval(function() {
        // set interval that refreshes camera feed image every 1.5 seconds
        cameraFeed.src = clickedMarker.properties.url + Math.random();
    }, 1500);
}