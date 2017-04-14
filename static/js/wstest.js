/**
 * Created by Chris on 3/12/2017.
 */


var html = '<input onkeypress="if(this.value) {if (window.event.keyCode == 13) { sendMessage(this.value); this.value = null; }}"/>'+
    '<div id="output"></div>';



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


function init() {
    document.write(html);
    if(getCookie("name") == undefined || getCookie("uuid") == undefined){
        console.log("Name or UUID not defined");
        return
    }

    var gameroom = getParameterByName("r");

    if(gameroom === '' || gameroom === null){
        window.location.replace("/");
        return
    }

    

    websocket = new WebSocket("ws://localhost/ws");

    websocket.onopen = function() {
        document.getElementById("output").innerHTML += "<p>> CONNECTED</p>";

        var message = {
            name:getCookie("name"),
            room: gameroom,
            uuid: getCookie("uuid")
        };

        websocket.send(JSON.stringify(message));
    };

    websocket.onmessage = function(evt) {
        document.getElementById("output").innerHTML += "<p style='color: blue;'>" + evt.data + "</p>";
    };

    websocket.onerror = function(evt) {
        document.getElementById("output").innerHTML += "<p style='color: red;'>> ERROR: " + evt.data + "</p>";
    };
}

function sendMessage(message) {
    //document.getElementById("output").innerHTML += "<p>> SENT: " + message + "</p>";
    websocket.send(message);
}

window.addEventListener("load", init, false);
