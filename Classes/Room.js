import Player from './Player.js';
import io_rooms from '../app.js';
import DataManager from '../Utils/DataManager.js';
import Apple from './Apple.js';
export default class Room {
    room_ID;
    /**
     * @type {Array<Player>}
     */
    players = [];
    /** 
     * @type {Array<Apple>}
     */
    apples = [];
    frame_time = 500;
    grid_size = 20;
    timeout;
    afkTimeout;
    /**
     * Description
     * @param {string} room_ID
     * @param {number} frame_time
     * @param {number} grid_size
     * @param {number} apples_quantity
     */
    constructor(room_ID, frame_time, grid_size, apples_quantity) {
        this.room_ID = room_ID;
        this.frame_time = frame_time;
        this.grid_size = grid_size;
        for (let i = 0; i < apples_quantity; i++) {
            this.apples.push(new Apple(this));
        }
        this.timeout = setTimeout(() => this.UpdateGame(), this.frame_time);
    }
    get isEmpty() {
        return this.players.length === 0;
    }
    ToJSON() {
        const data = {
            room_ID: this.room_ID,
            apples: this.apples.map(apple => apple.ToJSON()),
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
    StopAfkTimeout() {
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
        this.RespawnApples();
        const data = {}
        data.players = this.GetPlayersInGameJSON();
        data.apples = this.apples.map(apple => apple.ToJSON());
        data.GRID_SIZE = this.grid_size;
        io_rooms.to(this.room_ID).emit('game-update', data);
        this.timeout = setTimeout(() => this.UpdateGame(), this.frame_time);
    }
    IsNameAlreadyTaken(name) {
        return this.GetPlayersInGame().some(player => player.gameData.name === name);
    }
    GetAvailableCellsOnGrid() {
        const takenCells = this.GetPlayersInGame().reduce((cells, player) => {
            return cells.concat(player.gameData.snake);
        }, []);
        this.apples.forEach(apple => takenCells.push({ x: apple.x, y: apple.y }));
        const availableCells = [];
        for (let x = 0; x < this.grid_size; x++) {
            for (let y = 0; y < this.grid_size; y++) {
                if (!takenCells.some(cell => cell.x === x && cell.y === y)) {
                    availableCells.push({ x, y });
                }
            }
        }
        return availableCells;
    }
    RespawnApples() {
        for (let i = 0; i < this.apples.length; i++) {
            const apple = this.apples[i];
            if (apple.shouldBeRespawned) {
                apple.Respawn();
            }
        }
    }
}