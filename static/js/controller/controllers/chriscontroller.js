// ============================================================================================
//Source : https://github.com/jeromeetienne/virtualjoystick.js

var VirtualJoystick	= function(opts)
{
    opts			= opts			|| {};
    this._container		= opts.container	|| document.body;
    this._strokeStyle	= opts.strokeStyle	|| 'cyan';
    this._stickEl		= opts.stickElement	|| this._buildJoystickStick();
    this._baseEl		= opts.baseElement	|| this._buildJoystickBase();
    this._mouseSupport	= opts.mouseSupport !== undefined ? opts.mouseSupport : false;
    this._stationaryBase	= opts.stationaryBase || false;
    this._baseX		= this._stickX = opts.baseX || 0
    this._baseY		= this._stickY = opts.baseY || 0
    this._limitStickTravel	= opts.limitStickTravel || false
    this._stickRadius	= opts.stickRadius !== undefined ? opts.stickRadius : 100
    this._useCssTransform	= opts.useCssTransform !== undefined ? opts.useCssTransform : false

    this._container.style.position	= "relative"

    this._container.appendChild(this._baseEl)
    this._baseEl.style.position	= "absolute"
    this._baseEl.style.display	= "none"
    this._container.appendChild(this._stickEl)
    this._stickEl.style.position	= "absolute"
    this._stickEl.style.display	= "none"

    this._pressed	= false;
    this._touchIdx	= null;

    if(this._stationaryBase === true){
        this._baseEl.style.display	= "";
        this._baseEl.style.left		= (this._baseX - this._baseEl.width /2)+"px";
        this._baseEl.style.top		= (this._baseY - this._baseEl.height/2)+"px";
    }

    this._transform	= this._useCssTransform ? this._getTransformProperty() : false;
    this._has3d	= this._check3D();

    var __bind	= function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
    this._$onTouchStart	= __bind(this._onTouchStart	, this);
    this._$onTouchEnd	= __bind(this._onTouchEnd	, this);
    this._$onTouchMove	= __bind(this._onTouchMove	, this);
    this._container.addEventListener( 'touchstart'	, this._$onTouchStart	, false );
    this._container.addEventListener( 'touchend'	, this._$onTouchEnd	, false );
    this._container.addEventListener( 'touchmove'	, this._$onTouchMove	, false );
    if( this._mouseSupport ){
        this._$onMouseDown	= __bind(this._onMouseDown	, this);
        this._$onMouseUp	= __bind(this._onMouseUp	, this);
        this._$onMouseMove	= __bind(this._onMouseMove	, this);
        this._container.addEventListener( 'mousedown'	, this._$onMouseDown	, false );
        this._container.addEventListener( 'mouseup'	, this._$onMouseUp	, false );
        this._container.addEventListener( 'mousemove'	, this._$onMouseMove	, false );
    }
}

VirtualJoystick.prototype.destroy	= function()
{
    this._container.removeChild(this._baseEl);
    this._container.removeChild(this._stickEl);

    this._container.removeEventListener( 'touchstart'	, this._$onTouchStart	, false );
    this._container.removeEventListener( 'touchend'		, this._$onTouchEnd	, false );
    this._container.removeEventListener( 'touchmove'	, this._$onTouchMove	, false );
    if( this._mouseSupport ){
        this._container.removeEventListener( 'mouseup'		, this._$onMouseUp	, false );
        this._container.removeEventListener( 'mousedown'	, this._$onMouseDown	, false );
        this._container.removeEventListener( 'mousemove'	, this._$onMouseMove	, false );
    }
}

/**
 * @returns {Boolean} true if touchscreen is currently available, false otherwise
 */
VirtualJoystick.touchScreenAvailable	= function()
{
    return 'createTouch' in document ? true : false;
}

/**
 * microevents.js - https://github.com/jeromeetienne/microevent.js
 */
;(function(destObj){
    destObj.addEventListener	= function(event, fct){
        if(this._events === undefined) 	this._events	= {};
        this._events[event] = this._events[event]	|| [];
        this._events[event].push(fct);
        return fct;
    };
    destObj.removeEventListener	= function(event, fct){
        if(this._events === undefined) 	this._events	= {};
        if( event in this._events === false  )	return;
        this._events[event].splice(this._events[event].indexOf(fct), 1);
    };
    destObj.dispatchEvent		= function(event /* , args... */){
        if(this._events === undefined) 	this._events	= {};
        if( this._events[event] === undefined )	return;
        var tmpArray	= this._events[event].slice();
        for(var i = 0; i < tmpArray.length; i++){
            var result	= tmpArray[i].apply(this, Array.prototype.slice.call(arguments, 1))
            if( result !== undefined )	return result;
        }
        return undefined
    };
})(VirtualJoystick.prototype);

//////////////////////////////////////////////////////////////////////////////////
//										//
//////////////////////////////////////////////////////////////////////////////////

VirtualJoystick.prototype.deltaX	= function(){ return this._stickX - this._baseX;	}
VirtualJoystick.prototype.deltaY	= function(){ return this._stickY - this._baseY;	}

VirtualJoystick.prototype.up	= function(){
    if( this._pressed === false )	return false;
    var deltaX	= this.deltaX();
    var deltaY	= this.deltaY();
    if( deltaY >= 0 )				return false;
    if( Math.abs(deltaX) > 2*Math.abs(deltaY) )	return false;
    return true;
}
VirtualJoystick.prototype.down	= function(){
    if( this._pressed === false )	return false;
    var deltaX	= this.deltaX();
    var deltaY	= this.deltaY();
    if( deltaY <= 0 )				return false;
    if( Math.abs(deltaX) > 2*Math.abs(deltaY) )	return false;
    return true;
}
VirtualJoystick.prototype.right	= function(){
    if( this._pressed === false )	return false;
    var deltaX	= this.deltaX();
    var deltaY	= this.deltaY();
    if( deltaX <= 0 )				return false;
    if( Math.abs(deltaY) > 2*Math.abs(deltaX) )	return false;
    return true;
}
VirtualJoystick.prototype.left	= function(){
    if( this._pressed === false )	return false;
    var deltaX	= this.deltaX();
    var deltaY	= this.deltaY();
    if( deltaX >= 0 )				return false;
    if( Math.abs(deltaY) > 2*Math.abs(deltaX) )	return false;
    return true;
}

//////////////////////////////////////////////////////////////////////////////////
//										//
//////////////////////////////////////////////////////////////////////////////////

VirtualJoystick.prototype._onUp	= function()
{
    this._pressed	= false;
    this._stickEl.style.display	= "none";

    if(this._stationaryBase == false){
        this._baseEl.style.display	= "none";

        this._baseX	= this._baseY	= 0;
        this._stickX	= this._stickY	= 0;
    }
}

VirtualJoystick.prototype._onDown	= function(x, y)
{
    this._pressed	= true;
    if(this._stationaryBase == false){
        this._baseX	= x;
        this._baseY	= y;
        this._baseEl.style.display	= "";
        this._move(this._baseEl.style, (this._baseX - this._baseEl.width /2), (this._baseY - this._baseEl.height/2));
    }

    this._stickX	= x;
    this._stickY	= y;

    if(this._limitStickTravel === true){
        var deltaX	= this.deltaX();
        var deltaY	= this.deltaY();
        var stickDistance = Math.sqrt( (deltaX * deltaX) + (deltaY * deltaY) );
        if(stickDistance > this._stickRadius){
            var stickNormalizedX = deltaX / stickDistance;
            var stickNormalizedY = deltaY / stickDistance;

            this._stickX = stickNormalizedX * this._stickRadius + this._baseX;
            this._stickY = stickNormalizedY * this._stickRadius + this._baseY;
        }
    }

    this._stickEl.style.display	= "";
    this._move(this._stickEl.style, (this._stickX - this._stickEl.width /2), (this._stickY - this._stickEl.height/2));
}

VirtualJoystick.prototype._onMove	= function(x, y)
{
    if( this._pressed === true ){
        this._stickX	= x;
        this._stickY	= y;

        if(this._limitStickTravel === true){
            var deltaX	= this.deltaX();
            var deltaY	= this.deltaY();
            var stickDistance = Math.sqrt( (deltaX * deltaX) + (deltaY * deltaY) );
            if(stickDistance > this._stickRadius){
                var stickNormalizedX = deltaX / stickDistance;
                var stickNormalizedY = deltaY / stickDistance;

                this._stickX = stickNormalizedX * this._stickRadius + this._baseX;
                this._stickY = stickNormalizedY * this._stickRadius + this._baseY;
            }
        }

        this._move(this._stickEl.style, (this._stickX - this._stickEl.width /2), (this._stickY - this._stickEl.height/2));
    }
}


//////////////////////////////////////////////////////////////////////////////////
//		bind touch events (and mouse events for debug)			//
//////////////////////////////////////////////////////////////////////////////////

VirtualJoystick.prototype._onMouseUp	= function(event)
{
    this.dispatchEvent('mouseEnd', event);
    return this._onUp();
}

VirtualJoystick.prototype._onMouseDown	= function(event)
{
    event.preventDefault();
    var x	= event.clientX;
    var y	= event.clientY;
    this.dispatchEvent('mouseStart', event);
    return this._onDown(x, y);
}

VirtualJoystick.prototype._onMouseMove	= function(event)
{
    var x	= event.clientX;
    var y	= event.clientY;
    this.dispatchEvent('mouseMove', event);
    return this._onMove(x, y);
}

//////////////////////////////////////////////////////////////////////////////////
//		comment								//
//////////////////////////////////////////////////////////////////////////////////

VirtualJoystick.prototype._onTouchStart	= function(event)
{
    // if there is already a touch inprogress do nothing
    if( this._touchIdx !== null )	return;

    // notify event for validation
    var isValid	= this.dispatchEvent('touchStartValidation', event);
    if( isValid === false )	return;

    // dispatch touchStart
    this.dispatchEvent('touchStart', event);

    event.preventDefault();
    // get the first who changed
    var touch	= event.changedTouches[0];
    // set the touchIdx of this joystick
    this._touchIdx	= touch.identifier;

    // forward the action
    var x		= touch.pageX;
    var y		= touch.pageY;
    return this._onDown(x, y)
}

VirtualJoystick.prototype._onTouchEnd	= function(event)
{
    // if there is no touch in progress, do nothing
    if( this._touchIdx === null )	return;

    // dispatch touchEnd
    this.dispatchEvent('touchEnd', event);

    // try to find our touch event
    var touchList	= event.changedTouches;
    for(var i = 0; i < touchList.length && touchList[i].identifier !== this._touchIdx; i++);
    // if touch event isnt found,
    if( i === touchList.length)	return;

    // reset touchIdx - mark it as no-touch-in-progress
    this._touchIdx	= null;

//??????
// no preventDefault to get click event on ios
    event.preventDefault();

    return this._onUp()
}

VirtualJoystick.prototype._onTouchMove	= function(event)
{
    // if there is no touch in progress, do nothing
    if( this._touchIdx === null )	return;

    // try to find our touch event
    var touchList	= event.changedTouches;
    for(var i = 0; i < touchList.length && touchList[i].identifier !== this._touchIdx; i++ );
    // if touch event with the proper identifier isnt found, do nothing
    if( i === touchList.length)	return;
    var touch	= touchList[i];

    event.preventDefault();

    var x		= touch.pageX;
    var y		= touch.pageY;
    return this._onMove(x, y)
}


//////////////////////////////////////////////////////////////////////////////////
//		build default stickEl and baseEl				//
//////////////////////////////////////////////////////////////////////////////////

/**
 * build the canvas for joystick base
 */
VirtualJoystick.prototype._buildJoystickBase	= function()
{
    var canvas	= document.createElement( 'canvas' );
    canvas.width	= 126;
    canvas.height	= 126;

    var ctx		= canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = this._strokeStyle;
    ctx.lineWidth	= 6;
    ctx.arc( canvas.width/2, canvas.width/2, 40, 0, Math.PI*2, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle	= this._strokeStyle;
    ctx.lineWidth	= 2;
    ctx.arc( canvas.width/2, canvas.width/2, 60, 0, Math.PI*2, true);
    ctx.stroke();

    return canvas;
}

/**
 * build the canvas for joystick stick
 */
VirtualJoystick.prototype._buildJoystickStick	= function()
{
    var canvas	= document.createElement( 'canvas' );
    canvas.width	= 86;
    canvas.height	= 86;
    var ctx		= canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle	= this._strokeStyle;
    ctx.lineWidth	= 6;
    ctx.arc( canvas.width/2, canvas.width/2, 40, 0, Math.PI*2, true);
    ctx.stroke();
    return canvas;
}

//////////////////////////////////////////////////////////////////////////////////
//		move using translate3d method with fallback to translate > 'top' and 'left'
//      modified from https://github.com/component/translate and dependents
//////////////////////////////////////////////////////////////////////////////////

VirtualJoystick.prototype._move = function(style, x, y)
{
    if (this._transform) {
        if (this._has3d) {
            style[this._transform] = 'translate3d(' + x + 'px,' + y + 'px, 0)';
        } else {
            style[this._transform] = 'translate(' + x + 'px,' + y + 'px)';
        }
    } else {
        style.left = x + 'px';
        style.top = y + 'px';
    }
}

VirtualJoystick.prototype._getTransformProperty = function()
{
    var styles = [
        'webkitTransform',
        'MozTransform',
        'msTransform',
        'OTransform',
        'transform'
    ];

    var el = document.createElement('p');
    var style;

    for (var i = 0; i < styles.length; i++) {
        style = styles[i];
        if (null != el.style[style]) {
            return style;
        }
    }
}

VirtualJoystick.prototype._check3D = function()
{
    var prop = this._getTransformProperty();
    // IE8<= doesn't have `getComputedStyle`
    if (!prop || !window.getComputedStyle) return module.exports = false;

    var map = {
        webkitTransform: '-webkit-transform',
        OTransform: '-o-transform',
        msTransform: '-ms-transform',
        MozTransform: '-moz-transform',
        transform: 'transform'
    };

    // from: https://gist.github.com/lorenzopolidori/3794226
    var el = document.createElement('div');
    el.style[prop] = 'translate3d(1px,1px,1px)';
    document.body.insertBefore(el, null);
    var val = getComputedStyle(el).getPropertyValue(map[prop]);
    document.body.removeChild(el);
    var exports = null != val && val.length && 'none' != val;
    return exports;
}




// ============================================================================================
var controller;
window.onload = function() {
    document.body.innerHTML = `
		<div id="container"></div>
		<div class="col-xs-6 col-xs-offset-6 pull-bottom" >

			<div class="row">
				
				<div class="col-xs-offset-8 col-xs-4">
					<button id="bButton" class="btn btn-success btn-block btn-circle">B</button>
				</div>
			</div>
			<div class="row">
				<div class="col-xs-offset-4 col-xs-4">
					<button id="aButton" class="btn btn-success btn-block btn-circle">A</button>
				</div>
			</div>
			
		</div>
	`
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = `
	   
		body {
			overflow	: hidden;
			padding		: 0;
			margin		: 0;
			
		}

	   .pull-bottom{
    		position: fixed;
    		margin-bottom: 25px;
    		bottom: 0;
    	}

    	#container {
			width		: 100vh;
			height		: 100vw;
			position: fixed;
			overflow	: hidden;
			padding		: 0;
			margin		: 0;
			-webkit-user-select	: none;
			-moz-user-select	: none;
		}

		.btn-circle {
		  width: 60px;
		  height: 60px;
		  text-align: center;
		  padding: 6px 0;
		  font-size: 12px;
		  line-height: 1.42;
		  border-radius: 30px;
		}
		`;
    document.body.appendChild(css);


    console.log("touchscreen is", VirtualJoystick.touchScreenAvailable() ? "available" : "not available");

    var joystick = new VirtualJoystick({
        container: document.getElementById('container'),
        mouseSupport: true,
    });


    controller = new Controller();
    controller.data["up"] = 0;
    controller.data["down"] = 0;
    controller.data["left"] = 0;
    controller.data["right"] = 0;
    controller.data["a"] = 0;
    controller.data["b"] = 0;


    document.getElementById("aButton").addEventListener("touchend", event => touchHandle(event, 'a'), false);
    document.getElementById("aButton").addEventListener("touchstart", event => touchHandle(event, 'a'), false);
    document.getElementById("aButton").addEventListener("mouseup", event => touchHandle(event, 'a'), false);
    document.getElementById("aButton").addEventListener("mousedown", event => touchHandle(event, 'a'), false);

    document.getElementById("bButton").addEventListener("touchend", event => touchHandle(event, 'b'), false);
    document.getElementById("bButton").addEventListener("touchstart", event => touchHandle(event, 'b'), false);
    document.getElementById("bButton").addEventListener("mouseup", event => touchHandle(event, 'b'), false);
    document.getElementById("bButton").addEventListener("mousedown", event => touchHandle(event, 'b'), false);

    function touchHandle(event, button) {
        console.log(event);
        console.log(button);
        if (event.type == "touchstart" || event.type == "mousedown") {
            controller.data[button] = 1;
        } else {
            controller.data[button] = 0;
        }

        controller.sendState();
        event.preventDefault();
        return false;
    }

    function buttonEvent(button, state) {
        controller.data[button] = state;
        controller.sendState();
    }


//Handles the Joystick
    setInterval(function () {

        sendFlag = false;
        newData = {};
        newData["up"] = joystick.up() ? 1 : 0;
        newData["down"] = joystick.down() ? 1 : 0;
        newData["left"] = joystick.left() ? 1 : 0;
        newData["right"] = joystick.right() ? 1 : 0;

        if (controller.data["up"] !== newData["up"]) {
            sendFlag = true;
        } else if (controller.data["down"] !== newData["down"]) {
            sendFlag = true;
        } else if (controller.data["left"] !== newData["left"]) {
            sendFlag = true;
        } else if (controller.data["right"] !== newData["right"]) {
            sendFlag = true;
        }

        if (sendFlag) {
            newData["a"] = controller.data["a"];
            newData["b"] = controller.data["b"];
            controller.data = newData;
            controller.sendState();
        }


    }, 1 / 30 * 1000);


    controller.setup();
}