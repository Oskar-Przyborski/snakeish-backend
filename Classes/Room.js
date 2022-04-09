import Player from './Player.js';
import io_rooms from '../app.js';
import DataManager from '../Utils/DataManager.js';
export default class Room {
    room_ID;
    /**
     * @type {Array<Player>}
     */
    players = [];
    apple = {
        x: 0,
        y: 0
    };
    frame_time = 500;
    grid_size = 20;
    timeout;
    afkTimeout;
    constructor(room_ID, frame_time, grid_size) {
        this.room_ID = room_ID;
        this.frame_time = frame_time;
        this.grid_size = grid_size;
        this.RespawnApple();
        this.timeout = setTimeout(() => this.UpdateGame(), this.frame_time);
    }
    get isEmpty() {
        return this.players.length === 0;
    }
    ToJSON() {
        const data = {
            room_ID: this.room_ID,
            apple: this.apple,
            players: this.GetPlayersInGameJSON(),
            frame_time: this.frame_time,
            grid_size: this.grid_size
        }
        return data;
    }
    AddPlayer(socket) {
        const player = new Player(this, socket);
        this.players.push(player);
        this.StopAfkTimeout()
        return player;
    }
    FindPlayer(socket_ID) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].socket.id === socket_ID) {
                return this.players[i];
            }
        }
        return null;
    }
    RemovePlayer(player) {
        if (player != null) {
            this.players.splice(this.players.indexOf(player), 1);
            if (this.players.length === 0) {
                this.StartAfkTimeout()
            }
        }
    }
    StartAfkTimeout() {
        this.StopAfkTimeout()
        this.afkTimeout = setTimeout(() => {
            clearTimeout(this.timeout);
            if (this.isEmpty) DataManager.Rooms.RemoveRoom(this)
        }, 1000 * 60);
    }
    StopAfkTimeout(){
        clearTimeout(this.afkTimeout);
    }
    GetPlayers() {
        return this.players;
    }
    GetPlayersInGame() {
        return this.players.filter(player => player.isPlaying);
    }
    GetPlayersNotInGame() {
        return this.players.filter(player => !player.isPlaying);
    }
    GetPlayersInGameJSON() {
        return this.GetPlayersInGame().map(player => player.ToJSON());
    }

    UpdateGame() {
        this.GetPlayersInGame().forEach(player => player.gameData.MoveSnake());
        const data = {}
        data.players = this.GetPlayersInGameJSON();
        data.apple = this.apple;
        data.GRID_SIZE = this.grid_size;
        io_rooms.to(this.room_ID).emit('game-update', data);
        this.timeout = setTimeout(() => this.UpdateGame(), this.frame_time);
    }
    RespawnApple() {
        do {
            this.apple.x = Math.floor(Math.random() * this.grid_size);
            this.apple.y = Math.floor(Math.random() * this.grid_size);
        } while (this.GetPlayersInGame().some(player => player.gameData.snake.some(segment => segment.x === this.apple.x && segment.y === this.apple.y)));
    }
}