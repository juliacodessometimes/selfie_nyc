window.onload = function() {
    var selfieCanvas = document.getElementById('selfie-canvas');
    var selfieContext = selfieCanvas.getContext('2d');
    var camImage = document.getElementById('camImage');
    selfieContext.drawImage(camImage, 0, 0, camImage.width, camImage.height);
  };