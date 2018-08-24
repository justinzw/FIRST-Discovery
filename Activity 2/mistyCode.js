//---------------
// Variables used in this Activity
//---------------

//Try changing what sound Misty Plays when she recognizes a specific person!
var knownPerson = { "AssetId": "001-OooOooo.wav", };
var knownPerson1 = { "AssetId": "002-Ahhh.wav", };
var knownPerson2 = { "AssetId": "005-Sigh-02.wav", };

var ipAddress  = document.getElementById("ip-address");
var connect = document.getElementById("connect");
var start = document.getElementById("start");
var stop = document.getElementById("stop");
var resultsBox = document.getElementById("results");
var trainName = document.getElementById("new-name");
var client;
var ip;
var payload;
var newName;

var msg = {
  "$id": "1",
  "Operation": "subscribe",
  "Type": "FaceRecognition",
  "DebounceMs": 1500,
  "EventName": "FaceRecognition2",
  "Message": ""
};

var unsubscribeMsg = {
  "$id": "1",
  "Operation": "unsubscribe",
  "EventName": "FaceRecognition2",
  "Message": ""
};

var message = JSON.stringify(msg);
var unsubscribeMessage = JSON.stringify(unsubscribeMsg);
var messageCount = 0;
var socket;

//---------------
//Functions used with this Activity
//---------------

//This function is called when the 'Connect' button is clicked
connect.onclick = function() {
  ip = validateIPAddress(ipAddress.value);
  if (!ip) {
    printToScreen("IP address needed.");
    return;
  }
  client = new LightClient(ip, 10000);
  client.GetCommand("info/device", function(data) {
    printToScreen("Connected to the robot.");
    console.log(data);
  });
};

//This function is called when the 'Start' button is clicked
start.onclick = function() {
  if (!ip) {
    printToScreen("You must connect to a robot first.");
    return;
  }
  startFaceRecognition();
};

//This function is called when the 'Stop' button is clicked
stop.onclick = function() {
  stopFaceRecognition();
};

//This function is called when the 'Train' button has been clicked
train.onclick = function() {
  //Validate that a name has been entered
  var newName = trainName.value;
  if (newName == "") {
    printToScreen("Need a name to train someone new!");
    return;
  }
  if(newName.includes(" ") || !isValid(newName)) {
    printToScreen("The name cannot contain spaces or special characters!");
    return;
  }

  //Train Face with name
  client = new LightClient(ip, 10000);
  
  // var trainThisPerson = {"FaceID": "Chris", };
  newName = "" + newName + "";
  var trainThisPerson = {"FaceID": newName, }; 
  var payload = JSON.stringify(trainThisPerson);
  // printToScreen(payload);

  client.PostCommand("beta/faces/training/start", payload);
  printToScreen("Training '" + newName + ".' Please look at Misty's face and don't move for 15 seconds!")
};

function isValid(str){
  return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
 }

//This function will start Misty looking for known faces and will respond when a known person is recognized
function startFaceRecognition() {
    
    //Create a new websocket
    socket = new WebSocket("ws://" + ip + "/pubsub");
    
    //When the socket is open, send the message
    socket.onopen = function(event) {
      printToScreen("WebSocket opened.");
      socket.send(message);
      client.PostCommand("beta/faces/recognition/start", null, handleResult);
    };
    
    // Handle messages received from the server
    socket.onmessage = function(event) {
      console.log(event);
      var message = JSON.parse(event.data).message;
      console.log(message);
      
      if (message && message.personName && message.personName !== "unknown person") {
        printToScreen("I think I know you. Is this " + message.personName + "?");

        //Add Custom Sounds here to play different sounds for different people!
        switch(message.personName) {
          case "Person1":
            payload = JSON.stringify(knownPerson1);
            client.PostCommand("audio/play", payload);
            break;
          case "Person2":
            payload = JSON.stringify(knownPerson2);
            client.PostCommand("audio/play", payload);
            break;
          default:  
            var payload = JSON.stringify(knownPerson);
            client.PostCommand("audio/play", payload);
        }

      } 
      else {
        messageCount += 1;
      }
      
      if (messageCount % 10 === 0) {
        printToScreen("Looking for a familiar face ...");
      }
    };
    
    // Handle any errors that occur.
    socket.onerror = function(error) {
      console.log("WebSocket Error: " + error);
    };
    
    // Do something when the WebSocket is closed.
    socket.onclose = function(event) {
      printToScreen("WebSocket closed.");
    };
};

//This function will stop Misty looking for a know person
function stopFaceRecognition() {
  client.PostCommand("beta/faces/recognition/stop");
  
  if(socket) {
    socket.send(unsubscribeMessage);
    printToScreen("Face recognition stopped.");  
    //socket.close();
  }

  messageCount = 0;
}

function handleResult(data) {
  console.log(data);
  if (data[0].result) {
    printToScreen("Face recognition started.")
  }
}

//This function is validates that the number in the text field looks like an IP address
function validateIPAddress(ip) {
	var ipNumbers = ip.split(".");
	var ipNums = new Array(4);
	if (ipNumbers.length !== 4) {
		return "";
	}
	for (let i = 0; i < 4; i++) {
		ipNums[i] = parseInt(ipNumbers[i]);
		if (ipNums[i] < 0 || ipNums[i] > 255) {
			return "";
		}
	}
	return ip;
}

//This function will print things to message box in Activity2.html
function printToScreen(msg) {
  resultsBox.innerHTML += (msg + "\n");
}
