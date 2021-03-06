import PlayerGameData from "./PlayerGameData.js";
import snakeColors from "../Utils/snakeColors.js"
import Room from "./Room.js";
export default class Player {
    /**
     * @type {Room}
     */
    room;
    socket;
    isPlaying = false;
    /**
     * @type {PlayerGameData}
     */
    gameData = null;
    constructor(room, socket) {
        this.room = room;
        this.socket = socket;
    }
    /**
     * Description
     * @param {String} name
     * @returns {any}
    */
    JoinGame(name, colorIDX, callback) {
        if (name == null) { callback(true, "name not specified"); return; }
        if (name == "") { callback(true, "name is empty"); return; }
        if (name.length > 10) { callback(true, "name should be shorter than 11 characters"); return; }
        if (this.room.IsNameAlreadyTaken(name)) { callback(true, "name is already taken"); return; }
        if (colorIDX == null) { callback(true, "color not specified"); return; }
        if (colorIDX < 0 || colorIDX > 11) { callback(true, "color is out of range"); return; }
        if (this.isPlaying) { callback(true, "already playing"); return; }
        if (!this.room.gameMode.CanJoinGame(this)) { callback(true, "cannot join game"); return; }
        this.gameData = this.room.gameMode.CreatePlayerData(this, name, snakeColors[colorIDX]);
        this.isPlaying = true;
        this.room.gameMode.OnPlayerJoin(this);
        callback(false, null)
    }
    LeaveGame() {
        this.isPlaying = false;
        this.room.gameMode.OnPlayerLeave(this);
        this.gameData = null;
    }
    ToJSON() {
        return {
            isPlaying: this.isPlaying,
            gameData: this.gameData == null ? null : this.gameData.ToJSON(),
            socketID: this.socket.id
        }
    }
}