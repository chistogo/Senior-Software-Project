//Controller API
var MSG_TYPE_START_GAME = 0;
var MSG_TYPE_END_GAME = 1;
var MSG_TYPE_NEW_PLAYER_JOIN = 2;
var MSG_TYPE_CONTROL_DATA = 3;

var GAME_CREATED = 0;
var GAME_LOBBYING = 1;
var GAME_ACTIVE = 2;
var GAME_ENDED = 3;


function Controller(){
    var controllerServerSocket = null;
    var active = false;
    this.data = {};
    this.htmlObjects = [];

    this.setup = function(){
        //special initilization message



        //This is the message sent directly to the actual service not the SS Host
        controllerServerSocket = new WebSocket("ws://localhost/ws");
        controllerServerSocket.onopen = function(){

            var message = {
                name:getCookie("name"),
                room:getParameterByName("r"),
                uuid:getCookie("uuid")
            }

            controllerServerSocket.send(JSON.stringify(message));
            console.log(message);
            //
            message = {
                msgtype: MSG_TYPE_NEW_PLAYER_JOIN,
                uuid: getCookie("uuid"),
                name:getCookie("name")
            }
            controllerServerSocket.send(JSON.stringify(message));
            active = true;
        }
        controllerServerSocket.onmessage = function(packet){
            console.log("message received");
            if(packet.constructor !== "string".constructor){
                //this message is already JSON
                msg = packet;
            } else {
                msg = JSON.parse(packet);
                //TODO: handle parse errors here
            }
            if(msg.msgtype == MSG_TYPE_END_GAME){
                controllerServerSocket.close();
            }
            //TODO: handle incoming messages from host - not first priority
        }
    }

    this.addHTMLObject = function(obj,objID){
        var htmlBod = document.getElementsByTagName("body")[0];
        htmlBod.insertBefore(obj,htmlBod.firstChild);
        this.htmlObjects[""+objID] = obj;
    }

    //takes in a string representing css for the page
    this.setCSS = function(css){
        var newStyle = document.createElement("style");
        newStyle.type = "text/css";
        newStyle.innerHTML = css;
        document.getElementsByTagName("head")[0].appendChild(newStyle);
    }

    //sends the current state
    this.sendState = function(){
        this.sendMessage(this.data);
    }

    //sends a specific message
    this.sendMessage = function(msg){
        if(active){
            var message = {
                msgtype: MSG_TYPE_CONTROL_DATA,
                uuid:getCookie("uuid"),
                data:msg
            }
            console.log("sending message: ");
            console.log(msg);
            controllerServerSocket.send(JSON.stringify(message));
        }
    }

    //TODO: provide a looping mechanism that calls sendState at a specified framerate if the developer wants it

}

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getCookie(key) {
    key = key+'='
    var records = document.cookie.split('; ');
    for (var i = 0; i<records.length ;i++){
        //Check to see if it is even possible to be the key
        if(records[i].length>=key.length){
            if(records[i].substr(0,key.length) === key){
                return records[i].substr(key.length)
            }
        }
    }
}

function setCookie(key , value , expiration) {

    //Note this cookie is deleted when window is closed
    if(expiration === null){
        document.cookie = key+"="+value+";path=/"
    }else{
        document.cookie = key+"="+value+"; expires="+expiration+"; path=/"
    }

}