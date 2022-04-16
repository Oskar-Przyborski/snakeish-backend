import Room from "./Room.js";

export default class Apple {
    x;
    y;
    value = 1;
    isEaten = false;
    /**
     * @type {Room} room
     */
    room;
    /**
     * Description
     * @param {Room} room
     * */
    constructor(room, x, y, value = 1) {
        this.room = room;
        this.x = x;
        this.y = y;
        this.value = value;
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