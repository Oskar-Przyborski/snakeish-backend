import Room from "../Room.js";
export default class GameMode {
    /**
     * @type {Room}
     */
    room;
    frame_time;
    grid_size;
    GameUpdate() { throw new Error("GameMode.GameUpdate: Not implemented."); }
    BroadcastGameUpdate() { throw new Error("GameMode.BroadcastGameUpdate: Not implemented."); }
    ToJSON() { throw new Error("GameMode.ToJSON: Not implemented."); }
    OnPlayerJoin(player) { throw new Error("GameMode.OnPlayerJoin: Not implemented."); }
    OnPlayerLeave(player) { throw new Error("GameMode.OnPlayerLeave: Not implemented."); }
    CreatePlayerData(player, name, color) { throw new Error("GameMode.CreatePlayerData: Not implemented."); }
    constructor(room, settings) {
        this.room = room;
        this.frame_time = settings.frame_time;
        this.grid_size = settings.grid_size;
    }
}