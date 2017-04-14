package gameserver

import (
	"fmt"
	"net"
	"log"
	"github.com/gorilla/websocket"
)

const waiting = 0
const playing = 1

type Room struct {

	Players map[string]*Player // These are the Clients
	Host *Player               // This is the SS Player
	Game *Game
	State int

	ClientMessage chan string
	HostMessage chan string

}

func CreateRoom(game *Game) *Room{

	players := make(map[string]*Player)
	thisRoom := Room{Game:game,State:waiting,Players:players}
	thisRoom.HostMessage = make(chan string)
	thisRoom.ClientMessage = make(chan string)
	return &thisRoom
}

func (r *Room) AddPlayer(player *Player) bool {

	if len(r.Players) < r.Game.Players { // Make sure room is not full
		r.Players[player.Uuid] = player // Add Player
		player.Room = r // Make sure the Player room is the room
		return true
	}
	return false
}

func (r *Room) AddHost(player *Player) bool {

	r.Host = player // Add Player
	player.Room = r // Make sure the Player room is the room
	return true
}


func (r *Room) RemovePlayer(player *Player) {
	delete(r.Players,player.Uuid)
	player = nil

}


func (r *Room) MessageAllPlayers(message string){
	for _, v := range r.Players {
		v.MessageReceive<- message
	}
}



//TODO Create a channel to stop the server
func (r *Room) StartServer(){

	for{
		select {
		case msg := <- r.ClientMessage:
			//Send each Player the message
			for k := range(r.Players){
				r.Players[k].MessageReceive <- msg
			}
		case msg := <- r.HostMessage:
			r.Host.MessageReceive <- msg
		}
	}

}

func StartClient(conn *websocket.Conn, player *Player) {
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

			//player.Room.HostMessage <- player.Name+": "+string(data[:])
			player.Room.HostMessage <- string(data[:])

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


func StartHost(conn *websocket.Conn, player *Player) {
	fmt.Println("Host Websocket Connection Opened")

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

			//player.Room.ClientMessage <- player.Name+": "+string(data[:])
			player.Room.ClientMessage <- string(data[:])

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





// A game struct is some basic information about a game.
type Game struct{
	Id string // This is the short name of the game
	Players int // This is the amount a players that game be in the game
	Name string // This is the long name of the game
	Script string // This is the source of the script
}

func NewPlayer(uuid string, name string, room *Room) *Player{
	p := Player{}
	p.Room = room
	p.Name = name
	p.Uuid = uuid
	p.MessageReceive = make(chan string)
	p.MessageSend = make(chan string)
	p.Disconnect = make(chan bool)

	return &p
}


type Player struct{
	Uuid string
	Name string
	Room *Room
	IsConnected bool


	MessageSend chan string
	MessageReceive chan string
	Disconnect chan bool
}

