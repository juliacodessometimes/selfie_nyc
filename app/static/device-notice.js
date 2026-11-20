// Shows a browser alert when the site is opened on a computer or tablet, since
// selfie_nyc is designed to be used like a phone app.
// Loaded on every page (index, about, help).
(function() {
    // phone = touch screen whose shorter side is under 600px.
    // Computers (mouse/trackpad) and tablets (larger touch screens) get the alert.
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var shortSide = Math.min(window.screen.width, window.screen.height);
    var isPhone = touch && shortSide < 600;
    if (isPhone) return;

    // only show it once per visit (not again on every page)
    var KEY = 'selfie_nyc_device_notice_seen';
    try {
        if (sessionStorage.getItem(KEY)) return;
        sessionStorage.setItem(KEY, '1');
    } catch (e) {
        // storage can be blocked (e.g. private mode); then it shows on each page
    }

    // wait until the page has loaded, so it shows behind the alert
    window.addEventListener('load', function() {
        alert("Heads up! selfie_nyc is designed to be used on a phone. On a computer or tablet, some things may not look or work right.");
    });
})();
