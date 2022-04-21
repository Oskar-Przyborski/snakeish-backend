import io_rooms from "../../app.js";
import Countdown from "../../Utils/Countdown.js";
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
    gameSettings = {
        min_players: 2,
        deadZoneKills: false,
        gameSpeedUpValue: 0.1,
        gridSizePerPlayer: 8
    }
    game_status = {
        started: false,
        ended: false,
        /**
         * @type {Player}
         */
        winner: null
    }
    WaitingForPlayersCountdown = new Countdown(5, false, () => this.StartGame());
    RestartCountdown = new Countdown(5, false, () => this.RestartGame());
    FreezeCountdown = new Countdown(3, false, () => this.isFreezed = false);
    isFreezed = true;
    SpawnAppleCountdown = new Countdown(4, false, () => this.SpawnNewApple());
    updateTimeout;
    mapShrinkSize = 0;
    gameSpeedRate = 1;
    MapShrinkCountdown = new Countdown(10, false, () => this.ShrinkMap())
    GoldAppleCountdown = new Countdown(10, false, () => this.SpawnGoldApple());
    KillShortestCountdown = new Countdown(5, false, () => this.KillShortestSnake());
    static CheckRequirements(settings) {
        if (settings.min_players == null) return { error: true, errorMessage: "min_players is not specified" };
        if (isNaN(settings.min_players)) return { error: true, errorMessage: "min_players is not a number" };
        if (parseInt(settings.min_players) < 2 || parseInt(settings.min_players) > 16) return { error: true, errorMessage: "min_players must be between 2 and 16" };
        if (settings.dead_zone_kills == null) return { error: true, errorMessage: "dead_zone_kills is not specified" };
        if (settings.game_speed_up_value == null) return { error: true, errorMessage: "game_speed_up_value is not specified" };
        if (isNaN(settings.game_speed_up_value)) return { error: true, errorMessage: "game_speed_up_value is not a number" };
        if (parseFloat(settings.game_speed_up_value) < 0 || parseFloat(settings.game_speed_up_value) > 0.3) return { error: true, errorMessage: "game_speed_up_value is not between 0 and 0.3" };
        if (settings.grid_size_per_player == null) return { error: true, errorMessage: "grid_size_per_player is not specified" };
        if (isNaN(settings.grid_size_per_player)) return { error: true, errorMessage: "grid_size_per_player is not a number" };
        if (parseInt(settings.grid_size_per_player) < 6 || parseInt(settings.grid_size_per_player) > 12) return { error: true, errorMessage: "grid_size_per_player must be between 1 and 16" };

        return { error: false };
    }
    CreatePlayerData(player, name, color) {
        return new PlayerGameDataBattleRoyale(player, name, color);
    }
    constructor(room, settings) {
        settings.frame_time = 250
        settings.grid_size = 20
        super(room, settings);
        this.gameSettings.min_players = parseInt(settings.min_players);
        this.gameSettings.deadZoneKills = settings.dead_zone_kills;
        this.gameSettings.gameSpeedUpValue = parseFloat(settings.game_speed_up_value);
        this.gameSettings.gridSizePerPlayer = parseInt(settings.grid_size_per_player);
        clearTimeout(this.updateTimeout)
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
    }
    RestartGame() {
        this.game_status.started = false;
        this.game_status.ended = false;
        this.game_status.winner = null;
        this.mapShrinkSize = 0
        this.gameSpeedRate = 1;
        this.apples = [];
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
        this.room.GetPlayersInGame().forEach(player => player.gameData.Reset());
        this.SpawnAppleCountdown.StopCountdown();
        this.MapShrinkCountdown.StopCountdown();
        this.WaitingForPlayersCountdown.StopCountdown();
        this.GoldAppleCountdown.StopCountdown();
        this.RestartCountdown.StopCountdown();
        this.KillShortestCountdown.StopCountdown();
        if (this.room.GetPlayersInGame().length >= this.gameSettings.min_players) {
            this.WaitingForPlayersCountdown.RestartCountdown();
        }
    }
    StartGame() {
        this.game_status.started = true;
        this.game_status.ended = false;
        this.game_status.winner = null;
        this.grid_size = this.gameSettings.gridSizePerPlayer * this.room.GetPlayersInGame().length;
        this.SpawnPlayers();
        for (let i = 0; i < this.gameSettings.min_players * 2; i++) {
            this.SpawnNewApple();
        }
        this.isFreezed = true;
        this.FreezeCountdown.RestartCountdown();
        this.SpawnAppleCountdown.SetDefaultTime(4 / this.GetAlivePlayers().length);
        this.SpawnAppleCountdown.RestartCountdown();
        this.MapShrinkCountdown.RestartCountdown();
        this.GoldAppleCountdown.RestartCountdown();
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time);
    }
    GameUpdate() {
        if (this.game_status.started && !this.game_status.ended && !this.isFreezed) {
            this.GetAlivePlayers().forEach(player => {
                player.gameData.direction = player.gameData.targetDirection;
                this.EatAppleInNextMove(player)
            });
            this.GetAlivePlayers().forEach(player => this.MovePlayer(player))
            this.GetAlivePlayers().forEach(player => {
                if (this.CheckPlayerInDeadZone(player)) {
                    this.PlayerInDeadZone(player)
                }
            })
            this.GetAlivePlayers().forEach(player => {
                if (this.CheckPlayerBodyCollision(player) || this.CheckPlayerOutsideMap(player)) player.gameData.shouldBeKilled = true;
                else this.KillPlayerIfCollidingWithEnemy(player);
            })
            this.KillPlayersThatShouldBeKilled();
        }
        this.BroadcastGameUpdate();
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => this.GameUpdate(), this.frame_time / this.gameSpeedRate);
    }
    BroadcastGameUpdate() {
        const data = {}
        data.game_status = this.game_status;
        data.min_players = this.gameSettings.min_players;
        if (!this.game_status.started) {
            data.waiting_players = this.room.GetPlayersInGame().length;
            data.countdown = this.WaitingForPlayersCountdown.isRunning ? this.WaitingForPlayersCountdown.timeLeft : -1;
            data.players = this.room.GetPlayersInGameJSON();
        }
        else if (this.game_status.started && !this.game_status.ended) {
            data.apples = this.apples.map(apple => apple.ToJSON());
            data.players = this.room.GetPlayersInGameJSON()
            data.grid_size = this.grid_size;
            data.shrink_size = this.mapShrinkSize;
            data.freeze_time = this.FreezeCountdown.isRunning ? this.FreezeCountdown.timeLeft : -1;
            data.shrink_time = this.MapShrinkCountdown.isRunning ? this.MapShrinkCountdown.timeLeft : -1;
            data.kill_shortest_time = this.KillShortestCountdown.isRunning ? this.KillShortestCountdown.timeLeft : -1;
        } else if (this.game_status.ended) {
            if (this.game_status.winner) data.winner = this.game_status.winner.gameData.name
            else data.winner = "No one"
            data.restart_countdown = this.RestartCountdown.timeLeft;
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
    CanJoinGame(player) {
        //if game started return false
        if (this.game_status.started) return false;
        //if player is already in game return false
        if (this.room.GetPlayersInGame().find(p => p.socket.id == player.socket.id)) return false;
        return true;
    }
    OnPlayerJoin(player) {
        if (!this.game_status.started) {
            if (this.room.GetPlayersInGame().length >= this.gameSettings.min_players) {
                this.WaitingForPlayersCountdown.RestartCountdown();
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
            if (player.gameData) {
                player.gameData.shouldBeKilled = true;
                if (this.GetAlivePlayers().length == 0)
                    this.RestartGame();
            }
        } else if (!this.game_status.ended) {
            if (this.room.GetPlayersInGame().length < this.gameSettings.min_players) {
                this.WaitingForPlayersCountdown.StopCountdown();
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
            const availableCells = this.GetAvailableCells(2);
            const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
            player.gameData.snake = [{ x: randomCell.x, y: randomCell.y }];
            player.gameData.direction = "right";
            player.gameData.targetDirection = "right";
            player.gameData.score = 0;
            player.gameData.shouldBeRespawned = false;
            player.gameData.isKilled = false;
        });
    }
    KillPlayersThatShouldBeKilled() {
        this.room.GetPlayersInGame().forEach(player => {
            if (player.gameData.shouldBeKilled) {
                if (player.gameData) {
                    player.gameData.isKilled = true;
                    player.gameData.snake = [];
                    player.gameData.score = 0;
                }
                this.CheckWinner();
            }
        })
    }
    CheckWinner() {
        if (this.GetAlivePlayers().length <= 1) {
            this.game_status.ended = true;
            if (this.GetAlivePlayers().length === 1)
                this.game_status.winner = this.GetAlivePlayers()[0].ToJSON();
            else
                this.game_status.winner = null;
            this.RestartCountdown.RestartCountdown();
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
        const topLeftBorder = this.gameSettings.deadZoneKills ? this.mapShrinkSize : 0;
        const bottomRightBorder = this.gameSettings.deadZoneKills ? this.grid_size - this.mapShrinkSize : this.grid_size;
        return head.x < topLeftBorder || head.x >= bottomRightBorder || head.y < topLeftBorder || head.y >= bottomRightBorder;
    }
    KillPlayerIfCollidingWithEnemy(player) {
        const playersInGame = this.GetAlivePlayers();
        const snake = player.gameData.snake;
        const head = snake[0];
        const enemies = playersInGame.filter(enemy => enemy !== player);
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const enemySnake = enemy.gameData.snake;
            if (enemySnake.length === 0) continue;
            for (let j = 0; j < enemySnake.length; j++) {
                if (enemySnake[j].x === head.x && enemySnake[j].y === head.y) {
                    if (j === 0) enemy.gameData.shouldBeKilled = true; //if head - kill enemy too
                    else player.gameData.shouldBeKilled = true;
                    return;
                }
            }
        }
    }
    CheckPlayerInDeadZone(player) {
        //if any part of snake is in dead zone return true
        const snake = player.gameData.snake;
        if (snake.length === 0) return false;
        const topLeftBorder = this.mapShrinkSize
        const bottomRightBorder = this.grid_size - this.mapShrinkSize
        return snake.some(cell => cell.x < topLeftBorder || cell.x >= bottomRightBorder || cell.y < topLeftBorder || cell.y >= bottomRightBorder);
    }
    PlayerInDeadZone(player) {
        player.gameData.deadZoneCounter++;
        if (player.gameData.deadZoneCounter >= 3) {
            player.gameData.deadZoneCounter = 0;
            player.gameData.snake.pop();
            if (player.gameData.snake.length === 0) {
                player.gameData.shouldBeKilled = true;
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
    SpawnNewApple(value = 1) {
        const availableCells = this.GetAvailableCells();
        if (availableCells.length === 0) return;
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        const apple = new Apple(this.room, randomCell.x, randomCell.y, value);
        this.apples.push(apple);
        this.SpawnAppleCountdown.RestartCountdown();
    }
    ShrinkMap() {
        this.mapShrinkSize++;
        const players = this.room.GetPlayersInGame();
        if (this.gameSettings.deadZoneKills)
            players.forEach(player => {
                let snake = player.gameData.snake;
                if (snake.length === 0) return;
                for (let i = 0; i < snake.length; i++) {
                    const currElement = snake[i];
                    if (currElement.x < this.mapShrinkSize || currElement.x >= this.grid_size - this.mapShrinkSize || currElement.y < this.mapShrinkSize || currElement.y >= this.grid_size - this.mapShrinkSize) {
                        if (i === 0)
                            player.gameData.shouldBeKilled = true;
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
        this.gameSpeedRate += this.gameSettings.gameSpeedUpValue
        this.KillShortestCountdown.RestartCountdown();
    }
    SpawnGoldApple() {
        const availableCells = this.GetAvailableCells();
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        const apple = new Apple(this.room, randomCell.x, randomCell.y, 3);
        this.apples.push(apple);
        this.SpawnAppleCountdown.RestartCountdown();
    }
    KillShortestSnake() {
        const alivePlayers = this.GetAlivePlayers();
        alivePlayers.sort((a, b) => a.gameData.snake.length - b.gameData.snake.length);
        const shortestSnake = alivePlayers[0];
        if (!alivePlayers.every(snake => snake.gameData.snake.length == shortestSnake.gameData.snake.length)) {
            for (let i = 0; i < alivePlayers.length; i++) {
                if (alivePlayers[i].gameData.snake.length == shortestSnake.gameData.snake.length) {
                    alivePlayers[i].gameData.shouldBeKilled = true
                } else {
                    break;
                }
            }
        }
        this.MapShrinkCountdown.RestartCountdown()
    }
}