
function rollNRockRacing() {


    //What Resolution the game renders at
    var width = '1600';
    var height = '900';

    //Create a new instance of a game object
	var game = new Game(1,2);
	var canvasStyle = `
	    position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    `;

	var canv = game.addCanvas("game-canvas",width,height, canvasStyle);
	var canvObject = game.canvs["game-canvas"];
    var canv = document.getElementById('game-canvas'); // This will be removed when connor changes API
    var ctx = canv.getContext('2d'); // Set the Canvas into Canvas mode

    generateBackground(); // These are the instructions to generate the background

    this.players = [];
    var players = this.players;

    /*
    players['player1'] = new Player(120,500,"red");
    players['player2'] = new Player(140,500,"blue");
    players['player3'] = new Player(160,500,"grey");
    players['player4'] = new Player(180,500,"yellow");
    */
    //
    // for(var i = 0; i<game.playerIDs.length;i++){
    //     console.log("Adding Player")
    //     players[game.playerIDs[i]] = new Player(120,500,"red");
    //     canvObject.addDynamicObject(players[game.playerIDs[i]].id,players['player1'].draw,null,players['player1'].update)
    //
    // }
    //
    // console.log("Done Adding Player")

    // canvObject.addDynamicObject(players['player1'].id,players['player1'].draw,null,players['player1'].update)
    // canvObject.addDynamicObject(players['player2'].id,players['player2'].draw,null,players['player2'].update)
    // canvObject.addDynamicObject(players['player3'].id,players['player3'].draw,null,players['player3'].update)
    // canvObject.addDynamicObject(players['player4'].id,players['player4'].draw,null,players['player4'].update)

    game.controlHandler = (uuid , data)=> {
        console.log("Received Input:");
        console.log(data);
        this.players[game.playerIDs[i]].input = data;
    }



    game.startLobby(()=> {
        var players = this.players;

        /*
         players['player1'] = new Player(120,500,"red");
         players['player2'] = new Player(140,500,"blue");
         players['player3'] = new Player(160,500,"grey");
         players['player4'] = new Player(180,500,"yellow");
         */

        for(var i = 0; i<game.playerIDs.length;i++){
            console.log("Adding Player")
            players[game.playerIDs[i]] = new Player(120,500,getRandomColor());
            canvObject.addDynamicObject(players[game.playerIDs[i]].id,players[game.playerIDs[i]].draw,null,players[game.playerIDs[i]].update)

        }

        console.log("Done Adding Player")

        // canvObject.addDynamicObject(players['player1'].id,players['player1'].draw,null,players['player1'].update)
        // canvObject.addDynamicObject(players['player2'].id,players['player2'].draw,null,players['player2'].update)
        // canvObject.addDynamicObject(players['player3'].id,players['player3'].draw,null,players['player3'].update)
        // canvObject.addDynamicObject(players['player4'].id,players['player4'].draw,null,players['player4'].update)

        game.controlHandler = (uuid , data)=> {
            console.log("Received Input:");
            console.log(data);
            this.players[uuid].input = data;
        }
        game.startGame()
    });



    resizeCanvas(); // Resize Canvas to the user screen
    document.body.onresize = ()=> resizeCanvas(); // Resize Canvas anytime the user's screen changes size







    // var RoomJoinHTML =  document.createElement("h4");
    // RoomJoinHTML.innerText= "Room Join Code: "+getParameterByName("r"); // Dont use Inner HTML, XSS
    // game.addHTMLObject(RoomJoinHTML);



    function generateBackground() {


        //Clear with BLACK for roads
        ctx.beginPath();
        ctx.rect(0, 0, 1600, 900);
        ctx.fillStyle = 'black';
        ctx.fill();


        //Left Grass
        ctx.beginPath();
        ctx.rect(0,0, 100, 900);
        ctx.fillStyle = 'green';
        ctx.fill();

        //Bottom Grass
        ctx.beginPath();
        ctx.rect(0,900, 1600, -100);
        ctx.fillStyle = 'green';
        ctx.fill();

        //Right Grass
        ctx.beginPath();
        ctx.rect(1600,900, -100, -900);
        ctx.fillStyle = 'green';
        ctx.fill();

        //Top Grass
        ctx.beginPath();
        ctx.rect(0,0, 1600, 100);
        ctx.fillStyle = 'green';
        ctx.fill();

        //Left Grass Obstacle
        ctx.beginPath();
        ctx.rect(200,200, 100, 500);
        ctx.fillStyle = 'green';
        ctx.fill();

        //Bottom Grass Obstacle
        ctx.beginPath();
        ctx.rect(400,700, 800, 100);
        ctx.fillStyle = 'green';
        ctx.fill();


        //Right Grass Obstacle
        ctx.beginPath();
        ctx.rect(1300,700, 100, -500);
        ctx.fillStyle = 'green';
        ctx.fill();

        //middle  Grass Obstacle
        ctx.beginPath();
        ctx.rect(300,600, 1000, -200);
        ctx.fillStyle = 'green';
        ctx.fill();

        //Bottom Grass Obstacle
        ctx.beginPath();
        ctx.rect(400,100, 800, 200);
        ctx.fillStyle = 'green';
        ctx.fill();

        //Finish Line
        ctx.beginPath();
        ctx.rect(100,500, 100, 10);
        ctx.fillStyle = 'white';
        ctx.fill();

        canvObject.setBaseState();


    }

    function Player(x,y,color) {
        this.pos_x = x;
        this.pos_y = y;
        this.size_x = 20;
        this.size_y = 10;

        this.color = color;

        this.velo_x=0;
        this.velo_y=0;
        this.velo_both = 0;

        this.rotation = Math.PI/2;

        this.friction=0;

        this.id = "game-canvas";
        //this.params = params; //params should be a list of ids that correspond to the game's parameter id list
        this.canv = canv;

        this.input = {};



        //Instructions to draw the player
        this.draw = ()=>{
            ctx.save();



            ctx.translate(this.pos_x,this.pos_y)
            ctx.rotate(this.rotation);
            //ctx.translate((this.pos_x + (this.size_x/2)),(this.pos_y + (this.size_y/2)))

            ctx.beginPath();
            ctx.rect(-this.size_x/2, -this.size_y/2, this.size_x, this.size_y);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        };

        //Function to update position/parameters of object
        //Note: This function is called every frame
        this.update = ()=>{

            if(this.input.left === 1){
                this.rotation =  this.rotation - 0.13;
            }
            if(this.input.right === 1){
                this.rotation =  this.rotation + 0.13;
            }

            if(this.input.a === 1){
                //this.velo_x = this.velo_x + Math.cos(this.rotation);
                //this.velo_y = this.velo_y + Math.sin(this.rotation);
                this.velo_both = this.velo_both + 0.5;
            }

            if(this.input.b === 1){
                // this.pos_x = this.pos_x - Math.cos(this.rotation);
                // this.pos_y = this.pos_y - Math.sin(this.rotation);
                this.velo_both = this.velo_both - 0.5;
            }

            this.pos_x = this.velo_both*(Math.cos(this.rotation)) + this.pos_x
            this.pos_y = this.velo_both*(Math.sin(this.rotation)) + this.pos_y


            if(this.velo_both > 0){
                this.velo_both = this.velo_both - 0.2;
            }
            if(this.velo_both > 10){
                this.velo_both = 10;
            }
            if(this.velo_both < 0){
                this.velo_both = 0
            }










        };




        this.expired = false; //set expired to true when object is ready to be deleted




    }



    //This function resizes the canvas and maintains the aspect ratio (Hard Coded 16:9)
    function resizeCanvas() {
        var w = window.innerWidth;
        var h = window.innerHeight;

        if(w*0.5625>h){
            canv.style.height = h
            canv.style.width = h*1.77777778
        }else{
            canv.style.height = w*0.5625;
            canv.style.width = w
        }
    }



};


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


window.onload = function(){
    document.body.style.margin = 0;
    document.body.style.overflow = 'hidden';

    var game = new rollNRockRacing();



/*
	//Control Handler
    let controller = {'a': 0,
        "b" : 0,
        "up": 0,
        "down": 0,
        "left": 0,k,
        "right": 0};

    game.players['player1'].input = controller;

    window.onkeydown = e=>{
        switch (e.keyCode){
            case 38:
                controller.up = 1;
                break;
            case 40:
                controller.down = 1;
                break;
            case 39:
                controller.right = 1;
                break;
            case 37:
                 controller.left = 1;
                 break;
            case 90:
                controller.a = 1;
                break;
            case 88:
                controller.b = 1;
                break;
        }

    }

    window.onkeyup = e=>{
        switch (e.keyCode){
            case 38:
                controller.up = 0;
                break;
            case 40:
                controller.down = 0;
                break;
            case 39:
                controller.right = 0;
                break;
            case 37:
                controller.left = 0;
                break;
            case 90:
                controller.a = 0;
                break;
            case 88:
                controller.b = 0;
                break;
        }
        //Send Controller to Game

    }
*/
}



