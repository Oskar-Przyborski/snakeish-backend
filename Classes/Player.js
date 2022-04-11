import PlayerGameData from "./PlayerGameData.js";
import snakeColors from "../Utils/snakeColors.js"
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
        if (colorIDX < 0 || colorIDX > 6) { callback(true, "color is out of range"); return; }
        if (this.isPlaying) { callback(true, "already playing"); return; }
        this.isPlaying = true;
        this.gameData = new PlayerGameData(this, name, snakeColors[colorIDX]);
        callback(false, null)
    }
    LeaveGame() {
        this.isPlaying = false;
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