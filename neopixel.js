const FadeCandy = require('node-fadecandy')
const PixelColor = require('./PixelColor.js')
const NeopixelLogicModule = require('./NeopixelLogicModule.js');
const NeopixelConstants = require('./NeopixelConstants.js');



class FCController{


  static setChaseWidth(nm,idx=0){
    var mods = FCController.getInstance().getModules();
    if(idx < mods.length)
      mods[idx].setChaseWidth(nm);
  }

  static setFrameTotals(ft,idx=0){
    var mods = FCController.getInstance().getModules();
    if(idx < mods.length)
      mods[idx].setFrameTotals(ft);
  }

  static buildColor(r,g,b){
    return new PixelColor(r,g,b);
  }

  static setLoopMode(lm,idx=0){
    var mods = FCController.getInstance().getModules();
    if(idx < mods.length)
      mods[idx].setLoopMode(lm);
  }
  static setMode(m,idx=0){
    var mods = FCController.getInstance().getModules();
    if(idx < mods.length)
      mods[idx].setMode(m);
  }

  static setSyncFunction(cb){
    FCController.syncFunction = cb ; // this one should return a color to be displayed
  }

  static setColorFunction(cb,idx=0){
    var mods = FCController.getInstance().getModules();
    if(idx < mods.length)
      mods[idx].setColorFunction(cb);
  }

  static setMainColor(r,g,b,idx=0){
    var mods = FCController.getInstance().getModules();
    if(idx < mods.length)
      mods[idx].setMainColor(new PixelColor(r,g,b) );
  }

  static setSecondaryColor(r,g,b,idx=0){
    var mods = FCController.getInstance().getModules();
    if(idx < mods.length)
      mods[idx].setSecondaryColor(new PixelColor(r,g,b));
  }


  static getInstance(){
    if( FCController.instance == null ){
      FCController.instance = new FCController();
    }
    return FCController.instance;
  }

  static initInstance(){
    FCController.getInstance(); // just to have the object
  }

  static start(){
    FCController.getInstance().init();
  }

  constructor(){
    FCController.instance = null;

    FCController.syncFunction = null;


    FCController.totalLedCount = 1;

    FCController.instance = this;
    this.fc = new FadeCandy();
    FCController.stripsConfigured = false;
    this.strips = new Array();
    this.data = null;
  }



  /*
  config data containing (all parameters unless specified, obligatory):
  configData ={
    ledsPerStrip: int,
    strips:[
      {
      mode: NeopixelConstants MODES,
      loopMode: NeopixelConstants LOOP_MODES,
      mainColor: PixelColor,
      secondaryColor: PixelColor
      leds: int
      chaseWidth: int (optional)
      } x strips desired
    ]
  }
*/
  static configureStrips(configData){
    for(var i=0; i < configData.strips.length ; i++){
      FCController.getInstance().strips.push(new NeopixelLogicModule( configData.strips[i].mainColor,
                                                        configData.strips[i].secondaryColor,
                                                        configData.strips[i].mode,
                                                        configData.strips[i].loopMode,
                                                        (configData.strips[i].chaseWidth != undefined)?configData.strips[i].chaseWidth:1,
                                                        i*64,
                                                          configData.strips[i].leds,
                                                        25 ) );
    }
    FCController.getInstance().data = new Uint8Array( configData.strips.length*64*3);
    FCController.stripsConfigured = true;
    return FCController;
  }


  getModules(){
    return this.strips;
  }

  printDebugData(){
    var mods = this.getModules();

    mods.forEach((elem, idx, array)=>{
      console.log(elem.getDebugData());
    });

  }

  static showHappyFace(eyeColor, mouthColor){
      // supposes the order of the strips, 1 and 2 are eyes
      // 0 is mouth

      //  change mode to PIXEL_MODE
      var mods = FCController.getInstance().getModules();

      mods[0].setMainColor(mouthColor);
      mods[0].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[0].setMode(NeopixelConstants.PIXEL_MODE);

      mods[1].setMainColor(eyeColor);
      mods[1].setPixelArray([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]);
      mods[1].setMode(NeopixelConstants.PIXEL_MODE);

      mods[2].setMainColor(eyeColor);
      mods[2].setPixelArray([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]);
      mods[2].setMode(NeopixelConstants.PIXEL_MODE);
  }
  static showSadFace(eyeColor, mouthColor){
      // supposes the order of the strips, 1 and 2 are eyes
      // 0 is mouth
      var mods = FCController.getInstance().getModules();

      mods[0].setMainColor(mouthColor);
      mods[0].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[0].setMode(NeopixelConstants.PIXEL_MODE);

      mods[1].setMainColor(eyeColor);
      mods[1].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[1].setMode(NeopixelConstants.PIXEL_MODE);

      mods[2].setMainColor(eyeColor);
      mods[2].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[2].setMode(NeopixelConstants.PIXEL_MODE);

  }
  static showIdleFace(eyeColor, mouthColor){
      // supposes the order of the strips, 1 and 2 are eyes
      // 0 is mouth
      var mods = FCController.getInstance().getModules();

      mods[0].setMainColor(mouthColor);
      mods[0].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[0].setMode(NeopixelConstants.PIXEL_MODE);

      mods[1].setMainColor(eyeColor);
      mods[1].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[1].setMode(NeopixelConstants.PIXEL_MODE);

      mods[2].setMainColor(eyeColor);
      mods[2].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[2].setMode(NeopixelConstants.PIXEL_MODE);


  }


/*
this component should calculate frames according to timing. Is one timing for all but different frameTotals,
so it can appear as different timings :D
*/

  init(){

      this.fc.on(FadeCandy.events.READY, function () {

        console.log('FadeCandy.events.READY')
        FCController.getInstance().fc.clut.create()
        // set fadecandy led to manual mode
        FCController.getInstance().fc.config.set(FCController.getInstance().fc.Configuration.schema.LED_MODE, 1)
    });

    this.fc.on(FadeCandy.events.COLOR_LUT_READY, function () {

        if( !FCController.stripsConfigured){
          console.log("ERROR! : no strips configured");
          return;
        }else{
          FCController.getInstance().printDebugData();
        }

        setInterval(function () {
          if( FCController.syncFunction != null )
            FCController.syncFunction();

          var mods = FCController.getInstance().getModules();
          for(var m = 0; m < mods.length; m++ ){
            mods[m].update(FCController.getInstance().data);
          }
          FCController.getInstance().fc.send(FCController.getInstance().data)
        }, 100);
    });

  }

}

module.exports = FCController
