import Player from './Player.js';
import DataManager from '../Utils/DataManager.js';
import Apple from './Apple.js';
import GameMode from './GameModes/GameMode.js';
import ClassicMode from './GameModes/ClassicMode.js';
export default class Room {
    room_ID;
    /**
     * @type {Array<Player>}
     */
    players = [];
    /**
     * @type {GameMode}
     */
    gameMode = null
    /** 
     * @type {Array<Apple>}
     */
    afkTimeout;
    /**
     * Description
     * @param {string} room_ID
     * @param {number} gameModeIndex
     * @param {any} settings
     */
    constructor(room_ID, gameModeIndex, settings) {
        this.room_ID = room_ID;
        switch (gameModeIndex) {
            case 0:
            default:
                this.gameMode = new ClassicMode(this, settings);
                break;
        }
    }
    get isEmpty() {
        return this.players.length === 0;
    }
    ToJSON() {
        const data = {
            room_ID: this.room_ID,
            players: this.GetPlayersInGameJSON(),
            gameMode: this.gameMode.ToJSON()
        }
        return data;
    }
    AddPlayer(socket) {
        const player = new Player(this, socket);
        this.players.push(player);
        this.StopAfkTimeout();
        return player;
    }
    /**
     * Description
     * @param {string} socket_ID
     * @returns {Player | null}
     * */
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
    IsNameAlreadyTaken(name) {
        return this.GetPlayersInGame().some(player => player.gameData.name === name);
    }
}