package gameserver

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

func (r Room) AddPlayer(player *Player) bool {

	if len(r.Players) < r.Game.Players { // Make sure room is not full
		r.Players[player.Uuid] = player // Add Player
		player.Room = &r // Make sure the Player room is the room
		return true
	}
	return false
}

func (r Room) RemovePlayer(player *Player) {
	delete(r.Players,player.Uuid)
	player = nil

}


func (r Room) MessageAllPlayers(message string){
	for _, v := range r.Players {
		v.MessageReceive<- message
	}
}



//TODO Create a channel to stop the server
func (r Room) StartServer(){

	for{
		select {
		case msg := <- r.ClientMessage:
			//Send each Player the message
			for k := range(r.Players){
				r.Players[k].MessageReceive <- msg
			}
		}
	}

}



// A game struct is some basic information about a game.
type Game struct{
	Id string // This is the name of the game
	Players int // This is the amount a players that game be in the game
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

