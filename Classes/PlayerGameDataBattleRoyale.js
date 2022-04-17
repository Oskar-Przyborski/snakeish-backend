import PlayerGameData from "./PlayerGameData.js";
export default class PlayerGameDataBattleRoyale extends PlayerGameData {
    shouldBeKilled = false;
    isKilled = false
    Reset() {
        this.shouldBeKilled = false;
        this.isKilled = false;
        this.snake = [];
        this.score = 0;
    }
}