import Room from "./Room.js";

export default class Apple {
    x;
    y;
    shouldBeRespawned = false;
    /**
     * @type {Room} room
     */
    room;
    /**
     * Description
     * @param {Room} room
     * */
    constructor(room) {
        this.room = room;
        this.x = 0;
        this.y = 0;
        this.Respawn();
    }
    Respawn() {
        const availablePositions = this.room.GetAvailableCellsOnGrid()
        if (availablePositions.length > 0) {
            const randomPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
            this.x = randomPosition.x;
            this.y = randomPosition.y;
            this.shouldBeRespawned = false;
        }
    }
    ToJSON() {
        const data = {
            x: this.x,
            y: this.y
        }
        return data;
    }
}