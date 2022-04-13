import directionToVector from '../Utils/directionToVector.js';
import Apple from './Apple.js';
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
    shouldBeRespawned = false
    constructor(player, name, color) {
        this.player = player;
        this.name = name;
        this.color = color;
        this.Respawn()
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
        if (this.CheckWallCollision() || this.CheckTailCollision()) this.shouldBeRespawned = true;
        if (this.player.room.collideWithEnemies && this.CheckOtherPlayersCollision()) this.shouldBeRespawned = true;
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
    CheckOtherPlayersCollision() {
        const head = this.snake[0];
        for (let i = 0; i < this.player.room.GetPlayersInGame().length; i++) {
            const otherPlayer = this.player.room.players[i];
            if (otherPlayer.gameData == this) continue;
            for (let j = 0; j < otherPlayer.gameData.snake.length; j++) {
                const otherPlayerSnakeCell = otherPlayer.gameData.snake[j];
                if (otherPlayerSnakeCell.x == head.x && otherPlayerSnakeCell.y == head.y) {
                    return true;
                }
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
    Respawn() {
        this.score = 0;
        this.direction = "right";
        this.targetDirection = "right";
        const availablePositions = this.player.room.GetAvailableCellsOnGrid();
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            const randomPosition = availablePositions[randomIndex];
            this.snake = [{ x: randomPosition.x, y: randomPosition.y }];
            this.shouldBeRespawned = false;
        }
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