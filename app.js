// ------------------------------------------------------------------------
// --------------------------- CODE DESCRIPTION ---------------------------
// ------------------------------------------------------------------------
// Project:fts_blue - app.js
// Description: app.js connects and streams data to ibm bluemix from a device in Connio
// V2 test code

// ------------------------------------------------------------------------
// ----------------------- STEP 1: IMPORT LIBRARIES -----------------------
// ------------------------------------------------------------------------
// Load module libraries

var Client = require('ibmiotf'); 	// Load ibmiotf library to variable client
var mqtt = require('mqtt'); 		// Load mqtt module library to variable mqtt
var raspicam = require('raspicam');


// ------------------------------------------------------------------------
// ----------------------- STEP 2: CREATE VARIABLES -----------------------
// ------------------------------------------------------------------------

// CONNIO MQTT VALUES
var mqttConnectionInfo = {
	host: 'mqtt.connio.com',
	port: 1883,
	clientId: '_dev_816805413023258120',
	username: '_key_816805413047564113',
	password: 'e6a9e95e497e44a58c72483714235b75',
	keepalive: 30
};
// BLUEMIX MQTT VALUES
var BLUEconfig = {
	"org" : "3wetpr",
	"id" : "b827eb0bccfb",
	"domain": "internetofthings.ibmcloud.com",
	"type" : "LT1-Repeater",  
	"auth-method" : "token",
	"auth-token" : "welcomeftsx1"
};
var BLUEClient = new Client.IotfDevice(BLUEconfig); 	// New Bluemix client
var FTSclient = mqtt.connect(mqttConnectionInfo); 	// New mqtt connio client


//Raspberry Pi Camera Object
var camera = new raspicam({
	mode: "photo",
	output: "./photo/photo.jpg",
	encoding: "jpg",
	w: 1024,
	h: 768,
	q: 50 
});

//Photo Capture Interval
setInterval(function(){
	camera.start();
	camera.on("start", function(err,timestamp){

	});
	camera.on("read", function(err, timestamp,filename){
	console.log("photo captured with filename: " + filename);
	camera.stop();
	});

}, 5000);


// Connio target's deviceID
// var deviceId = '_dev_776797767428231141'; 	// FTS Bear mountain LT1 17
// var deviceId = '_dev_705085688076265602'; 	// FTS Weather Pi Connio ID
var BLUEdeviceId = '_dev_816805413023258120'; 	// FTS repeater Pi ID
// var S42 = '_dev_776242974396533236'; 		// FTS LT1 station 42 ID
var FireLT1 = '_dev_837084276847786454'; 	// FTS FIRE LT1 for IBM demo



var msghold = "No new messages have been received"; 	// string holder for incoming messages from connio

var blueconnect  = 0;		// Bluemix Connection status holder
var connioconnect = 0;		// Connio Connection status holder
var i = 0; 			// Loop counter
var m = 0; 			// message sent status holder
var MessageSent;		// Declare sent message holder
var msgR = 0;			// Message received holder

var temperature = 20;

// ------------------------------------------------------------------------
// --------------- STEP 3: ESTABLISH CONNECTION WITH CONNIO ---------------
// ------------------------------------------------------------------------


// Turning the conio connection on
console.log("Connecting to connio..."); 						// Print to console (for troubleshooting)
FTSclient.on('connect',function(){
	connioconnect = 1; 								// Set connio conection status indicator to on
	console.log('Connected to connio!!... subscribing...');
	FTSclient.subscribe('connio/data/in/devices/' + FireLT1 + '/properties/data') 	// Subscribe to desired property
	console.log('Subscribed to ' + FireLT1 + '/properties/data') ; 			// Print to console (for troubleshooting)
	
});

// Turning on message handler to receive messages from subscribed topics (works like an interrupt I think)
console.log('Starting message handler');	// Print to console (for troubleshooting)
FTSclient.on("message", function (topic, message){
			
	console.log('-**- A MESSAGE HAS BEEN RECEIVED! -**-'); 	// Print property data to console (for troubleshooting)
	console.log('%s', message);
	console.log('-************************************-');
	msghold = message.toString(); 			// Save connio property to message holder
	msgR = 1;
		
});


// ------------------------------------------------------------------------
// ----------- STEP 4: ESTABLISH CONNECTION WITH BLUEMIX SERVER -----------
// ------------------------------------------------------------------------

// Connecting to IBM Bluemix server
console.log("Attempting to connect to Bluemix..."); 	// Print to console (for troubleshooting)
BLUEClient.connect(); 					// Calls ibmiot connect function
console.log("connect function called..."); 		// Print to console (for troubleshooting)

// Turning the IBM Bluemix connection on
BLUEClient.on("connect", function () {
	blueconnect = 1; 				// Set bluemix conection status indicator to on
	console.log("conected to IBM IOT"); 		// Print to console (for troubleshooting)
})	
	 
// ------------------------------------------------------------------------
// ----------- ***** FUNCTIONS FOR TESTING ONLY ***** -----------
// ------------------------------------------------------------------------

function SendMessage(counter) {
	
	var topicNew = 'connio/data/in/devices/' + BLUEdeviceId + '/properties/data';
	// console.log(topicNew);

	console.log('...');
	MessageSent = JSON.stringify('this is message number ' + counter);
	
	FTSclient.publish(topicNew, MessageSent, {retain: true}, function () {

		console.log('Successfully sent message! Sent message: ' + counter); // Print sent message to console (for troubleshooting)

	});

	console.log('...'); // Print to console (for troubleshooting)
	return 1;
}

// ------------------------------------------------------------------------
// ------- STEP 5: FOREVER LOOP - STREAM DATA FROM CONNIO TO BLUEMIX ------
// ------------------------------------------------------------------------


setInterval(function (){
	
	console.log('-------------------break------------------'); 	// Print to console (for troubleshooting)
	console.log('Loop count: ' + i);
	if(blueconnect && connioconnect){

		// ********** PUBLISH TO CONNIO - TESTING ONLY *************
		// Publishing to connio
		m = SendMessage(i);
		if(m){
			// console.log('message sending complete'); // Print to console (for troubleshooting)
			m = 0;
		}

		// ******************** END OF TEST CODE ********************
	
		
		// Publishing event using default quality of service
		BLUEClient.publish("status","json", '{"d" : {"temp" : '+temperature+'}}');
		console.log("Status published!"); 	// Print to console (for troubleshooting)
		
//ONLY FOR TESTING!!
		console.log("Temperature: "+ temperature);
		temperature = temperature+1;	
		if(temperature > 40){
			temperature = 20;
		}

		if(msgR){
			// Publishing connio data to bluemix
			BLUEClient.publish("data","json", JSON.stringify({"d" : {msghold}}));
			console.log("Data published!!! CHECK BLUEMIX"); 		// Print to console (for troubleshooting)
		}

	}
	
	// console.log('Device data sent to bluemix:');
	// console.log('Message status: ' + msghold);
	
	msghold = "No new messages have been received"; // reset message holder
	msgR = 0;
	i++; // increment loop counter

},1000);
// Execute loop every 10 seconds


// ________ END OF SCRIPT _________
