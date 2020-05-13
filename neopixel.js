const FadeCandy = require('node-fadecandy')


class PixelColor{

  // ints!
  constructor(r,g,b){
    this.red = r;
    this.green = g;
    this.blue = b;
  }

}

class FCController{



  static setChaseWidth(nm){
    FCController.chaseWidth = nm;
  }

  static buildColor(r,g,b){
    return new PixelColor(r,g,b);
  }

  static setLoopMode(lm){
    FCController.loopMode = lm;
  }
  static setMode(m){
    FCController.mode = m;
  }

  static setSyncFunction(cb){
    FCController.syncFunction = cb ; // this one should return a color to be displayed
  }

  static setColorFunction(cb){
    FCController.colorFunction = cb ; // this one should return a color to be displayed
  }

  static setChaseColor(r,g,b){
    FCController.chaseColor = FCController.buildColor(r,g,b);
  }

  static setColor1(r,g,b){
    FCController.color1 = FCController.buildColor(r,g,b);
  }

  static setColor2(r,g,b){
    FCController.color2 = FCController.buildColor(r,g,b);
  }

  static getInstance(){
    if( FCController.instance == null ){
      FCController.instance = new FCController();
    }
    return FCController.instance;
  }

  constructor(){
    FCController.instance = null;
    FCController.color1 = new PixelColor(255,0,255);
    FCController.color2 = new PixelColor(0,255,0);
    FCController.chaseColor = new PixelColor(255,255,255);
    FCController.colorFunction = null;
    FCController.mode = 0;
    FCController.loopMode = 0;
    FCController.chaseWidth = 6;

    FCController.syncFunction = null;
    FCController.BREATH_MODE = 0;
    FCController.CHASE_MODE = 1;
    FCController.CHASE_BREATH_MODE = 2;
    FCController.FREESTYLE_MODE = 3;

    FCController.FORWARD = 0;
    FCController.PING_PONG = 1;


    this.fc = new FadeCandy();
    FCController.instance = this;
  }


  init(){

    console.log("Mode " + FCController.mode);

    console.log("Loop Mode " + FCController.loopMode);

    this.fc.on(FadeCandy.events.READY, function () {

        console.log('FadeCandy.events.READY')

        FCController.getInstance().fc.clut.create()

        // set fadecandy led to manual mode
        FCController.getInstance().fc.config.set(FCController.getInstance().fc.Configuration.schema.LED_MODE, 1)
    });

    this.fc.on(FadeCandy.events.COLOR_LUT_READY, function () {
        console.log('FaceCandy says color lut ready')

    	// do some reeeeally basic running light on 6 leds
        let frame = 1
        let frameTotals = 25;
        let dir = true;
        var totalLedCount = 30;


        setInterval(function () {
          if( FCController.syncFunction() != null )
            FCController.syncFunction();
          let data = new Uint8Array(totalLedCount * 3);

          if(FCController.mode == FCController.BREATH_MODE)
            FCController.getInstance().breatheBetweenTwoColors(FCController.color1, FCController.color2, frame, frameTotals, data, totalLedCount);
          if(FCController.mode == FCController.CHASE_MODE)
            FCController.getInstance().chase(FCController.chaseColor , FCController.chaseWidth ,true, frame, frameTotals, data, totalLedCount)
          if(FCController.mode == FCController.CHASE_BREATH_MODE ){
            FCController.getInstance().breatheBetweenTwoColors(FCController.color1, FCController.color2, frame, frameTotals, data, totalLedCount);
            FCController.getInstance().chase(FCController.chaseColor , FCController.chaseWidth ,false, frame, frameTotals, data, totalLedCount)
          }
          if( FCController.mode == FCController.FREESTYLE_MODE ){
            FCController.getInstance().setFreeColor( FCController.colorFunction(), data, totalLedCount );
          }

          if( dir ){
            frame++
          }else{
            frame--;
          }


          if( frame == frameTotals || frame == 0){
            if( FCController.loopMode == FCController.FORWARD ){
              frame = 0;
            }
            if( FCController.loopMode == FCController.PING_PONG){
              dir = !dir;
            }
          }

        }, 100);
    });

  }

  breatheBetweenTwoColors(fromColor, toColor, frame, totalFrames, data ,totalLedCount){

    var redAmount = fromColor.red + (toColor.red - fromColor.red)*(frame*1.0/totalFrames);
    var greenAmount =fromColor.green + (toColor.green - fromColor.green)*(frame*1.0/totalFrames);
    var blueAmount = fromColor.blue + (toColor.blue - fromColor.blue)*(frame*1.0/totalFrames);


    for (let pixel = 0; pixel < totalLedCount; pixel ++) {
            let i = 3 * pixel
            data[i] = redAmount
            data[i + 1] = greenAmount
            data[i + 2] = blueAmount
    }
    FCController.getInstance().fc.send(data)
  }

  setFreeColor(color, data ,totalLedCount){

    var redAmount = color.red;
    var greenAmount = color.green;
    var blueAmount = color.blue;


    for (let pixel = 0; pixel < totalLedCount; pixel ++) {
            let i = 3 * pixel
            data[i] = redAmount
            data[i + 1] = greenAmount
            data[i + 2] = blueAmount
    }
    FCController.getInstance().fc.send(data)
  }


  // does it by channel
  calculateGradient(col, place, totalLength, gradientWidth, doGradient){
      if( doGradient ){

          return Math.floor(Math.max(0,Math.min(255,col - Math.abs(place)*1.0/totalLength/2*gradientWidth)));

      }
      return col;
  }

  chase(colorToMove, pixelLength, resetLayer, frame, totalFrames, data, totalLedCount , doGradient){


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
    FCController.getInstance().fc.send(data)
  }

}

module.exports = FCController
