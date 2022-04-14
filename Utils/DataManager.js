import ClassicMode from "../Classes/GameModes/ClassicMode.js";
import Room from "../Classes/Room.js";

/**
 * @type {Array<Room>}
 */
const rooms = [];

/**
 * Description
 * @param {String} room_ID
 * @returns {Room | null}
 */
function FindRoomByID(room_ID) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].room_ID === room_ID) {
            return rooms[i];
        }
    }
    return null;
}
/**
 * Description
 * @returns {Array<Room>}
 */
function GetRooms() {
    return rooms
}
function GetRoomsJSON() {
    return GetRooms().map(room => room.ToJSON());
}
/**
 * Description
 * @param {String} room_ID
 * @param {number} gameModeIndex
 * @param {any} settings
 * @returns {any}
 */
function CreateNewRoom(room_ID, gameModeIndex, settings) {
    if (room_ID == null) return { error: true, errorMessage: "room_ID not specified" };
    if (room_ID == "") return { error: true, errorMessage: "room_ID is empty" };
    if (room_ID.length > 10) return { error: true, errorMessage: "room_ID is too long" };
    if (FindRoomByID(room_ID) != null) return { error: true, errorMessage: "room_ID already exists" };
    if (gameModeIndex == null) return { error: true, errorMessage: "gameModeIndex not specified" };
    if (isNaN(gameModeIndex)) return { error: true, errorMessage: "gameModeIndex is not a number" };
    if (settings == null) return { error: true, errorMessage: "settings not specified" };
    switch (gameModeIndex) {
        case 0:
            const res = ClassicMode.CheckRequirements(settings);
            if (res.error) return res;
            break;
        default:
            return { error: true, errorMessage: "gameModeIndex is not valid" };
            break;
    }
    const newRoom = new Room(room_ID, gameModeIndex, settings);
    newRoom.StartAfkTimeout();
    rooms.push(newRoom);
    return { error: false };
}

function RemoveRoom(room) {
    clearTimeout(room.timeout);
    rooms.splice(rooms.indexOf(room), 1);
}
export default {
    Rooms: {
        FindRoomByID,
        GetRooms,
        GetRoomsJSON,
        CreateNewRoom,
        RemoveRoom
    }
}