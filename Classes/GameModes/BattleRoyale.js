import io_rooms from "../../app.js";
import directionToVector from "../../Utils/directionToVector.js";
import Apple from "../Apple.js";
import Player from "../Player.js";
import PlayerGameDataBattleRoyale from "../PlayerGameDataBattleRoyale.js";
import GameMode from "./GameMode.js";

export default class BattleRoyale extends GameMode {
    /**
    * @type {Apple[]}
    */
    apples = [];
    min_players = 2;
    game_status = {
        started: false,
        ended: false,
        /**
         * @type {Player}
         */
        winner: null
    }
    waitingForPlayersCountdown = -1;
    waitingForPlayersTimeout = null;
    restartCountdown = -1;
    startFreezeCountdown = -1;
    spawnAppleCountdown = -1;
    updateTimeout;
    mapShrinkSize = 0;
    mapShrinkCountdown = -1;
    static CheckRequirements(settings) {
        if (settings.min_players == null) return { error: true, errorMessage: "min_players is not specified" };
        return { error: false };
    }
    CreatePlayerData(player, name, color) {
        return new PlayerGameDataBattleRoyale(player, name, color);
    }
    constructor(room, settings) {
        settings.frame_time = 250
        settings.grid_size = 20
        super(room, settings);
        this.min_players = settings.min_players;
        clearTimeout(this.updateTimeout)
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
    }
    StartWaitingForPlayersCountdown() {
        this.StopWaitingForPlayersCountdown()
        this.waitingForPlayersCountdown = 10;
        this.waitingForPlayersTimeout = setInterval(() => {
            this.waitingForPlayersCountdown--;
            if (this.waitingForPlayersCountdown < 0) {
                clearInterval(this.waitingForPlayersTimeout);
                this.StartGame();
            }
        }, 1000);
    }
    StopWaitingForPlayersCountdown() {
        clearInterval(this.waitingForPlayersTimeout);
        this.waitingForPlayersCountdown = -1;
    }
    StartRestartCountdown() {
        this.restartCountdown = 5;
        const interval = setInterval(() => {
            this.restartCountdown--;
            if (this.restartCountdown < 0) {
                this.RestartGame();
                clearInterval(interval);
            }
        }, 1000);
    }
    RestartGame() {
        this.game_status.started = false;
        this.game_status.ended = false;
        this.game_status.winner = null;
        this.mapShrinkSize = 0
        this.apples = [];
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
        this.room.GetPlayersInGame().forEach(player => {
            player.gameData.isKilled = false;
            player.gameData.snake = [];
            player.gameData.score = 0;
        });
        if (this.room.GetPlayersInGame().length >= this.min_players) {
            this.StartWaitingForPlayersCountdown();
        }
    }
    StartGame() {
        this.game_status.started = true;
        this.SpawnPlayers();
        this.startFreezeCountdown = 10;
        for (let i = 0; i < this.min_players * 2; i++) {
            this.SpawnNewApple();
        }
        this.spawnAppleCountdown = 10;
        this.shrinkMapCountdown = 15;
    }
    GameUpdate() {
        if (this.game_status.started && !this.game_status.ended) {
            if (this.startFreezeCountdown >= 0)
                this.startFreezeCountdown--;
            else {
                this.ElapseAppleCountdown();
                this.ElapseMapShrinkCountdown();
                this.GetAlivePlayers().forEach(player => {
                    player.gameData.direction = player.gameData.targetDirection;
                    this.EatAppleInNextMove(player)
                });
                this.GetAlivePlayers().forEach(player => this.MovePlayer(player))
                this.GetAlivePlayers().forEach(player => {
                    if (this.CheckPlayerBodyCollision(player) || this.CheckPlayerOutsideMap(player)) this.KillPlayer(player);
                    else this.KillPlayerIfCollidingWithEnemy(player);
                })
            }
        }
        this.BroadcastGameUpdate();
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
    }
    BroadcastGameUpdate() {
        const data = {}
        data.game_status = this.game_status;
        data.min_players = this.min_players;
        if (!this.game_status.started) {
            data.waiting_players = this.room.GetPlayersInGame().length;
            data.countdown = this.waitingForPlayersCountdown;
            data.players = this.room.GetPlayersInGameJSON();
        }
        else if (this.game_status.started && !this.game_status.ended) {
            data.apples = this.apples.map(apple => apple.ToJSON());
            data.players = this.room.GetPlayersInGameJSON()
            data.grid_size = this.grid_size;
            data.shrink_size = this.mapShrinkSize;
        } else if (this.game_status.ended) {
            if (this.game_status.winner) data.winner = this.game_status.winner.gameData.name
            else data.winner = "No one"
            data.restart_countdown = this.restartCountdown;
            data.players = this.room.GetPlayersInGameJSON();
        }
        io_rooms.to(this.room.room_ID).emit("game-update", data);
    }
    ToJSON() {
        return {
            gameStatus: this.game_status,
            modeName: "battle-royale",
            modeIdx: 1,
            apples: this.apples.map(apple => apple.ToJSON()),
            GRID_SIZE: this.grid_size,
            frame_time: this.frame_time
        }
    }
    OnPlayerJoin(player) {
        if (!this.game_status.started) {
            if (this.room.GetPlayersInGame().length >= this.min_players) {
                this.StartWaitingForPlayersCountdown();
            }
        }
        else {
            player.gameData.isKilled = true;
            player.gameData.snake = [];
            player.gameData.score = 0;
        }
    }
    OnPlayerLeave(player) {
        if (this.game_status.started) {
            this.KillPlayer(player);
        } else if (!this.game_status.ended) {
            if (this.room.GetPlayersInGame().length < this.min_players) {
                this.StopWaitingForPlayersCountdown();
            }
        }
    }
    GetAvailableCells(boundaries = 0) {
        const takenCells = this.room.GetPlayersInGame().reduce((cells, player) => {
            return cells.concat(player.gameData.snake);
        }, []);
        this.apples.forEach(apple => takenCells.push({ x: apple.x, y: apple.y }));
        const availableCells = [];
        for (let x = this.mapShrinkSize + boundaries; x < this.grid_size - this.mapShrinkSize - boundaries; x++) {
            for (let y = this.mapShrinkSize + boundaries; y < this.grid_size - this.mapShrinkSize - boundaries; y++) {
                if (!takenCells.some(cell => cell.x === x && cell.y === y)) {
                    availableCells.push({ x, y });
                }
            }
        }
        return availableCells;
    }

    SpawnPlayers() {
        const players = this.room.GetPlayersInGame();
        players.forEach(player => {
            const availableCells = this.GetAvailableCells(3);
            const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
            player.gameData.snake = [{ x: randomCell.x, y: randomCell.y }];
            player.gameData.direction = "right";
            player.gameData.targetDirection = "right";
            player.gameData.score = 0;
            player.gameData.shouldBeRespawned = false;
            player.gameData.isKilled = false;
        });
    }
    /**
     * Kills player
     * @param {Player} player 
     */
    KillPlayer(player) {
        if (player.gameData) {
            player.gameData.isKilled = true;
            player.gameData.snake = [];
            player.gameData.score = 0;
        }
        this.CheckWinner();
    }
    CheckWinner() {
        if (this.GetAlivePlayers().length <= 1) {
            this.game_status.ended = true;
            if (this.GetAlivePlayers().length === 1)
                this.game_status.winner = this.GetAlivePlayers()[0].ToJSON();
            else
                this.game_status.winner = null;
            this.StartRestartCountdown();
            clearTimeout(this.waitingForPlayersTimeout);
        }
    }
    /**
     * Moves player
     * @param {Player} player
     * @returns {any}
     */
    MovePlayer(player) {
        const snake = player.gameData.snake;
        if (snake.length === 0) return;
        const head = snake[0];
        const direction = directionToVector(player.gameData.direction);
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };
        snake.unshift(newHead);
        snake.pop();
    }
    /**
     * Checks if player collides with his body
     * @param {Player} player
     * @returns {boolean}
     */
    CheckPlayerBodyCollision(player) {
        const snake = player.gameData.snake;
        if (snake.length === 0) return false;
        const head = snake[0];
        return snake.some(cell => cell.x === head.x && cell.y === head.y && cell !== head);
    }
    CheckPlayerOutsideMap(player) {
        const snake = player.gameData.snake;
        if (snake.length === 0) return false;
        const head = snake[0];
        return head.x < this.mapShrinkSize || head.x >= this.grid_size - this.mapShrinkSize || head.y < this.mapShrinkSize || head.y >= this.grid_size - this.mapShrinkSize;
    }
    KillPlayerIfCollidingWithEnemy(player) {
        const playersInGame = this.GetAlivePlayers();
        const snake = player.gameData.snake;
        const head = snake[0];
        const enemies = playersInGame.filter(enemy => enemy !== player);
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const enemySnake = enemy.gameData.snake;
            for (let j = 0; j < enemySnake.length; j++) {
                if (enemySnake[j].x === head.x && enemySnake[j].y === head.y) {
                    if (j === 0) this.KillPlayer(enemy);
                    else this.KillPlayer(player);
                    return;
                }
            }
        }
    }
    GetAlivePlayers() {
        return this.room.GetPlayersInGame().filter(player => !player.gameData.isKilled);
    }
    /**
     * Player eats apple if he collides with it
     * @param {Player} player
     * @returns {Apple}
     */
    EatAppleInNextMove(player) {
        const snake = player.gameData.snake;
        if (snake.length === 0) return;
        const head = snake[0];
        const direction = directionToVector(player.gameData.direction);
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };
        const eatenApple = this.apples.find(apple => apple.x === newHead.x && apple.y === newHead.y);
        if (eatenApple) {
            player.gameData.score += eatenApple.score;
            const lastElem = snake[snake.length - 1];
            for (let i = 0; i < eatenApple.value; i++) {
                snake.push(lastElem);
            }
            this.apples = this.apples.filter(apple => apple !== eatenApple);
        }
    }
    ElapseAppleCountdown() {
        if (this.spawnAppleCountdown >= 0)
            this.spawnAppleCountdown--;
        else {
            this.SpawnNewApple();
            this.spawnAppleCountdown = 5;
        }
    }
    SpawnNewApple(value = 1) {
        const availableCells = this.GetAvailableCells();
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        const apple = new Apple(this.room, randomCell.x, randomCell.y, value);
        this.apples.push(apple);
    }
    ShrinkMap() {
        this.mapShrinkSize++;
        const players = this.room.GetPlayersInGame();
        players.forEach(player => {
            let snake = player.gameData.snake;
            if (snake.length === 0) return;
            for (let i = 0; i < snake.length; i++) {
                const currElement = snake[i];
                if (currElement.x < this.mapShrinkSize || currElement.x >= this.grid_size - this.mapShrinkSize || currElement.y < this.mapShrinkSize || currElement.y >= this.grid_size - this.mapShrinkSize) {
                    if (i === 0)
                        this.KillPlayer(player);
                    else {
                        player.gameData.snake = snake.slice(0, i);
                    }
                    break;
                }
            }
        })
        this.apples.forEach(apple => {
            if (apple.x < this.mapShrinkSize || apple.x >= this.grid_size - this.mapShrinkSize || apple.y < this.mapShrinkSize || apple.y >= this.grid_size - this.mapShrinkSize) {
                this.apples = this.apples.filter(applefltr => apple !== applefltr);
            }
        })
    }
    ElapseMapShrinkCountdown() {
        if (this.shrinkMapCountdown >= 0)
            this.shrinkMapCountdown--;
        else {
            this.ShrinkMap();
            this.shrinkMapCountdown = 15;
        }
    }
}