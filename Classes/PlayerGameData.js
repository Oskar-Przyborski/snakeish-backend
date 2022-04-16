import Player from './Player.js';
export default class PlayerGameData {
    /**
     * @type {Player}
    */
    player;
    name = "anonymous";
    snake = [];
    score = 0;
    color = "#5cd67f"
    direction = "right";
    targetDirection = "right";
    constructor(player, name, color) {
        this.player = player;
        this.name = name;
        this.color = color;
    }

    /**
     * Description
     * @param {String} targetDirection
     * @returns {any}
     */
    SetTargetDirection(targetDirection) {
        if (targetDirection == "left" && this.direction == "right") return;
        if (targetDirection == "right" && this.direction == "left") return;
        if (targetDirection == "up" && this.direction == "down") return;
        if (targetDirection == "down" && this.direction == "up") return;
        this.targetDirection = targetDirection;
    }
    ToJSON() {
        return {
            name: this.name,
            score: this.score,
            snake: this.snake,
            color: this.color,
        }
    }
}