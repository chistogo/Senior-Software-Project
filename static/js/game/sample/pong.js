function ballDraw(){
    this.canv.ctx.beginPath();
    var x = this.canv.game.params[this.id+"_xPos"];
    var y = this.canv.game.params[this.id+"_yPos"];
    this.canv.ctx.arc(x, y, this.canv.game.params.ballRadius, 0, Math.PI*2, false);
    this.canv.ctx.fillStyle = "#000";
    this.canv.ctx.fill();
    this.canv.ctx.strokeStyle = "#000";
    this.canv.ctx.stroke();
    this.canv.ctx.closePath();
}

function ballUpdate(){
    var startX = this.canv.game.params[this.id+"_xPos"];
    var startY = this.canv.game.params[this.id+"_yPos"];
    var angle = this.canv.game.params[this.id+"_rayAngle"];
    var newX = startX + Math.cos(angle)*this.canv.game.params.ballVelocity;
    var newY = startY + Math.sin(angle)*this.canv.game.params.ballVelocity;
    //check for collisions/out of bounds/etc.
    if(newX < 5 || newX > (this.canv.htmlCanv.width - 5)){
        //someone scored
        if(newX < 5){
            console.log("Player 2 scores!");
        } else {
            console.log("Player 1 scores!");
        }
        newX = this.canv.htmlCanv.width/2;
        newY = this.canv.htmlCanv.height/2;
        this.canv.game.params[this.id+"_rayAngle"] = Math.random() * (2*Math.PI);
    } else if(newX < 15 || newX > (this.canv.htmlCanv.width - 15)){
        if(newX < 10){
            //check for collision with p1 paddle
            if(Math.abs(newY - this.canv.game.params["p1_yPos"]) < this.canv.game.params.paddleHeight/2){
                //reflect off paddle
                if(angle > Math.PI){
                    this.canv.game.params[this.id+"_rayAngle"] = (Math.PI - angle) + (2*Math.PI);
                } else {
                    this.canv.game.params[this.id+"_rayAngle"] = Math.PI - angle;
                }
            }
        } else {
            //check for collision with p2 paddle
            if(Math.abs(newY - this.canv.game.params["p2_yPos"]) < this.canv.game.params.paddleHeight/2){
                //reflect off paddle
                if(angle > Math.PI){
                    this.canv.game.params[this.id+"_rayAngle"] = (Math.PI - angle) + (2*Math.PI);
                } else {
                    this.canv.game.params[this.id+"_rayAngle"] = Math.PI - angle;
                }
            }
        }
    } else {
        if(newY < 5 || newY > (this.canv.htmlCanv.height - 10)){
            //reflect off horizontal ceiling/floor
            this.canv.game.params[this.id+"_rayAngle"] = (2*Math.PI) - angle;
        }
    }
    this.canv.game.params[this.id+"_xPos"] = newX;
    this.canv.game.params[this.id+"_yPos"] = newY;
}

function paddleDraw(){
    this.canv.ctx.beginPath();
    var x = this.canv.game.params[this.id+"_xPos"];
    var y = this.canv.game.params[this.id+"_yPos"];
    this.canv.ctx.rect(x-this.canv.game.params.paddleWidth/2, y-this.canv.game.params.paddleHeight/2,
        this.canv.game.params.paddleWidth, this.canv.game.params.paddleHeight);
    this.canv.ctx.fillStyle = "#000";
    this.canv.ctx.fill();
    this.canv.ctx.stroke();
    this.canv.ctx.closePath();

}

function paddleUpdate(){
    var startY = this.canv.game.params[this.id+"_yPos"];
    var newY = this.canv.game.params[this.id+"_vel"]*this.canv.game.params.paddleVelocity;
    if(newY < this.canv.game.params.paddleHeight/2 || newY > (this.canv.htmlCanv.height - this.canv.game.params.paddleHeight/2)){
        newY = startY;
    }
    this.canv.game.params[this.id+"_yPos"] = newY;
}

function setupGame(){
    //Create game and add a canvas
    var pongGame = new Game(2,2);
    pongGame.addCanvas("defCanv", 600, 600, "border: 1px solid black");
    pongGame.canvs["defCanv"].setBaseState();
    //add some parameters that we need for our game
    pongGame.addParam("paddleWidth", 5);
    pongGame.addParam("paddleHeight", 20);
    pongGame.addParam("ballRadius", 5);
    pongGame.addParam("ballVelocity", 4);
    pongGame.addParam("paddleVelocity", 3);

    //add two paddles and a ball
    var paddle1Params = {
        "p1_xPos" : 10,
        "p1_yPos" : 300,
        "p1_vel" : 0
    }
    pongGame.canvs["defCanv"].addDynamicObject("p1", paddleDraw, paddle1Params, paddleUpdate);
    var paddle2Params = {
        "p2_xPos" : 590,
        "p2_yPos" : 300,
        "p2_vel" : 0
    }
    pongGame.canvs["defCanv"].addDynamicObject("p2", paddleDraw, paddle2Params, paddleUpdate);
    var startingAngle = Math.random()*(2*Math.PI);
    var ballParams = {
        "b_xPos" : 300,
        "b_yPos" : 300,
        "b_rayAngle" : startingAngle
    }
    pongGame.canvs["defCanv"].addDynamicObject("b", ballDraw, ballParams, ballUpdate);

    //Create our control handler
    pongGame.setControlHandler(function(controls){
        // the shape for this game's controls will be [x, y] where x = player 1's control, y = player 2's control
        this.params["p1_vel"] = controls[0];
        this.params["p2_vel"] = controls[1];
    });


    pongGame.startGame();
}

window.onload = function(){
    setupGame();
}