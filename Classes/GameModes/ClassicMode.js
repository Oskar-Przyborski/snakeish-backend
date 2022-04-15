import Player from "../Player.js";
import GameMode from "./GameMode.js";
import Apple from "../Apple.js";
import directionToVector from '../../Utils/directionToVector.js';
import io_rooms from '../../app.js'
export default class ClassicMode extends GameMode {
    /**
     * @type {Apple[]}
     */
    apples = [];
    collideWithEnemies = false;
    updateTimeout;
    static CheckRequirements(settings) {
        if (settings.frame_time == null) return { error: true, errorMessage: "frame_time is not specified" };
        if (settings.grid_size == null) return { error: true, errorMessage: "grid_size is not specified" };
        if (settings.apples_quantity == null) return { error: true, errorMessage: "apples_quantity is not specified" };
        if (settings.collide_with_enemies == null) return { error: true, errorMessage: "collide_with_enemies is not specified" };
        return { error: false };
    }
    constructor(room, settings) {
        super(room, settings);
        this.collideWithEnemies = settings.collide_with_enemies;
        this.apples_quantity = settings.apples_quantity;
        this.InitializeGame();
    }
    InitializeGame() {
        this.apples = [];
        for (let i = 0; i < this.apples_quantity; i++) {
            const newApple = new Apple(this.room);
            this.RespawnApple(newApple);
            this.apples.push(newApple);
        }
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
    }
    GameUpdate() {
        const playersInGame = this.room.GetPlayersInGame();
        console.log(this.room.GetPlayers().length);
        //eat apples
        playersInGame.forEach(player => {
            player.gameData.direction = player.gameData.targetDirection;
            const eatingApple = this.GetPlayerEatsAppleInNextFrame(player);
            if (eatingApple) {
                eatingApple.isEaten = true;
                player.gameData.score++;
                const snake = player.gameData.snake;
                const snakeLastElem = snake[snake.length - 1]
                snake.push({ x: snakeLastElem.x, y: snakeLastElem.y })
            }
        })
        //move 
        playersInGame.forEach(player => this.MovePlayerSnake(player));
        //check collisions
        playersInGame.forEach(player => {
            if (this.CheckPlayerWallCollision(player) ||
                this.CheckPlayerBodyCollision(player) ||
                (this.collideWithEnemies && this.CheckPlayerCollidesWithEnemy(player))) {
                player.gameData.shouldBeRespawned = true;
            }
        })
        //respawn players
        playersInGame.forEach(player => {
            if (player.gameData.shouldBeRespawned) this.RespawnPlayer(player);
        })
        //respawn apples
        this.apples.forEach(apple => {
            if (apple.isEaten) this.RespawnApple(apple);
        })
        this.BroadcastGameUpdate();
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
    }
    BroadcastGameUpdate() {
        const data = {
            players: this.room.GetPlayersInGameJSON(),
            apples: this.apples.map(apple => apple.ToJSON()),
            GRID_SIZE: this.grid_size
        }
        io_rooms.in(this.room.room_ID).emit('game-update', data);
    }
    ToJSON() {
        return {
            modeName: "classic",
            modeIdx: 0,
            apples: this.apples.map(apple => apple.ToJSON()),
            GRID_SIZE: this.grid_size,
            frame_time: this.frame_time,
            collideWithEnemies: this.collideWithEnemies,
        }
    }
    GetAvailableCells() {
        const takenCells = this.room.GetPlayersInGame().reduce((cells, player) => {
            return cells.concat(player.gameData.snake);
        }, []);
        this.apples.forEach(apple => takenCells.push({ x: apple.x, y: apple.y }));
        const availableCells = [];
        for (let x = 0; x < this.grid_size; x++) {
            for (let y = 0; y < this.grid_size; y++) {
                if (!takenCells.some(cell => cell.x === x && cell.y === y)) {
                    availableCells.push({ x, y });
                }
            }
        }
        return availableCells;
    }

    /**
     * Description
     * @param {Player} player
     * @returns {any}
     */
    OnPlayerJoin(player) {
        this.RespawnPlayer(player);
    }
    /**
     * Description
     * @param {Player} player
     * @returns {any}
     */
    RespawnPlayer(player) {
        const avaiableCells = this.GetAvailableCells();
        if (avaiableCells.length === 0) return;
        const randomCell = avaiableCells[Math.floor(Math.random() * avaiableCells.length)];
        player.gameData.snake = [{ x: randomCell.x, y: randomCell.y }];
        player.gameData.direction = "right";
        player.gameData.score = 0;
        player.gameData.shouldBeRespawned = false;
    }
    /**
     * Description
     * @param {Apple} apple
     * @returns {any}
     */
    RespawnApple(apple) {
        const avaiableCells = this.GetAvailableCells();
        if (avaiableCells.length === 0) return;
        const randomCell = avaiableCells[Math.floor(Math.random() * avaiableCells.length)];
        apple.x = randomCell.x;
        apple.y = randomCell.y;
        apple.isEaten = false;
    }
    /**
     * Moves player's snake
     * @param {Player} player
     * @returns {any}
     */
    MovePlayerSnake(player) {
        const snake = player.gameData.snake;
        const head = snake[0];
        const direction = directionToVector(player.gameData.direction);
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };
        snake.unshift(newHead);
        snake.pop();
    }
    /**
     * Returns true if player's snake collides with wall
     * @param {Player} player
     * @returns {boolean}
     */
    CheckPlayerWallCollision(player) {
        const snake = player.gameData.snake;
        const head = snake[0];
        if (head.x < 0 || head.x >= this.grid_size || head.y < 0 || head.y >= this.grid_size) {
            return true;
        }
        return false;
    }
    /**
     * Returns true if player's snake collides with his own body
     * @param {Player} player
     * @returns {boolean}
     */
    CheckPlayerBodyCollision(player) {
        const snake = player.gameData.snake;
        const head = snake[0];
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                return true;
            }
        }
        return false;
    }
    /**
     * Returns apple that player is going to eat in next move based on player's direction
     * @param {Player} player
     * @returns {Apple}
     */
    GetPlayerEatsAppleInNextFrame(player) {
        const snake = player.gameData.snake;
        const head = snake[0];
        const direction = directionToVector(player.gameData.direction);
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };
        const apple = this.apples.find(apple => apple.x === newHead.x && apple.y === newHead.y);
        return apple;
    }
    /**
     * Returns a enemy that player collide with
     * @param {Player} player
     * @returns {Player}
     */
    GetEnemyCollidingWithPlayer(player) {
        const playersInGame = this.room.GetPlayersInGame();
        const snake = player.gameData.snake;
        const head = snake[0];
        const enemies = playersInGame.filter(enemy => enemy !== player);
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const enemySnake = enemy.gameData.snake;
            for (let j = 0; j < enemySnake.length; j++) {
                if (enemySnake[j].x === head.x && enemySnake[j].y === head.y) {
                    return enemy;
                }
            }
        }
        return null;
    }
    CheckPlayerCollidesWithEnemy(player) {
        const enemy = this.GetEnemyCollidingWithPlayer(player);
        return enemy != null
    }
}
