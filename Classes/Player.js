import PlayerGameData from "./PlayerGameData.js";
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
    JoinGame(name) {
        this.isPlaying = true;
        this.gameData = new PlayerGameData(this, name);
    }
    LeaveGame(){
        this.isPlaying = false;
        this.gameData = null;
    }
    ToJSON() {
        return {
            isPlaying: this.isPlaying,
            gameData: this.gameData == null ? null : this.gameData.ToJSON()
        }
    }
}