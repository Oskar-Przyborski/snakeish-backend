import directionToVector from '../Utils/directionToVector.js';
import Apple from './Apple.js';
import Player from './Player.js';
export default class PlayerGameData {
    /**
     * @type {Player}
    */
    player;
    name = "anonymous";
    snake = [{ x: 0, y: 0 }];
    score = 0;
    color = "#5cd67f"
    direction = "right";
    targetDirection = "right";
    constructor(player, name, color) {
        this.player = player;
        this.name = name;
        this.color = color;
        this.Reset()
    }
    /**
     * Description
     * @param {Apple} apple
     * @returns {any}
     */
    EatApple(apple) {
        if (apple == null) return;
        this.score++;
        apple.shouldBeRespawned = true;
        this.snake.push({
            x: this.snake[this.snake.length - 1].x,
            y: this.snake[this.snake.length - 1].y
        });
    }
    MoveSnake() {
        this.direction = this.targetDirection;
        this.EatApple(this.CheckNextMoveApple());
        const head = this.snake[0];
        const newHead = {
            x: head.x + directionToVector(this.direction).x,
            y: head.y + directionToVector(this.direction).y
        };
        this.snake.unshift(newHead);
        this.snake.pop();
        if (this.CheckWallCollision() || this.CheckTailCollision()) { this.Reset(); return }
    }
    CheckNextMoveApple() {
        const head = this.snake[0];
        const nextHeadMove = {
            x: head.x + directionToVector(this.direction).x,
            y: head.y + directionToVector(this.direction).y
        };
        for (let i = 0; i < this.player.room.apples.length; i++) {
            const apple = this.player.room.apples[i];
            if (apple.x === nextHeadMove.x && apple.y === nextHeadMove.y) {
                return apple;
            }
        }
        return null;
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
            color: this.color,
        }
    }
}