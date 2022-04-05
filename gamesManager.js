import dataManager from "./dataManager.js"
import defaultPlayerData from "./defaultPlayerData.js";
import directionToVector from "./directionToVector.js";

const MovePlayerSnake = (player) => {
    const direction = directionToVector(player.direction);
    const snake = player.snake;
    const head = snake[0];
    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    }
    snake.unshift(newHead);
    snake.pop();
}
const CheckPlayerTailCollision = (player) => {
    const snake = player.snake;
    const head = snake[0];
    const tail = snake.slice(1);
    const collision = tail.some(e => e.x == head.x && e.y == head.y);
    return collision;
}
const CheckAppleCollisionToAllPlayers = (room) => {
    const apple = room.apple;
    const players = room.players;
    const collision = players.some(player => player.snake[0].x == apple.x && player.snake[0].y == apple.y);
    return collision;
}
const CheckAppleColisionNext = (player, room) => {
    const snake = player.snake;
    const head = snake[0];
    const apple = room.apple;
    const playerDirection = directionToVector(player.direction);
    return head.x + playerDirection.x == apple.x && head.y + playerDirection.y == apple.y;
}
const CheckPlayerEatsApple = (player, room) => {
    if (CheckAppleColisionNext(player, room)) {
        const snake = player.snake;
        snake.push({ x: snake[snake.length - 1].x, y: snake[snake.length - 1].y });
        player.score++;
        GenerateNewApple(room)
    }
}
const GenerateNewApple = (room) => {
    let position = { x: 0, y: 0 };
    do {
        position.x = Math.floor(Math.random() * room.grid_size);
        position.y = Math.floor(Math.random() * room.grid_size);
    } while (CheckAppleCollisionToAllPlayers(room));
    dataManager.UpdateApplePosition(room.room_id, position.x, position.y);
}
const CheckPlayerWallCollision = (player, room) => {
    const snake = player.snake;
    const head = snake[0];
    const grid_size = room.grid_size;
    const collision = head.x < 0 || head.x >= grid_size || head.y < 0 || head.y >= grid_size;
    return collision;
}
const CheckPlayerCollision = (player, room) => CheckPlayerTailCollision(player) || CheckPlayerWallCollision(player, room);
const RestartPlayer = (player) => {
    player.snake.length = 1;
    SetPlayerRandomPosition(player, dataManager.FindRoom(player.roomID));
    player.direction = "right";
    player.score = 0;
}

const UpdateGame = (roomId) => {
    const room = dataManager.FindRoom(roomId);
    if (!room) return;
    const players = room.players;
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        player.direction = player.targetDirection;
        CheckPlayerEatsApple(player, room);
        MovePlayerSnake(player);
        if (CheckPlayerCollision(player, room)) {
            RestartPlayer(player);
        }
    }
}

const SetPlayerRandomPosition = (player, room) => {
    let position = { x: 0, y: 0 };
    do {
        position.x = Math.floor(Math.random() * room.grid_size - 2) + 1;
        position.y = Math.floor(Math.random() * room.grid_size - 2) + 1;
    } while (room.players.some(player => player.snake.some(e => e.x == position.x && e.y == position.y) || position.x == room.apple.x && position.y == room.apple.y));
    player.snake[0] = position;
}
const UpdateAllRooms = (socket) => {
    const rooms = dataManager.rooms;
    for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        UpdateGame(room.room_id);
        const players = room.players;
        for (let j = 0; j < players.length; j++) {
            const player = players[j];
            const otherPlayers = [...players.map(p=>{return {name:p.name, score:p.score, snake:p.snake}})];
            otherPlayers.splice(j, 1);
            const data = {
                snake: player.snake,
                name: player.name,
                apple: room.apple,
                score: player.score,
                otherPlayers: otherPlayers
            }
            socket.to(player.socketID).emit("game-update", data);
        }
    }
}
export default {
    UpdateGame,
    UpdateAllRooms,
    GenerateNewApple,
    SetPlayerRandomPosition
}