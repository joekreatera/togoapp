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
    FCController.facesPasses = 0; // amount of times a happy or sad face has been displayed. After N will default to idel
    FCController.syncFunction = null;


    FCController.totalLedCount = 1;

    FCController.instance = this;
    this.fc = new FadeCandy();
    this.closing = false;
    FCController.stripsConfigured = false;
    this.strips = new Array();
    this.data = null;
    this.intervalFunctionId = 0;
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
                                                        25,
                                                        (configData.strips[i].pixelArray != undefined)?configData.strips[i].pixelArray:null
                                                      )
                                                      );
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
      FCController.facesPasses++;
      console.log("Happy Face passes " + FCController.facesPasses);
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


      setTimeout(()=>{ FCController.showIdleFace(FCController.buildColor(0,255,255) , FCController.buildColor(0,255,255) ); },1000);
  }
  static showSadFace(eyeColor, mouthColor){
      FCController.facesPasses++;
      console.log("Sad Face passes " + FCController.facesPasses);
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

      //FCController.defaultToIdleFace();

  }

  // not used
  static defaultToIdleFace(){

    // 20 passes, as fps are 10f/s
    if(  FCController.facesPasses > 30 ){
      FCController.showIdleFace();
      FCController.facesPasses = 0;
    }

  }
  static showIdleFace(eyeColor, mouthColor){
      // supposes the order of the strips, 1 and 2 are eyes
      // 0 is mouth

      var mods = FCController.getInstance().getModules();

      FCController.facesPasses = 0;

      mods[0].setMainColor(mouthColor);
      mods[0].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[0].setMode(NeopixelConstants.PIXEL_MODE);


      mods[1].setMainColor(eyeColor);
      mods[1].setMode(NeopixelConstants.EYE_BLINK_MODE);
      mods[1].setLoopMode(NeopixelConstants.FORWARD);

      mods[2].setMainColor(eyeColor);
      mods[2].setMode(NeopixelConstants.EYE_BLINK_MODE);
      mods[2].setLoopMode(NeopixelConstants.FORWARD);

      /*
      mods[1].setMainColor(eyeColor);
      mods[1].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[1].setMode(NeopixelConstants.PIXEL_MODE);

      mods[2].setMainColor(eyeColor);
      mods[2].setPixelArray([0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]);
      mods[2].setMode(NeopixelConstants.PIXEL_MODE);
      */


  }

  static showWhirlFace(eyeColor, mouthColor){
      // supposes the order of the strips, 1 and 2 are eyes
      // 0 is mouth
      console.log("On Whirl face!");
      var mods = FCController.getInstance().getModules();


      mods[0].setMainColor(mouthColor);
      mods[0].setSecondaryColor(PixelColor.BLACK);
      mods[0].setLoopMode(NeopixelConstants.FORWARD);
      mods[0].setMode(NeopixelConstants.CHASE_MODE);


      mods[1].setMainColor(eyeColor);
      mods[1].setSecondaryColor(PixelColor.BLACK);
      mods[1].setLoopMode(NeopixelConstants.FORWARD);
      mods[1].setMode(NeopixelConstants.CHASE_MODE);

      mods[2].setMainColor(eyeColor);
      mods[2].setSecondaryColor(PixelColor.BLACK);
      mods[2].setLoopMode(NeopixelConstants.FORWARD);
      mods[2].setMode(NeopixelConstants.CHASE_MODE);
  }

  static close(){
      FCController.getInstance().close();
  }

  close(){
    this.closing = true;
    clearInterval(this.intervalFunctionId);
    this.fc.removeListener(FadeCandy.events.COLOR_LUT_READY, this.initFCInterval);
    this.fc.usb.device.close();
  }
/*
this component should calculate frames according to timing. Is one timing for all but different frameTotals,
so it can appear as different timings :D
*/

  initFCInterval(){


       if( !FCController.stripsConfigured){
         console.log("ERROR! : no strips configured");
         return;
       }else{
         FCController.getInstance().printDebugData();
       }

       this.intervalFunctionId = setInterval(function () {
         if( FCController.syncFunction != null )
           FCController.syncFunction();

         var mods = FCController.getInstance().getModules();
         for(var m = 0; m < mods.length; m++ ){
           mods[m].update(FCController.getInstance().data);
         }
         FCController.getInstance().fc.send(FCController.getInstance().data)
       }, 100);
  }

  init(){

      this.fc.on(FadeCandy.events.READY, function () {

        console.log('FadeCandy.events.READY')
        FCController.getInstance().fc.clut.create()
        // set fadecandy led to manual mode
        FCController.getInstance().fc.config.set(FCController.getInstance().fc.Configuration.schema.LED_MODE, 1)
    });

    this.fc.on(FadeCandy.events.COLOR_LUT_READY, this.initFCInterval);

  }

}

module.exports = FCController
