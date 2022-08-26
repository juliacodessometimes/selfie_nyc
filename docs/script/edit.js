// image object
var image = new Image();

// When it loads an image
image.onload = function() {
  // canvas and context
  var selfieCanvas = document.getElementById("selfieCanvas");
  var selfieContext = selfieCanvas.getContext("2d");
  // get the canvas' current style
  var canvasStyle = getComputedStyle(selfieCanvas);
  // get canvas current width without px at end
  var canvasWidth = canvasStyle.width.replace("px", "");
  // get image ratio and work out new height of canvas
  var imageRatio = this.width/this.height;
  var canvasHeight = canvasWidth/imageRatio;
  // set correct canvas height and add px at end
  selfieCanvas.style.height = canvasHeight+"px";
  // Set the width/height attributes to be correct (as this is what drawImage uses)
  selfieCanvas.width = canvasWidth;
  selfieCanvas.height = canvasHeight;
  selfieContext.drawImage(this, 0, 0, canvasWidth, canvasHeight);
};

// load selfie image
image.src="assets/cctv.png";