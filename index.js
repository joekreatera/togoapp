// option 1
/*
add debug library!

use forever or pm2
use nohup
nodemon
supervisor


option 2 - or on top of option 1
Here's an upstart (http://upstart.ubuntu.com/cookbook/#run-a-job-before-another-job) solution I've been using for my personal projects:

Place it in /etc/init/node_app_daemon.conf:

description "Node.js Daemon"
author      "Adam Eberlin"

stop on shutdown

respawn
respawn limit 3 15

script
  export APP_HOME="/srv/www/MyUserAccount/server"
  cd $APP_HOME
  exec sudo -u user /usr/bin/node server.js
end script

This will also handle respawning your application in the event that it crashes. It will give up attempts to respawn your application if it crashes 3 or more times in less than 15 seconds
*/
//var firebase = require("firebase/app");

// usuario prueba: users/GANa7f8jJDzux1xotLgl

const AWS = require('aws-sdk');
const Stream = require('stream');
const Speaker = require('speaker');
const LEDControl = require('./neopixel.js');
const PixelColor = require('./PixelColor');
const NeopixelConstants = require('./NeopixelConstants.js');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const Gpio = require('onoff').Gpio;
const Omx = require('node-omxplayer');


const omxPlayer = Omx(); // sound on raspberry!

const GENERAL_QUERY = 0;
const MORNING_ROUTINE_GET = 1;
const BEDTIME_ROUTINE_GET = 2;
const ACTIVITY_CHECK = 3;
const STORYTELLING = 4;

var firebase = require("firebase-admin");
var serviceAccount = require("../togotest-227be-c6def00de4ba.json");
var session_test = "";



/*  ******************** LIMIT SWITCH ABST LAYER*************************  */
// keep the state, mini abstraction layer
const button = new Gpio(4, 'in', 'both');
var manualOverridePushed = 1;
var latchOverride = false;

button.watch((err, value) => {
    if(manualOverridePushed == 1 &&  value == 0){
        latchOverride = true;  // user pushed
    }
    manualOverridePushed = value;
    console.log("Value: " + value);
});

function getButtonPushed(){
  if( latchOverride ){
    latchOverride = false;
    return true;
  }
  return false;
}
/*  *********************************************  */


/* ******************OMX PLAYER FOR STORY TELL***************** */

function playSong(sng){

  omxPlayer.removeListener('close',songEnded);
  omxPlayer.newSource(  "./" + sng  );
  omxPlayer.on('close' , songEnded);
}

function pauseSong(){
  omxPlayer.pause();

}

function songEnded(){
  console.log("Song ended!!!! ");
}

/* *********************************************** */

/* GOOGLE CALENDAR SET UP*/

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listTodayEvents(auth, callback) {
  const calendar = google.calendar({version: 'v3', auth});

  var now0 = (new Date());
  now0.setHours(0);

  var now1 = (new Date());
  now1.setHours(0);

  now1.setDate(now1.getDate() + 1);

  calendar.events.list({
    calendarId: 'primary',
    timeMin: now0,
    timeMax: now1,
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      var finalEvents = [];
      for(var i = 0 ; i < events.length;i++){
        finalEvents.push(events[i].summary)
      }
      callback(finalEvents);
    } else {
      console.log('No upcoming events found.');
    }
  });
}

function insertEvent(auth, name, date){

  var event = {
    'summary': name,
    'location': 'Home',
    'description': name,
    'start': {
      'dateTime': ""+date,
      'timeZone': 'America/Mexico_City',
    },
    'end': {
      'dateTime': date,
      'timeZone': 'America/Mexico_City',
    },
    'recurrence': [
    ],
    'attendees': [
    ],
    'reminders': {
      'useDefault': false,
      'overrides': [
      ],
    },
  };

  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });

}

/* END CALENDAR SET UP*/

var app = firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://togotest-227be.firebaseio.com'
  });

var db = app.firestore();
var state  = GENERAL_QUERY;
var actualRoutineList = Array();

AWS.config.loadFromPath('../config_aws.json');

const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-2'
});
// Create the Speaker instance

let params = {
    'Text': 'Hi there! I\'m current Togo voice! . Today is may ' + 5,
    'OutputFormat': 'pcm',
    'VoiceId': 'Justin'
};


/**********PROCESS CONFIGURATION|*************************  */

//process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {

    console.log("Trying to close everything!");

    LEDControl.close();


    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true,sigint:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

/*********************************************   */


class GeneralComponents{
  static player = null;
  constructor(){
    GeneralComponents.player = this;
  }

  static getPlayer(){

          GeneralComponents.player =  new Speaker({
              channels: 1,
              bitDepth: 16,
              sampleRate: 16000
          });


      return GeneralComponents.player;
  }

}

class GeneralVariables{
  // month is 0 based
  static genVars = {
    wakeuptime_week:'09:00',
    wakeuptime_alarm_done:false,
    this_date:{
        day:4,
        month:4,
        year:2020
    }
  };

  static configFile= "";

  static initGeneralVariables(cfg){
    GeneralVariables.configFile = cfg;
    if (!fs.existsSync(GeneralVariables.configFile)){
        //file exists
        var td = new Date();
        genVars.this_date.day = td.getDate();
        genVars.this_date.month = td.getMonth();
        genVars.this_date.year = td.getYear();
        fs.writeFileSync(GeneralVariables.configFile , JSON.stringify(GeneralVariables.genVars) );
    }

    GeneralVariables.genVars = JSON.parse ( fs.readFileSync(GeneralVariables.configFile) );
  }
  static update(key, value){
    GeneralVariables.genVars[key] = value;
    fs.writeFileSync(GeneralVariables.configFile , JSON.stringify(GeneralVariables.genVars) );
  }

  static getVariable(key){
    return GeneralVariables.genVars[key];
  }

}

GeneralVariables.initGeneralVariables("app_config.json");
var myRobot = firebase.firestore().collection('robots').doc('6yYw4qaILiu2oa60NOV2');


Polly.synthesizeSpeech(params, (err, data) => {
    if (err) {
        console.log(err.code)
    } else if (data) {
        if (data.AudioStream instanceof Buffer) {
            //write Audio stream to file relative to this program
            /*fs.writeFile("./speech.mp3", data.AudioStream, function (err) {
                if (err) {
                    return console.log(err)
                }
                console.log("The file was saved!")
            });*/
            // Initiate the source
            let bufferStream = new Stream.PassThrough();
            // convert AudioStream into a readable stream
            bufferStream.end(data.AudioStream);
            // Pipe into Player
            bufferStream.pipe( GeneralComponents.getPlayer() );
        }
    }
});

/*
4. configure voice to go faster or slower with ssml
  SSML https://developer.amazon.com/it-IT/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html

*/

function doGeneralQuery(cb){
  let query = db.collection('robot_events').where('status','==',0).where('robot','==',myRobot);

  query.get().then(querySnapshot => {
                  console.log("Getting data ... ");
                  let docs = querySnapshot.docs;
                  var doc = null;
                  for (doc of docs) {
                      // classify the documents! we should not have more than one document at a time
                      console.log("doc " +  doc.data().content.message );
                      console.log("doc " +  doc.id );

                      if( doc.data().type == 2){
                        if( doc.data().content.routine == "CALENDAR_DATE"){
                          // upload to google calendar
                          var details = doc.data().content.message.split("::");

                          var content = fs.readFileSync('../credentials_google_calendar.json');
                          authorize(JSON.parse(content), (auth)=>{
                              insertEvent(auth, details[0], (new Date(details[1])).toISOString() );
                          });


                        }
                      }



                      if( doc.data().type == 7){
                        if( doc.data().content.routine == "START_ACTIVITY"){
                          if( state == GENERAL_QUERY) // if there were two start_activity
                             state = BEDTIME_ROUTINE_GET;
                        }
                      }

                      if( doc.data().type == 3){ // start story tell
                          if( state == GENERAL_QUERY){
                             state = STORYTELLING;
                             playSong('cuento.mp3');
                           }
                      }

                      if( doc.data().type == 1){
                        if( doc.data().content.routine == "wakeuptime_week"){
                          GeneralVariables.update("wakeuptime_week", doc.data().content.message);
                        }

                        if( doc != null ){ // should check if the update is from  wake up
                          togoSpeak('I have set up wake up time to ' + doc.data().content.message);

                        }
                      }
                      db.collection('robot_events').doc(doc.id).update("status",1).catch((err)=>{
                        console.log("Could not update! "  + err);
                      });
                  }


                  // finished process
                  cb();

                  //app.delete().then( () => { console.log( "Finished"); });
              }
  );
}


function doStorytellRoutine(callback){

  console.log("Telling story!");

  LEDControl.showHappyFace( LEDControl.buildColor(0,255,0) , LEDControl.buildColor(0,255,0) );

  if( omxPlayer.running ){

    if( getButtonPushed() ){
      // cancel and return
      omxPlayer.quit();
      state = GENERAL_QUERY;
/*
      setTimeout( ()=>{

          LEDControl.setMode(NeopixelConstants.EYE_BLINK_MODE,0);
          LEDControl.setMode(NeopixelConstants.EYE_BLINK_MODE,1);
          LEDControl.setMode(NeopixelConstants.EYE_BLINK_MODE,2);

      } , 7000)*/

      LEDControl.showIdleFace( LEDControl.buildColor(0,255,255) , LEDControl.buildColor(0,255,255) );
    }else{
      // do nothing , kid's listening
    }

  }else{
    state = GENERAL_QUERY;
  }

  callback();

}

function doBedtimeRoutine(callback){
  // check any of the alarms
  console.log("ENTERED ON BEDTIME ROUTINE GET");



        let query = db.collection('routines').where('robot','==',myRobot).where('routine_name', '==' , 'bedtime');

        state = GENERAL_QUERY;
        query.get().then((querySnapshot)=>{
          console.log("ENTERED ON QUERY RETURN ");
            let docs = querySnapshot.docs;

            togoSpeak("Going to bed now!");

            for(let doc of docs){

              let steps = doc.data().steps;

              actualRoutineList = steps;
              state = ACTIVITY_CHECK;
            }

            callback();
        });

}


function doMorningRoutine(callback){
  // check any of the alarms
  console.log("ENTERED ON MORNING ROUTINE GET");



        let query = db.collection('routines').where('robot','==',myRobot).where('routine_name', '==' , 'wakeup_week');

        state = GENERAL_QUERY;
        query.get().then((querySnapshot)=>{
          console.log("ENTERED ON QUERY RETURN ");
            let docs = querySnapshot.docs;

            for(let doc of docs){

              let steps = doc.data().steps;

              actualRoutineList = steps;
              state = ACTIVITY_CHECK;
            }

            // rememeber all the things to do Today

            var content = fs.readFileSync('../credentials_google_calendar.json');
            authorize(JSON.parse(content), (auth)=>{
                listTodayEvents(auth,async (eventList)=>{
                  for(var i =0; i < eventList.length ; i++){
                    var e = eventList[i];
                    togoSpeak("Remember today is : " + e);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                  }
                  callback();
                });
            });

        });

}


function doActivityCheck(cb){

  console.log("Checking button ");

  if( getButtonPushed() ){

    console.log(actualRoutineList);

    if( actualRoutineList.length <= 0 ){
      state = GENERAL_QUERY;
      togoSpeak('You have completed all the tasks! Congratulations! ' );
    }

    if( actualRoutineList.length > 0 ){
      togoSpeak('Now it\'s time to ' + actualRoutineList[0].activity + '' );
    }
    // finished process
    cb();

  }else{

      console.log("Checking database");

  }

  let query = db.collection('robot_events').where('robot','==',myRobot).where('status','==',0).where('type','==', 6);


  query.get().then(querySnapshot => {
                  console.log("Getting data from activity check ... ");
                  let docs = querySnapshot.docs;
                  var doc = null;
                  var doNextRouting = false;
                  var wasCancelled = false;

                  for (doc of docs) {
                      console.log("Completed1? " + doc.id);
                      if( doc.data().content.message == "CANCEL"){
                        while (actualRoutineList.length > 0) {
                          actualRoutineList.shift();
                        }

                        wasCancelled = true;
                      }else{
                        actualRoutineList.shift();
                        doNextRouting = true;
                      }

                      db.collection('robot_events').doc(doc.id).update("status",1).catch((err)=>{
                        console.log("Could not update! "  + err);
                      });
                  }

                  if( doNextRouting ){ // should check if the update is from  wake up

                    console.log(actualRoutineList);

                    if( actualRoutineList.length <= 0 ){
                      state = GENERAL_QUERY;
                      togoSpeak('You have completed all the tasks! Congratulations! ' );
                    }
                  }
                  if( wasCancelled ){
                    state = GENERAL_QUERY;
                    togoSpeak('Let\'s do something else!' );
                  }
                  if( actualRoutineList.length > 0 ){
                    togoSpeak('Now it\'s time to ' + actualRoutineList[0].activity + '' );
                  }
                  // finished process
                  cb();

                  //app.delete().then( () => { console.log( "Finished"); });
              }
  );
}

function checkAlarms(){

  if( !GeneralVariables.getVariable("wakeuptime_alarm_done") ){
    // TODO:: maybe not equal but greater than. not needed right now
    if( GeneralVariables.getVariable("wakeuptime_week")  == parseActualHour() ){
          togoSpeak("It is time to wake up sunshine!!!");
          GeneralVariables.update("wakeuptime_alarm_done",true);
          state = MORNING_ROUTINE_GET;
    }
  }

}

function syncData(){
  console.log(" STATE "  + state);
  if( state == GENERAL_QUERY){
    doGeneralQuery( () => {
      checkAlarms();
      setTimeout( syncData , 4000);
    } );
  }

  if( state == MORNING_ROUTINE_GET){
  doMorningRoutine( () => {
    setTimeout( syncData , 4000);
    } );
  }

  if( state == BEDTIME_ROUTINE_GET){
  doBedtimeRoutine( () => {
    setTimeout( syncData , 4000);
    } );
  }


  if( state == ACTIVITY_CHECK ){
      // ask database for any robot event status 0, type = 6
      console.log(" ACTIVITY CHECK ");
    doActivityCheck( ()=>{
      setTimeout( syncData , 4000);
    } );
  }

  if( state == STORYTELLING ){
    doStorytellRoutine( ()=>{
      setTimeout( syncData , 4000);
    } );
  }

}

function parseActualHour(){
  var dt = new Date();
  return (""+dt.getHours()).padStart(2,"0") + ":" + (""+dt.getMinutes()).padStart(2,"0");
}

function togoSpeak(message){
  let params = {
      'Text': message ,
      'OutputFormat': 'pcm',
      'VoiceId': 'Justin'
  };
  Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
          console.log(err.code)
      } else if (data) {
          if (data.AudioStream instanceof Buffer) {
              // Initiate the source
              let bufferStream = new Stream.PassThrough();
              // convert AudioStream into a readable stream
              bufferStream.end(data.AudioStream);
              // Pipe into Player
              bufferStream.pipe(GeneralComponents.getPlayer());
          }
      }
  });

}

function getColor(){
  return LEDControl.buildColor(255,255,0);
}

var configData ={
    ledsPerStrip:16,
    strips:[
      {
        mode:NeopixelConstants.PIXEL_MODE,
        loopMode:NeopixelConstants.PING_PONG,
        mainColor:PixelColor.CYAN,
        secondaryColor:PixelColor.CYAN,
        leds:16,
        chaseWidth:4,
        pixelArray:[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1]
     },
      {
        mode:NeopixelConstants.EYE_BLINK_MODE,
        loopMode:NeopixelConstants.FORWARD,
        mainColor:PixelColor.CYAN,
        secondaryColor:PixelColor.CYAN,
        leds:16,
        chaseWidth:3
     },
     {
       mode:NeopixelConstants.EYE_BLINK_MODE,
       loopMode:NeopixelConstants.FORWARD,
       mainColor:PixelColor.CYAN,
       secondaryColor:PixelColor.CYAN,
       leds:16,
       chaseWidth:3
    },

    ]
};

//* enable when ready to deploy lights
// this should change as it does not reflect the internal state. Just with setMode or setLoopMode the variables should be set. idea?: make the static vars, instance vars.
LEDControl.initInstance();
LEDControl.configureStrips(configData);
LEDControl.setFrameTotals(40,1);
LEDControl.setFrameTotals(40,2);
//LEDControl.showHappyFace( LEDControl.buildColor(0,255,255) , LEDControl.buildColor(0,255,255) );
LEDControl.start();

setTimeout( syncData , 3000);
