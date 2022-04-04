import { createServer } from "http";
import { Server } from "socket.io";
import dataManager from "./dataManager.js";
import gamesManager from './gamesManager.js'

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "https://snakeish.vercel.app",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const FRAME_TIME = 500
const io_rooms = io.of("/rooms")
io_rooms.on('connection', socket => {
    console.log("someone conencterd")
    let room_id = null;
    socket.on('join-room', _room_id => {
        room_id = _room_id;
        socket.join(_room_id)
        dataManager.AddPlayerToRoom(_room_id, socket.id)
        console.log(`socket ${socket.id} joined room ${_room_id}`)
    })
    socket.on('update-target-direction', (direction) => {
        dataManager.UpdatePlayerTargetDirection(room_id, socket.id, direction)
    })
    socket.on('disconnect', () => {
        dataManager.RemovePlayerFromRoom(room_id, socket.id)
    })
})
setTimeout(() => { UpdateRoomsLoop(io) }, FRAME_TIME)

function UpdateRoomsLoop(io) {
    gamesManager.UpdateAllRooms(io.of("/rooms"))
    setTimeout(() => { UpdateRoomsLoop(io) }, FRAME_TIME)
}

httpServer.listen(process.env.PORT || 8080, () => {
    console.log("listening on port 8080")
});