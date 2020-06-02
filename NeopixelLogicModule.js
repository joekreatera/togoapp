const PixelColor = require('./PixelColor.js')
const NeopixelConstants = require('./NeopixelConstants.js');

/*

The class should be reestructed to allow private, priviledged and public methods the correct way
https://crockford.com/javascript/private.html

*/

class NeopixelLogicModule{

  setMainColor(pixelColor){
    this.mainColor = pixelColor;
  }

  setSecondaryColor(pixelColor){
      this.secondaryColor = pixelColor;
  }
  setPixelArray(arr){
    this.pixelArray = arr;
  }

  setGetColorFunction(cb){
      this.colorFunction = cb;
  }

  setMode(m){
    this.mode = m;
    this.frame = 0;
    this.direction = true;
  }

  setLoopMode(lm){
    this.loopMode = lm;
    this.frame = 0;
    this.direction = true;
  }

  setChaseWidth(cw){
    this.chaseWidth = cw;
  }

  setFrameTotals(ft){
    this.frameTotals = ft; // should change this for seconds
  }

  constructor(mc, sc, md,lm,cw,firstIndex,len,ft=25){
    this.mainColor = mc;
    this.secondaryColor = sc;
    this.colorFunction = null;
    this.mode = md;
    this.loopMode = lm;
    this.chaseWidth = cw;
    this.frameTotals = ft;
    this.frame = 0;
    this.direction = true; // go forward || positive = true, negative = false
    //won't give the opportunity to change the index once it is setup
    this.firstIndex = firstIndex;
    // same with totalLedCount
    this.totalLedCount = len;
  }

  getDebugData(){
    return {
      mainColor: this.mainColor,
      secondaryColor: this.secondaryColor,
      colorFunction: this.colorFunction,
      mode: this.mode,
      loopMode: this.loopMode,
      chaseWidth: this.chaseWidth,
      firstIndex: this.firstIndex,
      totalLedCount: this.totalLedCount
    }
  }

  chase(colorToMove, pixelLength, resetLayer, frame, totalFrames, data, firstIndex, totalLedCount){


    var actualPixel = firstIndex+Math.floor((frame*1.0/totalFrames)*totalLedCount);
    var from = actualPixel-Math.floor(pixelLength/2);
    var to = actualPixel+Math.floor(pixelLength/2);
    var doGradient = false; // experimental feature, not needed
    for (let pixel = firstIndex; pixel < firstIndex+totalLedCount; pixel ++) {


          if( resetLayer ){
            let i = 3*pixel;
            data[i] = 0
            data[i + 1] = 0
            data[i + 2] = 0
          }


          if(from < firstIndex && pixel > to){
                  var from_aux = from+totalLedCount;

                  if( pixel > from_aux){
                    let i = 3 * pixel
                    data[i] = this.calculateGradient(colorToMove.red, pixel-actualPixel, pixelLength, 10 , doGradient);
                    data[i + 1] = this.calculateGradient(colorToMove.green, pixel-actualPixel, pixelLength, 10 , doGradient);
                    data[i + 2] = this.calculateGradient(colorToMove.blue, pixel-actualPixel , pixelLength, 10 , doGradient);
                  }
          }else if(to >= firstIndex+totalLedCount && pixel < from ){
                var to_aux = to%totalLedCount;

                if( pixel < to_aux){
                  let i = 3 * pixel
                  data[i] = this.calculateGradient(colorToMove.red, pixel-actualPixel, pixelLength, 10 , doGradient);
                  data[i + 1] = this.calculateGradient(colorToMove.green, pixel-actualPixel, pixelLength, 10 , doGradient);
                  data[i + 2] = this.calculateGradient(colorToMove.blue, pixel-actualPixel , pixelLength, 10 , doGradient);
                }
          }else if( (pixel >= from  && pixel <= to ) ){

            let i = 3 * pixel
            data[i] = this.calculateGradient(colorToMove.red, pixel-actualPixel, pixelLength, 10 , doGradient);
            data[i + 1] = this.calculateGradient(colorToMove.green, pixel-actualPixel, pixelLength, 10 , doGradient);
            data[i + 2] = this.calculateGradient(colorToMove.blue, pixel-actualPixel , pixelLength, 10 , doGradient);

          }
    }

  }

  breathe(fromColor,toColor,frame,totalFrames,data, firstIndex,totalLedCount){


    var redAmount = fromColor.red + (toColor.red - fromColor.red)*(frame*1.0/totalFrames);
    var greenAmount =fromColor.green + (toColor.green - fromColor.green)*(frame*1.0/totalFrames);
    var blueAmount = fromColor.blue + (toColor.blue - fromColor.blue)*(frame*1.0/totalFrames);


    for (let pixel = firstIndex; pixel < firstIndex+totalLedCount; pixel ++) {
            let i = 3 * pixel
            data[i] = redAmount
            data[i + 1] = greenAmount
            data[i + 2] = blueAmount
    }

  }
  setFreeColor(color,data, firstIndex, totalLedCount ){

    var redAmount = color.red;
    var greenAmount = color.green;
    var blueAmount = color.blue;


    for (let pixel = firstIndex; pixel < firstIndex+totalLedCount; pixel ++) {
            let i = 3 * pixel
            data[i] = redAmount
            data[i + 1] = greenAmount
            data[i + 2] = blueAmount
    }

  }

  // does it by channel
  calculateGradient(col, place, totalLength, gradientWidth, doGradient){
      if( doGradient ){

          return Math.floor(Math.max(0,Math.min(255,col - Math.abs(place)*1.0/totalLength/2*gradientWidth)));

      }
      return col;
  }

  // special for circular strips to appear as an eye blinking.
  //For this is especially important to setup correctly the indexes according to 'eye' rotation in final harware setup

  eyeBlink(eyeColor,frame, totalFrames, data, firstIndex, totalLedCount){
    var pct =(frame*1.0/totalFrames);

    // reference for function: https://www.desmos.com/calculator/ohv4b6rxoy
    pct = Math.sin(Math.min(0.8,max(0,(pct-0.8)))/0.8*Math.PI*4);

    //var sinPct = Math.abs(Math.sin(pct*Math.PI));
    var step = pct/.2; // -> .2 is a constant required and taken out from the amount of steps needed.
    console.log(this.firstIndex+" :: " + step  + " // " + pct );

    //divide the space based on index 0
    var startTop = (totalLedCount*1.0/2)/2-0.5; // with 16 leeds this should be the middle between 3 and 4 led
    var startBottom = (totalLedCount*1.0/2 + totalLedCount*1.0)/2-0.5; // with 16 leeds this should be the middle between 3 and 4 led

    for( var pixel = firstIndex ; pixel < firstIndex + totalLedCount ; pixel++){
      let i = 3 * (pixel)
      data[i] = eyeColor.red
      data[i + 1] = eyeColor.green
      data[i + 2] = eyeColor.blue
    }

    for(var pixel  = Math.floor(startTop - step) ; pixel < Math.ceil(startTop+step) ; pixel++){
      let i = 3 * (pixel+firstIndex)
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
    }
    for(var pixel  = Math.floor(startBottom - step) ; pixel < Math.ceil(startBottom+step) ; pixel++){
      let i = 3 * (pixel+firstIndex)
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
    }

  }

  onPixels(pixelArray,mainColor,frame, totalFrames, data, firstIndex, totalLedCount){
      // pixel array is 0 -based on specific pixels to draw
      var userPixel = 0;

      if( pixelArray.length != totalLedCount ){
        console.log("Arrays on pixels from different size!");
        return;
      }
      for( var pixel = firstIndex; pixel< firstIndex+totalLedCount; pixel++){
        let i = 3 * (pixel)
        if( pixelArray[userPixel] == 0 ){
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
        }else{
          data[i] = mainColor.red
          data[i + 1] = mainColor.green
          data[i + 2] = mainColor.blue
        }

        userPixel++;
      }
  }

  update(data){

    switch(this.mode){
        case NeopixelConstants.BREATH_MODE:
            this.breathe(this.mainColor, this.secondaryColor, this.frame, this.frameTotals, data, this.firstIndex, this.totalLedCount);
             break;
        case NeopixelConstants.CHASE_MODE:
            this.chase(this.mainColor , this.chaseWidth ,true, this.frame, this.frameTotals, data, this.firstIndex, this.totalLedCount);
            break;
        case NeopixelConstants.CHASE_BREATH_MODE:
            this.breathe(this.mainColor, this.secondaryColor, this.frame, this.frameTotals, data, this.firstIndex ,this.totalLedCount);
            this.chase(this.mainColor , this.chaseWidth ,false, this.frame, this.frameTotals, data, this.firstIndex, this.totalLedCount);
            break;
        case NeopixelConstants.FREESTYLE_MODE:
            this.setFreeColor(this.colorFunction(), data, this.firstIndex, this.totalLedCount);
            break;
        case NeopixelConstants.EYE_BLINK_MODE:
            this.eyeBlink(this.mainColor, this.frame, this.frameTotals, data, this.firstIndex, this.totalLedCount);
            break;
        case NeopixelConstants.PIXEL_MODE:
              this.onPixels(this.pixelArray, this.mainColor, this.frame, this.frameTotals, data, this.firstIndex, this.totalLedCount);
              break;

    }

    if( this.direction ){
      this.frame++;
    }else{
      this.frame--;
    }


    if( this.frame == this.frameTotals || this.frame == 0){
      if( this.loopMode == NeopixelConstants.FORWARD ){
        this.frame = 0;
      }
      if( this.loopMode == NeopixelConstants.PING_PONG){
        this.direction = !this.direction;
      }
    }

  }

}


module.exports = NeopixelLogicModule
