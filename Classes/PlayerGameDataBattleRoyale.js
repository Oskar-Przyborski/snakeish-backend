import PlayerGameData from "./PlayerGameData.js";
export default class PlayerGameDataBattleRoyale extends PlayerGameData {
    shouldBeKilled = false;
    isKilled = false
    deadZoneCounter = 0;
    Reset() {
        this.shouldBeKilled = false;
        this.isKilled = false;
        this.deadZoneCounter = 0;
        this.snake = [];
        this.score = 0;
    }
}