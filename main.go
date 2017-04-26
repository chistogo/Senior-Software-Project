package main

import (
	"fmt"
	"net/http"
	"html/template"
	"github.com/gorilla/websocket"
	"log"
	"sswebsite/gameserver"
	"github.com/satori/go.uuid"
	"encoding/json"
	"time"
	"math/rand"
)




/*
===================
Debug Mode  Effects
===================
	> HTML Templates will be reloaded every refresh

 */
var debug bool = true
const port string = ":80"

//These are global so
var templates map[string]*template.Template // Read Only after initialization
var games map[string]*gameserver.Game //  Read Only after initialization
var rooms map[string]*gameserver.Room // TODO: Possible Race Condition,


func main(){

	fmt.Println("Welcome to the SS Experience Web Application Server")
	fmt.Println("Hosting on Port"+port)
	rand.Seed(time.Now().UnixNano()) // SEED THAT RANDOM NUMBER


	//TODO: Combine Templates and Handlers into one intitPages Function
	initTemplates() // Initializes the templates and puts them in the global variable
	initGames() // Creates and initializes the game structs
	initHandlers() // This creates the handlers for each of the URL paths

	//Start Web Server
	panic(http.ListenAndServe(port, nil))

	//If this terminates on launch, make sure port is not in use
	fmt.Println("SS Application has terminated")
}

// This function initializes the template pages from the html to the global template structure
func initTemplates() {

	//Initialize the map if not already done
	if templates == nil {
		templates = make(map[string]*template.Template)
	}

	//Combines the templates into one template for the index page
	templates["index"] = template.Must(template.ParseFiles(
		"tmpl/index.html",
		"tmpl/partials/hostmenu.html",
		"tmpl/partials/joinmenu.html",
		"tmpl/partials/gamemenu.html",
		"tmpl/partials/header.html",
		"tmpl/partials/info-modal.html"))

	// Game Page
	templates["game"] = template.Must(template.ParseFiles(
		"tmpl/game.html"))

	//Controller Page
	templates["controller"] = template.Must(template.ParseFiles(
		"tmpl/controller.html"))

}


// initGames initializes the games structs in the global game structure. The purpose is so the rest of the code has a
// record of all the games in memory.
func initGames() {
	//Initialize the games if not already done
	if games == nil {
		games = make(map[string]*gameserver.Game)
	}
	if rooms == nil {
		rooms = make(map[string]*gameserver.Room)
	}

	//TODO: Read this from file.
	games["chat"] = &gameserver.Game{Id: "chat", Players:30,Name:"Chat Room",Script:"/static/js/wstest.js"}
	games["pong"] = &gameserver.Game{Id: "pong", Players:2,Name:"Multi-Pong",Script:"/static/js/game/sample/pong.js"}
	games["shooter"] = &gameserver.Game{Id:"shoot",Players:4,Name:"Not-Pong Shooter",Script:"/static/js/game/supa-shoota/supa-shoota.js"}
	games["race"] = &gameserver.Game{Id:"race",Players:4,Name:"Roll N Rock Racer",Script:"/static/js/game/roll-n-rock-racing/game.js"}

}


// initHandlers initializes the handlers for each of our pages. This include static files and websocket handler
// initialization
func initHandlers(){

	// Create the static file server.
	fs := http.FileServer(http.Dir("static/"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	//Creating the handler for the index page
	http.HandleFunc("/", index)

	//Creating the handler for the game page
	http.HandleFunc("/game", gameHandler)

	//Creating the handler for the game page
	http.HandleFunc("/controller", controllerHandler)

	//Handler for the AJAX request for joining room
	http.HandleFunc("/join" , joinHandler)

	//Handler for the AJAX request for creating a room
	http.HandleFunc("/create" , createHandler)

	//Handler for Web Socket
	http.HandleFunc("/ws", wsHandler)


}

// This is the function that is called to handle the landing page of the web application. Since this is the URL is '/'
// functions might default to this handler if unknown thus we handle that case here too.
func index(w http.ResponseWriter, r *http.Request) {

	if debug {
		//This will update the changes to the HTML every page load
		initTemplates()
	}

	if r.URL.Path != "/" {
		unknownHandler(w, r, http.StatusNotFound)
		return
	}

	templates["index"].Execute(w, nil)
}


// This is a http handler that should handle HTTP errors. Call this function and the status to through and error.
// TODO: Possible room for improvement, Making interesting 404 pages
func unknownHandler(w http.ResponseWriter, r *http.Request, status int) {
	w.WriteHeader(status)
	if status == http.StatusNotFound {
		fmt.Fprint(w, "Error 404: Page not Found")
	}
}


// This handler for post request that is used for the AJAX Join Button. The purpose of this is joinHandler is to take
// a name and room code and if valid return the information the user need to start a websocket connection to our server
func joinHandler(w http.ResponseWriter, r *http.Request) {

	//if r.Header.Get("Origin") != "http://"+r.Host {
	//	http.Error(w, "Origin not allowed", 403)
	//	return
	//}

	// This is a response struct. It should contain the information that is returned to the client.
	res := response{}


	err := r.ParseForm()
	if err != nil{
		log.Println(err)
		res.Status = false
		res.Message = "Could not Parse Form"
		//w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, res.toJSON())
		return

	}

	playerName := r.PostFormValue("name") // to get params value with key
	roomID := r.PostFormValue("room")

	//Forum Validation
	if playerName == "" || roomID == ""{ //Making sure the Params were sent
		res.Status = false
		res.Message = "Invalid Parameters"
		//w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, res.toJSON())
		return
	}else if rooms[roomID] == nil{ // Trying to find the room
		res.Status = false
		res.Message = "Room not Found"
		//w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, res.toJSON())
		return
	}else if debug{
		fmt.Printf("RoomID: %v and Player Name: %v \n",roomID, playerName)
	}

	// Generating UUID for Client
	id := uuid.NewV4()
	uuidString := id.String()

	// Create the player Struct with given room.
	newPlayer := gameserver.NewPlayer(uuidString,playerName, rooms[roomID])


	if(rooms[roomID].AddPlayer(newPlayer)){
		res.Status = true
		res.Message = id.String()
		fmt.Fprint(w, res.toJSON())

	}else{
		res.Status = false
		res.Message = "Could not add another Player"
		fmt.Fprint(w, res.toJSON())
	}

}

func createHandler(w http.ResponseWriter, r *http.Request) {


	//if r.Header.Get("Origin") != "http://"+r.Host {
	//	http.Error(w, "Origin not allowed", 403)
	//	return
	//}

	//This will be the return message to the client
	res := response{}
	err := r.ParseForm()
	if err != nil{
		log.Println(err)
		return
	}


	//This variable is the gamename/id
	gameID := r.PostFormValue("gameID") // to get params value with key

	//Forum Validation
	if gameID == ""{ //Making sure the Params were sent
		res.Status = false
		res.Message = "Invalid Parameters"
		fmt.Fprint(w, res.toJSON())
		return
	}else if games[gameID] == nil{
		res.Status = false
		res.Message = "Invalid Game"
		fmt.Fprint(w, res.toJSON())
		return
	}else{
		fmt.Printf("GameID: %v ", gameID)
	}

	// Generating UUID for SS Host
	id := uuid.NewV4()
	uuidString := id.String()

	//Get a unique roomID
	roomID := RandomString(4)
	for rooms[roomID] != nil  {
		roomID = RandomString(4)
	}


	//Create room
	rooms[roomID] = gameserver.CreateRoom(games[gameID])
	go rooms[roomID].StartServer() // This is the thread that manages the room

	// Remember that the host is just a Special Player
	newPlayer := gameserver.NewPlayer(uuidString,"HOST", rooms[roomID])


	if(rooms[roomID].AddHost(newPlayer)){
		res.Status = true
		res.Message = "Success"
		res.GameID= gameID
		res.RoomID = roomID
		res.Uuid = id.String()
		fmt.Fprint(w, res.toJSON())

	}else{
		res.Status = false
		res.Message = "Could not add Host"
		fmt.Fprint(w, res.toJSON())
	}

}





func gameHandler(w http.ResponseWriter, r *http.Request) {

	err := r.ParseForm()
	if err != nil{
		log.Println(err)
	}

	roomID := r.FormValue("r") // to get params value with key

	if(rooms[roomID] == nil){
		fmt.Fprint(w, "Error: Room not Found")
		return
	}

	fmt.Printf("", )
	templates["game"].Execute(w, rooms[roomID].Game)

}


func controllerHandler(w http.ResponseWriter, r *http.Request) {

	err := r.ParseForm()
	if err != nil{
		log.Println(err)
	}

	roomID := r.FormValue("r") // to get params value with key

	if(rooms[roomID] == nil){
		fmt.Fprint(w, "Error: Room not Found")
		return
	}

	fmt.Printf("", )
	templates["controller"].Execute(w, rooms[roomID].Game)

}



func wsHandler(w http.ResponseWriter, r *http.Request) {


	// This will check make sure it the url is not connected with standard HTTP request
	// EX: writing the URL in to browser and requesting page.

	if r.Header.Get("Origin") != "http://"+r.Host {
		http.Error(w, "Origin not allowed", 403)
		return
	}


	// TODO: Read the parameters from URL

	//Turns the HTTP connection into a websocket connection
	conn, err := websocket.Upgrade(w, r, w.Header(), 1024, 1024)
	if err != nil {
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}


	//Read first message, which is the JSON
	_ , data, err := conn.ReadMessage()

	if(err != nil){
		log.Println(err)
		return
	}

	jnMsg := joinMessage{}
	err = json.Unmarshal(data,&jnMsg)
	if (err != nil){
		log.Println("Failed Unmarshal JSON in WSHandler")
		log.Println(err)
		return
	}

	fmt.Printf("UUID: %v  NAME: %v  ROOM: %v \n",jnMsg.UUID, jnMsg.Name,jnMsg.Room)

	if(rooms[jnMsg.Room] == nil){
		conn.WriteMessage(websocket.TextMessage, []byte("Error: Room Not Found"))
		return
	}

	if(jnMsg.UUID == rooms[jnMsg.Room].Host.Uuid){
		gameserver.StartHost(conn,rooms[jnMsg.Room].Host)
		return
	}


	if(rooms[jnMsg.Room].Players[jnMsg.UUID] == nil){
		conn.WriteMessage(websocket.TextMessage, []byte("Error: Player Not Found"))
		return
	}


	gameserver.StartClient(conn,rooms[jnMsg.Room].Players[jnMsg.UUID])

}







func RandomString(num int) string{

	legalChars := []rune("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

	rndStr := make([]rune, num)

	for i := range rndStr {
		rndStr[i] = legalChars[rand.Intn(len(legalChars))]
	}

	return string(rndStr)

}



type response struct {
	Status bool `json:"status"`
	Message string `json:"message"`
	Uuid string `json:"uuid"`
	GameID string `json:"gameid"`
	RoomID string `json:"roomid"`

}

func (r *response) toJSON() string{
	re, err := json.Marshal(r)
	if err != nil {
		log.Println(err)
		r.Status = false
		r.Message = "Error Converting to Json"
		return "Error Converting to Json"
	}
	return string(re)
}



type joinMessage struct {
	Name string `json:"name"`
	Room string `json:"room"`
	UUID string `json:"uuid"`
}

