(function() {
    // phone = touch screen whose shorter side is under 600px.
    // Computers (mouse/trackpad) and tablets (larger touch screens) get the alert.
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var shortSide = Math.min(window.screen.width, window.screen.height);
    var isPhone = touch && shortSide < 600;
    if (isPhone) return;

    // wait until the page has loaded, so it shows behind the alert
    window.addEventListener('load', function() {
        alert("hello! selfie_nyc is designed to be used on a phone. on a computer or tablet, some things may not look or work right.");
    });
})();
