import defaultPlayerData from "./defaultPlayerData.js";
import gamesManager from "./gamesManager.js";

const rooms = [];

const CreateNewRoom = (room_id) => {
    if (FindRoom(room_id)) return;
    const room = {
        room_id: room_id,
        players: [],
        game_state: "waiting",
        grid_size: 16,
        apple: {
            x: 0,
            y: 0
        }
    }
    rooms.push(room);
    gamesManager.GenerateNewApple(room)
    return room;
}
const GetRoom = (room_id) => {
    let foundRoom = FindRoom(room_id);
    if (foundRoom) return foundRoom;
    return CreateNewRoom(room_id);
}
const FindRoom = (room_id) => {
    return rooms.find(room => room.room_id === room_id);
}
const GetPlayerInRoom = (room, player_id) => {
    return room.players.find(player => player.socketID === player_id);
}
const AddPlayerToRoom = (room_id, player_id) => {
    const room = GetRoom(room_id);
    if (!room) return;
    const player = { ...defaultPlayerData }
    player.socketID = player_id;
    player.roomID = room_id;
    player.snake = [{ x: 0, y: 0 }];
    room.players.push(player);
    gamesManager.SetPlayerRandomPosition(player, room)
    return player;
}
const UpdatePlayerTargetDirection = (room_id, player_id, direction) => {
    const room = FindRoom(room_id);
    if (!room) return;
    const player = GetPlayerInRoom(room, player_id);
    if (!player) return;
    //can not move backwards
    if(player.targetDirection == "up" && direction == "down") return;
    if(player.targetDirection == "down" && direction == "up") return;
    if(player.targetDirection == "left" && direction == "right") return;
    if(player.targetDirection == "right" && direction == "left") return;
    player.targetDirection = direction;
}
const UpdateApplePosition = (room_id, x, y) => {
    const room = FindRoom(room_id);
    if (!room) return;
    room.apple.x = x;
    room.apple.y = y;
}
const RemovePlayerFromRoom = (room_id, player_id) => {
    const room = FindRoom(room_id);
    if (!room) return;
    const player = GetPlayerInRoom(room, player_id);
    if (!player) return;
    //remove player
    room.players.splice(room.players.indexOf(player), 1);

    //if room is empty, delete it
    if (room.players.length === 0)
        DeleteRoom(room_id);

}
const DeleteRoom = (room_id) => {
    const room = FindRoom(room_id);
    if (!room) return;
    rooms.splice(rooms.indexOf(room), 1);
}
export default {
    rooms,
    CreateNewRoom,
    GetRoom,
    FindRoom,
    GetPlayerInRoom,
    AddPlayerToRoom,
    UpdatePlayerTargetDirection,
    UpdateApplePosition,
    RemovePlayerFromRoom
}