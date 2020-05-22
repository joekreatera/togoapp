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
    FCController.fc = new FadeCandy();
    FCController.instance = this;
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
      this.strips.push(new NeopixelLogicModule( configData.strips[i].mainColor,
                                                        configData.strips[i].secondaryColor,
                                                        configData.strips[i].mode,
                                                        configData.strips[i].loopMode,
                                                        (configData.strips[i].chaseWidth != undefined)?configData.strips[i].chaseWidth:1,
                                                        i*64,
                                                          configData.strips[i].leds,
                                                        25 ) );
    }
    this.data = new Uint8Array( configData.strips.length*64*3);
    FCController.stripsConfigured = true;
    return FCController;
  }


  getModules(){
    return this.strips;
  }

  printDebugData(){
    for( module in this.getModules() ){
      console.log(module.getDebugData());
    }
  }

/*
this component should calculate frames according to timing. Is one timing for all but different frameTotals,
so it can appear as different timings :D
*/

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
        console.log('FaceCandy says color lut ready on ' + FCController.totalLedCount +' leds');
        if( !FCController.stripsConfigured){
          console.log("ERROR! : no strips configured");
          return;
        }else{
          FCController.getInstance().printDebugData();
        }

        setInterval(function () {
          if( FCController.syncFunction != null )
            FCController.syncFunction();
          for( module in FCController.getInstance().getModules() ){
            module.update(data);
          }
          FCController.getInstance().fc.send(data)
        }, 100);
    });

  }

}

module.exports = FCController
