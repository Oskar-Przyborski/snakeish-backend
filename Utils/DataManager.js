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
 * @param {String} frame_time
 * @param {String} grid_size
 * @returns {Boolean}
 */
function CreateNewRoom(room_ID, frame_time, grid_size) {
    if (FindRoomByID(room_ID) != null) return false;
    if (room_ID == "" || room_ID == null) return false;
    if (frame_time <= 50 || frame_time > 2500 || frame_time == null) return false;
    if (grid_size < 5 || grid_size > 50 || grid_size == null) return false;

    const newRoom = new Room(room_ID, frame_time, grid_size);
    newRoom.StartAfkTimeout();
    rooms.push(newRoom);
    return true;
}

function RemoveRoom(room) {
    clearTimeout(room.timeout);
    rooms.splice(rooms.indexOf(room), 1);
}
export default {
    FindRoomByID,
    GetRooms,
    GetRoomsJSON,
    CreateNewRoom,
    RemoveRoom
}