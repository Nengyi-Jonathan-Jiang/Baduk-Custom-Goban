function deepCopy(o) {
    return JSON.parse(JSON.stringify(o));
}


/** @typedef {0|1|2|3} StoneColor */
class Color {

    /** @type {StoneColor} */
    static get BLACK() {
        return 1
    }

    /** @type {StoneColor} */
    static get WHITE() {
        return 2
    }

    /** @type {StoneColor} */
    static get WALL() {
        return 3
    }

    /** @type {StoneColor} */
    static get EMPTY() {
        return 0
    }

    /**
     * @param {StoneColor} color
     * @return {StoneColor}
     */
    static invert(color) {
        return color === this.WHITE ? this.BLACK : color === this.BLACK ? this.WHITE : this.WALL;
    }

    /** @param {StoneColor} color */
    static isPlayer(color) {
        return color === this.WHITE || color === this.BLACK;
    }
}

/**
 * @typedef {[number, number]} Position
 * @typedef {{
 *      color: StoneColor,
 *      liberties: number,
 *      stones: Position[]
 * }} Group
 * @typedef {StoneColor[][]} GobanState
 * @typedef {{
 *      move:null|Position,
 *      blackCaptures:number,
 *      whiteCaptures:number,
 *      stones:GobanState
 * }} GameState
 */

class Goban {
    /**
     * @param {boolean[][]} template
     * @param {number} size
     * @param {number} aspect
     * @param {number} width
     * @param {number} height
     */
    constructor(template, size, aspect=1, width=0, height=0) {
        this.boardTemplate = template;
        this.size = size;
        this.width = width;
        this.height = height;
        this.aspect = aspect;
        /** @type {GobanState} */
        this.stones = this.boardTemplate.map(i => i.map(j => j ? Color.EMPTY : Color.WALL));
        /** @type {StoneColor} */
        this.currentPlayerColor = Color.BLACK;
        this.koState = -1;
        /** @type {GameState[]} */
        this.history = [
            {
                move: null,
                blackCaptures: 0,
                whiteCaptures: 0,
                stones: deepCopy(this.stones)
            }
        ];
        this.history_pointer = 0;
        this.whiteCaptures = 0;
        this.blackCaptures = 0;
    }

    get #state() {
        return this.stones.map(i => i.join('')).join('');
    }

    /** @returns {any} */
    getBoardInfoJSON() {
        return {
            width: this.width,
            height: this.height,
            aspect: this.aspect,
            size: this.size,
            boardTemplate: this.boardTemplate,
        }
    }

    /** @returns {any} */
    getBoardDataJSON() {
        return {
            stones: deepCopy(this.stones),
            allowedPlacements: this.getAllowedPlacements(),
            currentColor: this.currentPlayerColor,
            whiteCaptures: this.whiteCaptures,
            blackCaptures: this.blackCaptures,
            currentMove: this.history_pointer,
            estimate: this.getTerritoryEstimate(),
        }
    }

    getTerritoryEstimate() {
        let estimate = this.stones.map(i => i.map(j => (
            j === Color.BLACK ? 64 : j === Color.WHITE ? -64 : 0
        )));
        const dilate = () => {
            let newEstimate = estimate.map(i => i.map(j => 0));
            for(let x = 0; x < this.width; x++) {
                for(let y = 0; y < this.height; y++) {
                    if(this.isWall(x, y)) continue;
                    const adjacent_values = [];
                    for(let [xx, yy] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]])
                        if(!this.isWall(xx, yy)) adjacent_values.push(estimate[xx][yy]);
                    let mainColor =
                        adjacent_values.every(i => i >= 0) ?
                            1 :
                            adjacent_values.every(i => i <= 0) ?
                                -1 :
                                0;
                    newEstimate[x][y] = estimate[x][y] + mainColor * adjacent_values.filter(i => i !== 0).length;
                }
            }
            estimate = newEstimate;
        }
        const erode = () => {
            let newEstimate = estimate.map(i => i.map(j => 0));
            for(let x = 0; x < this.width; x++) {
                for(let y = 0; y < this.height; y++) {
                    if(this.isWall(x, y)) continue;
                    const adjacent_values = [];
                    const currentEstimate = estimate[x][y];for(let [xx, yy] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]])
                        if(!this.isWall(xx, yy)) adjacent_values.push(estimate[xx][yy]);

                    let erosion = adjacent_values.filter(i => i * currentEstimate <= 0).length;

                    if(currentEstimate > 0) newEstimate[x][y] = Math.max(currentEstimate - erosion, 0)
                    if(currentEstimate < 0) newEstimate[x][y] = Math.min(currentEstimate + erosion, 0)
                }
            }
            estimate = newEstimate;
        }

        for(let _ = 0; _ < 4; _++) dilate();
        for(let _ = 0; _ < 13; _++) erode();
        return estimate;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    canPlace(x, y) {
        // Check liberties
        if (!this.isUnoccupied(x, y)) return false;

        for (let [xx, yy] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
            let g = this.getGroupAt(xx, yy);
            if (typeof g === 'number') {
                if (g === Color.EMPTY)
                    return true;
            } else {
                let {color, liberties} = g;
                if (color === this.currentPlayerColor) {
                    if (liberties > 1)
                        return true;
                } else if (liberties === 1 && this.#checkKo(x, y)) {
                    return true;
                }
            }
        }
        return false;
    }


    /**
     * @param {number} x
     * @param {number} y
     */
    #checkKo(x, y) {
        let saved = this.stones;
        this.stones = deepCopy(this.stones);
        this.#place(x, y);
        let res = this.#state !== this.koState;
        this.stones = saved;
        return res;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @return {StoneColor|Group}
     */
    getGroupAt(x, y) {
        let color = this.getColor(x, y);
        if (!Color.isPlayer(color)) return color;

        const positions = [[x, y]];
        /** @type {Set<number>} */
        const visited = new Set();
        /** @type {[number, number][]}*/
        const stones = [];
        let liberties = 0;
        while (positions.length) {
            const [xx, yy] = positions.shift()
            let z = xx * this.height + yy;
            if (visited.has(z)) continue;
            visited.add(z);

            let cc = this.getColor(xx, yy);
            if (cc === color) {
                stones.push([xx, yy]);
                positions.push([xx + 1, yy]);
                positions.push([xx - 1, yy]);
                positions.push([xx, yy + 1]);
                positions.push([xx, yy - 1]);
            } else if (cc === Color.EMPTY) {
                liberties++;
            }
        }

        return {stones: stones, liberties: liberties, color: color};
    }

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    isUnoccupied(x, y) {
        return !this.isWall(x, y) && this.stones[x][y] === Color.EMPTY;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    isWall(x, y) {
        return !this.boardTemplate[x]?.[y];
    }

    /**
     * @param {number} x
     * @param {number} y
     * @return {StoneColor}
     */
    getColor(x, y) {
        return this.isWall(x, y) ? Color.WALL : this.stones[x][y];
    }

    #place(x, y, countPrisoners=false) {
        this.stones[x][y] = this.currentPlayerColor;

        for (let [xx, yy] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
            let g = this.getGroupAt(xx, yy);
            if (typeof g === 'number') continue;
            let {color, liberties} = g;
            if (color !== this.currentPlayerColor && liberties === 0) {
                this.#removeGroup(g, countPrisoners);
            }
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    place(x, y) {
        if (!this.canPlace(x, y)) throw new Error('bad placement');
        this.koState = this.#state;
        this.#place(x, y, true);
        this.#endMove();
    }

    pass() {
        this.#endMove();
    }

    /** @param {Position|null} move */
    #endMove(move=null) {
        while(this.history_pointer < this.history.length - 1) this.history.pop();
        this.history.push({
            move: move,
            blackCaptures: this.whiteCaptures,
            whiteCaptures: this.blackCaptures,
            stones: deepCopy(this.stones)
        });
        this.history_pointer = this.history.length - 1;
        this.currentPlayerColor = Color.invert(this.currentPlayerColor)
    }

    /**
     * @param {Group} g
     * @param countPrisoners
     */
    #removeGroup(g, countPrisoners=false) {
        let {stones, color} = g;
        for (let [x, y] of stones) this.stones[x][y] = Color.EMPTY;

        if(countPrisoners) switch (color) {
            case Color.BLACK:
                this.whiteCaptures += stones.length; break;
            case Color.WHITE:
                this.blackCaptures += stones.length; break;
        }
    }

    undo(num=1){
        this.#gotoMove(Math.max(this.history_pointer - num, 0));
    }

    redo(num=1){
        this.#gotoMove(Math.min(this.history_pointer + num, this.history.length - 1));
    }

    /** @param {number} num */
    #gotoMove(num) {
        if((num & 1) !== (this.history_pointer & 1))
            this.currentPlayerColor = Color.invert(this.currentPlayerColor);
        this.history_pointer = num;
        const {stones, blackCaptures, whiteCaptures} = this.history[this.history_pointer];
        this.stones = deepCopy(stones);
        this.whiteCaptures = blackCaptures;
        this.blackCaptures = whiteCaptures;
    }

    getAllowedPlacements() {
        return this.boardTemplate.map((s, i) => s.map((t, j) => t && this.canPlace(i, j)))
    }
}

module.exports = {Color, Goban};