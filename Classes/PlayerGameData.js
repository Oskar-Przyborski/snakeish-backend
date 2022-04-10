import directionToVector from '../Utils/directionToVector.js';
export default class PlayerGameData {
    /**
     * @type {Player}
    */
    player;
    name = "anonymous";
    snake = [{ x: 0, y: 0 }];
    score = 0;
    direction = "right";
    targetDirection = "right";
    constructor(player, name) {
        this.player = player;
        this.name = name;
        this.Reset()
    }
    EatApple() {
        this.score++;
        this.snake.push({
            x: this.snake[this.snake.length - 1].x,
            y: this.snake[this.snake.length - 1].y
        });
        this.player.room.RespawnApple();
    }
    MoveSnake() {
        this.direction = this.targetDirection;
        if (this.CheckNextMoveApplePosition()) this.EatApple();
        const head = this.snake[0];
        const newHead = {
            x: head.x + directionToVector(this.direction).x,
            y: head.y + directionToVector(this.direction).y
        };
        this.snake.unshift(newHead);
        this.snake.pop();
        if (this.CheckWallCollision() || this.CheckTailCollision()) { this.Reset(); return }
    }
    CheckNextMoveApplePosition() {
        const head = this.snake[0];
        if (head.x + directionToVector(this.direction).x === this.player.room.apple.x && head.y + directionToVector(this.direction).y === this.player.room.apple.y) {
            return true
        }
        return false
    }
    CheckTailCollision() {
        const head = this.snake[0];
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        return false;
    }
    CheckWallCollision() {
        const head = this.snake[0];
        if (head.x < 0 || head.x >= this.player.room.grid_size || head.y < 0 || head.y >= this.player.room.grid_size) {
            return true
        }
        return false
    }
    Reset() {
        const x = Math.floor(Math.random() * this.player.room.grid_size);
        const y = Math.floor(Math.random() * this.player.room.grid_size);
        this.snake = [{ x, y }];
        this.score = 0;
        this.direction = "right";
        this.targetDirection = "right";
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
        }
    }
}