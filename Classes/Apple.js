import Room from "./Room.js";

export default class Apple {
    x;
    y;
    isEaten = false;
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
    }
    ToJSON() {
        const data = {
            isEaten: this.isEaten,
            x: this.isEaten ? -1 : this.x,
            y: this.isEaten ? -1 : this.y
        }
        return data;
    }
}