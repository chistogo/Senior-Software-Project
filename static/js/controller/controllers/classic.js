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


function setupController(){
	var controller = new Controller();
	controller.data["up"] = 0;
	controller.data["down"] = 0;
	controller.data["left"] = 0;
	controller.data["right"] = 0;
	controller.data["a"] = 0;
	controller.data["b"] = 0;

	
}

window.onload = function(){
    setupController();
}