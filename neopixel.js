const FadeCandy = require('node-fadecandy')

const fc = new FadeCandy();

class PixelColor{

  // ints!
  constructor(r,g,b){
    this.red = r;
    this.green = g;
    this.blue = b;
  }

}

fc.on(FadeCandy.events.READY, function () {

    console.log('FadeCandy.events.READY')

    // see the config schema
    console.log(fc.Configuration.schema)

    // create default color look-up table
    fc.clut.create()

    // set fadecandy led to manual mode
    fc.config.set(fc.Configuration.schema.LED_MODE, 1)

    // blink that led
    let state = false
    setInterval(() => {
        state = !state;
        fc.config.set(fc.Configuration.schema.LED_STATUS, +state)
    }, 100)
})


function breatheBetweenTwoColors(fromColor, toColor, frame, totalFrames, data ,totalLedCount){

  var redAmount = fromColor.red + (toColor.red - fromColor.red)*(frame*1.0/totalFrames);
  var greenAmount =fromColor.green + (toColor.green - fromColor.green)*(frame*1.0/totalFrames);
  var blueAmount = fromColor.blue + (toColor.blue - fromColor.blue)*(frame*1.0/totalFrames);


  for (let pixel = 0; pixel < totalLedCount; pixel ++) {
          let i = 3 * pixel
          data[i] = redAmount
          data[i + 1] = greenAmount
          data[i + 2] = blueAmount
  }
  fc.send(data)
}


// does it by channel
function calculateGradient(col, place, totalLength, gradientWidth, doGradient){
    if( doGradient ){

        return Math.floor(Math.max(0,Math.min(255,col - Math.abs(place)*1.0/totalLength/2*gradientWidth)));

    }
    return col;
}

function chase(colorToMove, pixelLength, resetLayer, frame, totalFrames, data, totalLedCount , doGradient){


  var actualPixel = Math.floor((frame*1.0/totalFrames))*totalLedCount;

  for (let pixel = 0; pixel < totalLedCount; pixel ++) {


        if( resetLayer ){
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
        }
        if( pixel >= actualPixel-Math.floor(pixelLength/2) && pixel <= actualPixel+Math.floor(pixelLength/2)  ){
          let i = 3 * pixel
          data[i] = calculateGradient(colorToMove.red, pixel-actualPixel, pixelLength, 10 , doGradient);
          data[i + 1] = calculateGradient(colorToMove.green, pixel-actualPixel, pixelLength, 10 , doGradient);
          data[i + 2] = calculateGradient(colorToMove.blue, pixel-actualPixel , pixelLength, 10 , doGradient);
        }
  }
  fc.send(data)
}

fc.on(FadeCandy.events.COLOR_LUT_READY, function () {
    console.log('FaceCandy says color lut ready')

	// do some reeeeally basic running light on 6 leds
    let frame = 1
    let frameTotals = 25;
    let dir = true;
    var color1 = new PixelColor(255,0,255);
    var color2 = new PixelColor(0,255,0);
    var colorW = new PixelColor(255,255,255);
    var totalLedCount = 65;


    setInterval(function () {

      let data = new Uint8Array(totalLedCount * 3);
      breatheBetweenTwoColors(color1, color2, frame, frameTotals, data, totalLedCount);
      chase(colorW,6,false, frame, frameTotals, data, totalLedCount)
      if( dir ){
        frame++
      }else{
        frame--;
      }

      if( frame == frameTotals || frame == 0){
        dir = !dir;
      }

    }, 100)
})
