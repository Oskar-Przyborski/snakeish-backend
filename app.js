import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import DataManager from "./Utils/DataManager.js";
import cors from "cors";
import Room from "./Classes/Room.js";

const corsData = {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
}
const app = express();
app.use(express.json())
app.use(cors(corsData))
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: corsData
});

const io_rooms = io.of("/rooms")
io_rooms.on('connection', socket => {
    /**
     * @type {Room}
     */
    let room = null;
    socket.on("join-room", (roomId) => {
        console.log(`${socket.id} joining room ${roomId}`);
        const FoundRoom = DataManager.Rooms.FindRoomByID(roomId)
        if (FoundRoom) {
            socket.join(roomId)
            FoundRoom.AddPlayer(socket)
            console.log(`${socket.id} joined room ${roomId}`);
            room = FoundRoom
        }
    })
    socket.on("join-game", (name, color, callback) => {
        if (!room) return
        const player = room.FindPlayer(socket.id)
        if (!player) return;
        player.JoinGame(name, color, callback)
        console.log(`${socket.id} joined game in ${room.room_ID}`);
    })
    socket.on("update-target-direction", targetDirection => {
        if (!room) return
        const player = room.FindPlayer(socket.id)
        if (player)
            if (player.isPlaying) player.gameData.SetTargetDirection(targetDirection)
    })
    socket.on("leave-game", () => {
        if (!room) return;
        const player = room.FindPlayer(socket.id);
        if (!player) return;
        player.LeaveGame();
        console.log(`${socket.id} left game in ${room.room_ID}`);
    })
    //on disconnect remove player from room
    socket.on("disconnect", () => {
        if (!room) return;
        const player = room.FindPlayer(socket.id);
        if (!player) return;
        room.RemovePlayer(player);
        console.log(`${socket.id} disconnected from room ${room.room_ID}`);

    })
})
app.get("/api/rooms", (req, res) => {
    const rooms = DataManager.Rooms.GetRoomsJSON();
    res.status(200).send(rooms)
})
app.post("/api/room-exists", (req, res) => {
    const room_ID = req.body.room_ID;
    if (room_ID == null) { res.status(400).json({ error: "room_ID not specified" }); return; }
    const room = DataManager.Rooms.FindRoomByID(room_ID);
    if (room) {
        res.status(200).json({ exists: true });
    } else {
        res.status(200).json({ exists: false })
    }
})
app.post("/api/is-name-already-taken", (req, res) => {
    const name = req.body.name;
    if (name == null) { res.status(400).json({ error: "name not specified" }); return; }
    if (name == "") { res.status(400).json({ error: "name cannot be empty" }); return; }
    if (name.length > 10) { res.status(400).json({ error: "name should be shorter than 11 characters" }); return; }
    const reqRoom = req.body.room;
    if (reqRoom == null) { res.status(400).json({ error: "room not specified" }); return; }
    if (reqRoom == "") { res.status(400).json({ error: "room cannot be empty" }); return; }
    const room = DataManager.Rooms.FindRoomByID(reqRoom);
    if (!room) { res.status(400).json({ error: "room does not exist" }); return; }
    const player = room.FindPlayerByName(name);
    if (player)
        res.status(200).json({ taken: true });
    else
        res.status(200).json({ taken: false });
})
app.post("/api/create-room", (req, res) => {
    const room_ID = req.body.room_ID;
    const gameModeIndex = req.body.gameModeIndex;
    const settings = req.body.settings;
    const resp = DataManager.Rooms.CreateNewRoom(room_ID, gameModeIndex, settings);
    if (resp.error) res.status(400).send(resp.errorMessage);
    else res.status(200).send("Room created");
})

httpServer.listen(process.env.PORT || 8080, () => {
    console.log("listening on port 8080")
});

export default io_rooms
