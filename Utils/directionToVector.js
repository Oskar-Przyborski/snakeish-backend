/**
 * Converts string direction like "left" to vector like {x: -1, y: 0}
 * @param {string} direction
 * @returns {any}
 */
export default (direction) => {
    switch (direction) {
        case "up":
            return { x: 0, y: -1 }
        case "down":
            return { x: 0, y: 1 }
        case "left":
            return { x: -1, y: 0 }
        case "right":
            return { x: 1, y: 0 }
        default:
            return { x: 1, y: 0 }
    }
}
