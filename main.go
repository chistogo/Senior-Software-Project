package main

import (
	"fmt"
	"net/http"
	"html/template"
	"github.com/gorilla/websocket"
	"net"
	"log"
	"sswebsite/gameserver"
	"github.com/satori/go.uuid"
	"encoding/json"
)


// This is global so that the templates are only generated once
var templates map[string]*template.Template
var games map[string]*gameserver.Game
var rooms map[string]*gameserver.Room

func main(){

	fmt.Println("Welcome to the SS Experience Web Application Server")

	initTemplates() // Initializes the templates and puts them in the global variable
	initGames() // Creates and initializes the game structs
	initRooms() //TODO Modify THIS! Normally the rooms are generated when users request. This is just for debugging.
	initHandlers() // This creates the handlers for each of the URL paths

	//Start Web Server
	panic(http.ListenAndServe(":80", nil))

	// If this is ever reach then the something is wrong. One possibility is that a service
	// is already using the port
	fmt.Println("SS Application has terminated")
}

// This function initializes the template pages.
func initTemplates() {

	//Initialize the map if not already done
	if templates == nil {
		templates = make(map[string]*template.Template)
	}


	//Combines the templates into one template for the index page
	templates["index"] = template.Must(template.ParseFiles(
		"tmpl/index.html",
		"tmpl/partials/header.html",
		"tmpl/partials/info-modal.html"))

	// Web Socket Test Page
	templates["wstest"] = template.Must(template.ParseFiles(
		"tmpl/wstest.html"))

}


func initGames() {
	//Initialize the games if not already done
	if games == nil {
		games = make(map[string]*gameserver.Game)
	}

	// Create the game structs here
	games["TestGame"] = &gameserver.Game{Id: "testGame", Players:4}
	games["game1"] = &gameserver.Game{Id: "Game 1", Players:8}
	games["game2"] = &gameserver.Game{Id: "Game 2", Players:2}

}

func initRooms(){
	if rooms == nil {
		rooms = make(map[string]*gameserver.Room)
	}

	rooms["TestRoom"] = gameserver.CreateRoom(games["TestGame"])
	go rooms["TestRoom"].StartServer() // This is the thread that manages the room
}

func initHandlers(){

	// Create the static file server.
	fs := http.FileServer(http.Dir("static/"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))


	//Creating the handler for the index page
	http.HandleFunc("/", index)

	//Handler for the AJAX request for joining room
	http.HandleFunc("/join" , joinHandler);

	//Handler for Websocket
	http.HandleFunc("/ws", wsHandler)

	http.HandleFunc("/wstest", func(w http.ResponseWriter, r *http.Request) {
		templates["wstest"].Execute(w, nil)
	})
}


func index(w http.ResponseWriter, r *http.Request) {

	if r.URL.Path != "/" {
		unknownHandler(w, r, http.StatusNotFound)
		return
	}

	templates["index"].Execute(w, nil)
}


func unknownHandler(w http.ResponseWriter, r *http.Request, status int) {
	w.WriteHeader(status)
	if status == http.StatusNotFound {
		fmt.Fprint(w, "Error 404: Page not Found")
	}
}

func joinHandler(w http.ResponseWriter, r *http.Request) {

	if r.Header.Get("Origin") != "http://"+r.Host {
		http.Error(w, "Origin not allowed", 403)
		return
	}

	res := response{}

	err := r.ParseForm()
	if err != nil{
		log.Println(err)
	}

	playerName := r.PostFormValue("name") // to get params value with key
	roomID := r.PostFormValue("room")

	//Forum Validation
	if playerName == "" || roomID == ""{ //Making sure the Params were sent
		res.Status = false
		res.Message = "Invalid Parameters"
		fmt.Fprint(w, res.toJSON())
		return
	}else if rooms[roomID] == nil{ // Trying to find the room
		res.Status = false
		res.Message = "Room not Found"
		fmt.Fprint(w, res.toJSON())
		return
	}else{
		fmt.Printf("RoomID: %v and Player Name: %v \n",roomID, playerName)
	}

	// Generating UUID for Client
	id := uuid.NewV4()
	uuidString := id.String()

	//
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
		log.Println(err)
		return
	}

	fmt.Printf("UUID: %v  NAME: %v  ROOM: %v \n",jnMsg.UUID, jnMsg.Name,jnMsg.Room)

	if(rooms[jnMsg.Room] == nil){
		conn.WriteMessage(websocket.TextMessage, []byte("Error: Room Not Found"))
		return
	}

	if(rooms[jnMsg.Room].Players[jnMsg.UUID] == nil){
		conn.WriteMessage(websocket.TextMessage, []byte("Error: Player Not Found"))
		return
	}


	startClient(conn,rooms[jnMsg.Room].Players[jnMsg.UUID])

}



func startClient(conn *websocket.Conn, player *gameserver.Player) {
	fmt.Println("Websocket Connection Opened")

	// This handles the Read of the socket
	go func(){
		for {

			_ , data, err := conn.ReadMessage()
			if err != nil {
				player.Disconnect <- true
				player.Room.RemovePlayer(player)
				player = nil
				if errr, ok := err.(net.Error); ok && errr.Timeout() {

					fmt.Println("Client Disconnected")
					return
				}else{
					log.Println(err)
					return
				}
			}

			player.Room.ClientMessage <- player.Name+": "+string(data[:])

		}

	}()

	// This handles the writing of of the web socket
	go func(){
		for{
			select {
			case msg := <- player.MessageReceive:
				conn.WriteMessage(websocket.TextMessage, []byte(msg))
			case disconnect := <- player.Disconnect:
				if(disconnect){
					conn.Close()
					return
				}

			}

		}
	}()


}




func echo(conn *websocket.Conn) {
	fmt.Println("Websocket Connection Opened")
	for {

		_ , data, err := conn.ReadMessage()

		if err != nil {
			if errr, ok := err.(net.Error); ok && errr.Timeout() {

				fmt.Println("Client Disconnected")
				return
			}else{
				log.Println(err)
				break
			}
		}
		conn.WriteMessage(websocket.TextMessage,data)




	}

}



type response struct {
	Status bool `json:"status"`
	Message string `json:"message"`
}

func (r response) toJSON() string{
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