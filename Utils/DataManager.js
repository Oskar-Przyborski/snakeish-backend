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
 * @param {number} frame_time
 * @param {number} grid_size
 * @param {number} apples_quantity
 * @returns {Boolean}
 */
function CreateNewRoom(room_ID, frame_time, grid_size, apples_quantity) {
    if (room_ID == null) return { error: true, errorMessage: "room_ID not specified" };
    if (room_ID == "") return { error: true, errorMessage: "room_ID is empty" };
    if (room_ID.length > 10) return { error: true, errorMessage: "room_ID is too long" };
    if (FindRoomByID(room_ID) != null) return { error: true, errorMessage: "Room name already exists" };
    if (frame_time == null) return { error: true, errorMessage: "frame_time not specified" };
    if (isNaN(frame_time)) return { error: true, errorMessage: "frame_time is not a number" };
    if (frame_time < 75 || frame_time > 1000) return { error: true, errorMessage: "frame_time must be between 75 and 1000" };
    if (grid_size == null) return { error: true, errorMessage: "grid_size not specified" };
    if (isNaN(grid_size)) return { error: true, errorMessage: "grid_size is not a number" };
    if (grid_size < 6 || grid_size > 35) return { error: true, errorMessage: "grid_size must be between 8 and 40" };
    if (apples_quantity == null) return { error: true, errorMessage: "apples_quantity not specified" };
    if (isNaN(apples_quantity)) return { error: true, errorMessage: "apples_quantity is not a number" };
    if (apples_quantity < 1 || apples_quantity > 10) return { error: true, errorMessage: "apples_quantity must be between 1 and 10" };

    const newRoom = new Room(room_ID, frame_time, grid_size,apples_quantity);
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