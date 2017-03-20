//Game API

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
	this.htmlCanv = canv;
	this.game = game;
	this.ctx = this.htmlCanv.getContext("2d");
	this.dynamicObjects = [];

	this.setBaseState = function(){
		this.baseState = this.ctx.getImageData(0, 0, this.htmlCanv.width, this.htmlCanv.height);
	}

	this.addDynamicObject = function(id, drawFunction, params, updateFunction){
		var obj = new DynamicObject(id, drawFunction, this, params, updateFunction);
		for (var prop in obj.params) {
	    if (obj.params.hasOwnProperty(prop)) {
	    		if(!this.game.params.hasOwnProperty(prop)){
	        	this.game.params[""+prop] = obj.params[""+prop];
	        	if(prop === "p1_xPos"){
	        		console.log(obj.params[""+prop]);
	        	}
	      	} else {
	      		//TODO: throw error for repeated property
	      	}
	    }
		}
		this.dynamicObjects.push(obj);
	}

	this.updateCanvas = function(){
		this.resetToBaseState();
		this.drawObjects();
	}

	this.resetToBaseState = function(){
		this.ctx.putImageData(this.baseState, 0, 0);
	}

	this.drawObjects = function(){
		var i = 0;
		var boundary = this.dynamicObjects.length;
		while(i < boundary){
			this.dynamicObjects[i].update();
			if(this.dynamicObjects[i].expired){
				this.dynamicObjects.splice(i,1);
				boundary--;
			} else {
				this.dynamicObjects[i].draw();
				i++;
			}
		}
	}
}

//-------------------------------------------------------------------------------------

//Game Object
//Master object for a unique game instance
function Game(minPlayers, maxPlayers){
	this.minPlayers = minPlayers;
	this.maxPlayers = maxPlayers;
	this.params = {};
	this.controlHandler = null;
	this.canvs = [];
	this.htmlObjects = [];	//non-canvas HTML elements
	this.frame_rate = 10;
	this.active = true;
	this.htmlBod = document.getElementsByTagName("body")[0];
	
	//all HTML element insertions (Canvas or other) insert the new element as the first element in body
	//canvas is created using given style specs
	this.addCanvas = function(canvID,canvWidth,canvHeight,canvStyle){
		var canv = document.createElement("canvas");
		canv.id = canvID;
		canv.width = canvWidth;
		canv.height = canvHeight;
		canv.style = canvStyle;
		this.canvs[""+canvID] = new Canvas(canv, this);
		this.htmlBod.insertBefore(canv, this.htmlBod.firstChild);
	}
	
	this.addHTMLObject = function(obj,objID){
		document.getElementsByTagName("body")[0].insertBefore(obj,this.htmlBod.firstChild);
		this.htmlObjects[""+objID] = obj;
	}

	this.addParam = function(id, defValue){
		this.params[""+id] = defValue;
	}

	this.setFrameRate = function(num){
		this.frame_rate = num;
	}

	this.receiveControls = function(){
		//TODO: Communicate with server to obtain controller input
		
		var controls = null;
		this.controlHandler(controls);
	}

	this.setControlHandler = function(f){
		this.controlHandler = f;
	}

	this.gameRefresh = function(){
		for(canv in this.canvs){
			this.canvs[canv].updateCanvas();
		}
	}

	this.startGame = function(){
		var obj = this;
		setTimeout(function(){
			obj.gameLoop(obj);
		}, obj.frame_rate);
	}

	this.gameLoop = function(obj){
		if(obj.active){
			obj.gameRefresh();
			setTimeout(function(){
				obj.gameLoop(obj);
			}, obj.frame_rate);
		}
	}
}