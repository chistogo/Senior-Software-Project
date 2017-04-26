/*
 Classic controller
 Has up-down-left-right buttons, as well as a and b
 Data packet:
 "up" : 0 or 1 (1 is pressed)
 "down" : 0 or 1
 "left" : 0 or 1
 "right" : 0 or 1
 "a" : 0 or 1
 "b" : 0 or 1
 Data packets are sent on button change
 */

var controller;

function setupController(){
    controller = new Controller();
    controller.data["up"] = 0;
    controller.data["down"] = 0;
    controller.data["left"] = 0;
    controller.data["right"] = 0;
    controller.data["a"] = 0;
    controller.data["b"] = 0;

    var css = ' \
	.circle { \
		text-align: center; \
		width: 5vh;\
		height: 5vh;\
		border-radius: 50%;\
		border-style: solid \
	}';
    controller.setCSS(css);
    var leftArrowDiv = document.createElement("i");
    leftArrowDiv.className = "fa fa-arrow-left";
    leftArrowDiv.style = "font-size: 40px;";
    leftArrowDiv.setAttribute("onmousedown", "leftClick()");
    leftArrowDiv.setAttribute("onmouseup", "leftRelease()");
    controller.addHTMLObject(leftArrowDiv);
    var rightArrowDiv = document.createElement("i");
    rightArrowDiv.style = "font-size: 40px;";
    rightArrowDiv.className = "fa fa-arrow-right";
    rightArrowDiv.setAttribute("onmousedown", "rightClick()");
    rightArrowDiv.setAttribute("onmouseup", "rightRelease()");
    controller.addHTMLObject(rightArrowDiv);
    var upArrowDiv = document.createElement("i");
    upArrowDiv.style = "font-size: 40px;";
    upArrowDiv.className = "fa fa-arrow-up";
    upArrowDiv.setAttribute("onmousedown", "upClick()");
    upArrowDiv.setAttribute("onmouseup", "upRelease()");
    controller.addHTMLObject(upArrowDiv);
    var downArrowDiv = document.createElement("i");
    downArrowDiv.style = "font-size: 40px;";
    downArrowDiv.className = "fa fa-arrow-down";
    controller.addHTMLObject(downArrowDiv);
    downArrowDiv.setAttribute("onmousedown", "downClick()");
    downArrowDiv.setAttribute("onmouseup", "downRelease()");
    var aDiv = document.createElement("div");
    aDiv.className = "circle";
    aDiv.innerHTML = "A";
    aDiv.setAttribute("onmousedown", "aClick()");
    aDiv.setAttribute("onmouseup", "aRelease()");
    controller.addHTMLObject(aDiv);
    var bDiv = document.createElement("div");
    bDiv.className = "circle";
    bDiv.innerHTML = "B";
    bDiv.setAttribute("onmousedown", "bClick()");
    bDiv.setAttribute("onmouseup", "bRelease()");
    controller.addHTMLObject(bDiv);
    controller.setup();
}

function leftClick(){
    controller.data["left"] = 1;
    controller.sendState();
}

function leftRelease(){
    controller.data["left"] = 0;
    controller.sendState();
}

function rightClick(){
    controller.data["right"] = 1;
    controller.sendState();
}

function rightRelease(){
    controller.data["right"] = 0;
    controller.sendState();
}

function upClick(){
    controller.data["up"] = 1;
    controller.sendState();
}

function upRelease(){
    controller.data["up"] = 0;
    controller.sendState();
}

function downClick(){
    controller.data["down"] = 1;
    controller.sendState();
}

function downRelease(){
    controller.data["down"] = 0;
    controller.sendState();
}

function aClick(){
    controller.data["a"] = 1;
    controller.sendState();
}

function aRelease(){
    controller.data["a"] = 0;
    controller.sendState();
}

function bClick(){
    controller.data["b"] = 1;
    controller.sendState();
}

function bRelease(){
    controller.data["b"] = 0;
    controller.sendState();
}

window.onload = function(){
    setupController();
}