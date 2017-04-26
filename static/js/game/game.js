//Game API

var DEBUG = false;

var MSG_TYPE_START_GAME = 0;
var MSG_TYPE_END_GAME = 1;
var MSG_TYPE_NEW_PLAYER_JOIN = 2;
var MSG_TYPE_CONTROL_DATA = 3;

var GAME_CREATED = 0;
var GAME_LOBBYING = 1;
var GAME_ACTIVE = 2;
var GAME_ENDED = 3;

//-------------------------------------------------------------------------------------

//DynamicObject
//Object that represents a single moving/dynamic sprite
function DynamicObject(id, drawFunction, canv, params, updateFunction){
	this.id = id;
	this.params = params; //params should be a list of ids that correspond to the game's parameter id list
	this.canv = canv;
	this.draw = drawFunction;
	this.update = updateFunction;	//function to update position/parameters of object
	this.expired = false; //set expired to true when object is ready to be deleted
}

//-------------------------------------------------------------------------------------

//Canvas Object
//Object that represents a single display region
function Canvas(canv, game){
	var baseState = null;
	this.htmlCanv = canv;
	this.game = game;
	this.ctx = this.htmlCanv.getContext("2d");
	this.dynamicObjects = [];

	function resetToBaseState(obj){
		obj.ctx.putImageData(baseState, 0, 0);
	}

	function drawObjects(obj){
		var i = 0;
		var boundary = obj.dynamicObjects.length;
		while(i < boundary){
			obj.dynamicObjects[i].update();
			if(obj.dynamicObjects[i].expired){
				obj.dynamicObjects.splice(i,1);
				boundary--;
			} else {
				obj.dynamicObjects[i].draw();
				i++;
			}
		}
	}

	this.setBaseState = function(){
		baseState = this.ctx.getImageData(0, 0, this.htmlCanv.width, this.htmlCanv.height);
	}

	this.addDynamicObject = function(id, drawFunction, params, updateFunction){
		var obj = new DynamicObject(id, drawFunction, this, params, updateFunction);
		for (var prop in obj.params) {
	    if (obj.params.hasOwnProperty(prop)) {
	    		if(!this.game.params.hasOwnProperty(prop)){
	        	this.game.params[""+prop] = obj.params[""+prop];
	      	} else {
	      		//TODO: throw error for repeated property
	      	}
	    }
		}
		this.dynamicObjects.push(obj);
	}

	//pseudo-private (should only be accessible to Game)

	this.updateCanvas = function(){
		resetToBaseState(this);
		drawObjects(this);
	}
}

//-------------------------------------------------------------------------------------

//Game Object
//Master object for a unique game instance
//When the Game developer submits the game, they will be responsible for specifying 
//min players, max players
function Game(minP, maxP){
	var htmlBod = document.getElementsByTagName("body")[0];
	var frame_rate =60;
	//TODO: combine active and lobbyComplete 
	var active = true;
	var lobbyComplete = false;
	var gameServerSocket = null;
	var minPlayers = minP;
	var maxPlayers = maxP;
	var gameStatus = GAME_CREATED;
	this.playerIDs = [];
	this.params = {};
	this.canvs = [];
	this.htmlObjects = [];	//non-canvas HTML elements
	this.controlHandler = null;

	function gameRefresh(obj){
		for(canv in obj.canvs){
			obj.canvs[canv].updateCanvas();	
		}
	}

	function gameLoop(obj){
		if(active){
			gameRefresh(obj);
			setTimeout(function(){
				gameLoop(obj);
			}, 1000/frame_rate);
		}
	}

	//all HTML element insertions (Canvas or other) insert the new element as the first element in body
	//canvas is created using given style specs
	this.addCanvas = function(canvID,canvWidth,canvHeight,canvStyle){
		var canv = document.createElement("canvas");
		canv.id = canvID;
		canv.width = canvWidth;
		canv.height = canvHeight;
		canv.style = canvStyle;
		this.canvs[""+canvID] = new Canvas(canv, this);
		htmlBod.insertBefore(canv, htmlBod.firstChild);
	}

	this.addHTMLObject = function(obj,objID){
		document.getElementsByTagName("body")[0].insertBefore(obj,htmlBod.firstChild);
		this.htmlObjects[""+objID] = obj;
	}

	this.addParam = function(id, defValue){
		this.params[""+id] = defValue;
	}

	this.startLobby = function(callback){

        if(DEBUG){
            callback();
            return;
        }


		gameStatus = GAME_LOBBYING;
		//special initialization message
		var message = {
			name:"HOST	",
			room:getParameterByName('r'),
			uuid:getCookie("uuid")
		}

		gameServerSocket = new WebSocket("ws://localhost/ws");
		gameServerSocket.onopen = function(){
			gameServerSocket.send(JSON.stringify(message));
		}
		var _this = this;
		var _maxPlayers = maxPlayers;
		var _minPlayers = minPlayers;
		var _gameStatus = gameStatus;
		lobbyComplete = true;
		gameServerSocket.onmessage = function(msg){
			//TODO: handle parse error
			console.log("Start Lobby: ");console.log(msg);
			var pack = JSON.parse(msg.data);
			if(_gameStatus == GAME_LOBBYING && pack.msgtype == MSG_TYPE_NEW_PLAYER_JOIN){
				//add player's UUID to array of players
				console.log("Player Joined")
				_this.playerIDs.push(pack.uuid);
				if(_this.playerIDs.length == _maxPlayers){
					console.log("Max Players Reached. Starting Game")
					var m_pack = {
						msgtype: MSG_TYPE_START_GAME,
						uuid: getCookie("uuid"),
						data: 0
					}
					//start game
					console.log("Start Game: Calling the call back")
					gameServerSocket.send(JSON.stringify(m_pack));
					_gameStatus = GAME_ACTIVE;
					callback();
				} else if(_this.playerIDs.length == _minPlayers){
					//TODO: make game eligible for starting with minPlayers < numPlayers < maxPlayers
				}
			} else if(_gameStatus == GAME_ACTIVE && pack.msgtype == MSG_TYPE_CONTROL_DATA){
				//verify UUID of sending player
				if(_this.playerIDs.indexOf(pack.uuid) >= 0){
					_this.controlHandler(pack.uuid, pack.data);
				}
			}
		}	
	}

	this.setFrameRate = function(num){
		frame_rate = num;
	}

	this.setControlHandler = function(f){
		this.controlHandler = f;
	}

	this.startGame = function(){
		//ensure lobbying has taken place
		if(!lobbyComplete && !DEBUG){
			this.startLobby();
		}

		var obj = this;
		setTimeout(function(){
			gameLoop(obj);
		}, 1000/frame_rate);
	}

	this.endGame = function(callback){
		active = false;
		gameStatus = GAME_ENDED;
		var msg = {
			msgtype: MSG_TYPE_END_GAME,
			uuid: getCookie("uuid"),
			data: 0
		}
		gameServerSocket.send(JSON.stringify(msg));
		callback();
	}
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
