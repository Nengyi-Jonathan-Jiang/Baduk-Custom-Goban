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

class GobanView {
	/** @type {HTMLImageElement} */
	static whiteStoneImage = document.getElementById('white-stone-img');
	/** @type {HTMLImageElement} */
	static blackStoneImage = document.getElementById('black-stone-img');
	/** @type {HTMLImageElement} */
	static boardImage = document.getElementById('board-img');

	static getImageForColor(color = 0) {
		return { [Color.BLACK]: this.blackStoneImage, [Color.WHITE]: this.whiteStoneImage }[color]
	}

	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} width
	 * @param {number} height
	 * @param {number} size
	 * @param {boolean[][]} board
	 */
	constructor(canvas, width, height, size, board) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		window.addEventListener('resize', _ => this.resize());
		this.goban = goban;
		this.width = width;
		this.height = height;
		this.size = size;
		this.board = board;
		this.hovered = [-1, -1];

		this.resize();
	}

	resize() {
		const { canvas } = this;

		const pw = canvas.parentElement.clientWidth;
		const ph = canvas.parentElement.clientHeight;
		let u = Math.min(pw / this.width, ph / this.height);
		canvas.width = Math.max(1, ~~(u * this.width));
		canvas.height = Math.max(1, ~~(u * this.height));
	}

	/** @type {{canvas: HTMLCanvasElement, width: number, height: number, isImageLoaded: boolean}} */
	cachedBoard = { canvas: null, width: 0, height: 0, isImageLoaded: false };

	cacheGobanBackground() {
		if (this.cachedBoard.width === this.canvas.width && this.cachedBoard.height === this.canvas.height) {
			if (this.cachedBoard.isImageLoaded || !GobanView.boardImage.complete) return;
		}
		console.log('regenerating bkg');
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		const canvasWidth = canvas.width = this.canvas.width;
		const canvasHeight = canvas.height = this.canvas.height;
		const cellSize = canvasWidth / this.width;

		ctx.lineWidth = 2;
		ctx.lineCap = 'square';
		ctx.fillStyle = "#cb9433";
		ctx.strokeStyle = '#000000';

		// Display board
		if (GobanView.boardImage.complete) {
			ctx.drawImage(GobanView.boardImage, 0, 0, canvasWidth, canvasHeight);
		} else {
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		}

		// Cut board
		for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) if (!this.board[x]?.[y]) ctx.clearRect(cellSize * x - 1, cellSize * y - 1, cellSize + 2, cellSize + 2);

		// Display lines
		for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
			if (!this.board[x]?.[y]) continue;
			ctx.moveTo(cellSize * (x + .5), cellSize * (y + .5));
			ctx.lineTo(cellSize * (x + .5), cellSize * (y + .5));
			if (this.board[x - 1]?.[y]) {
				ctx.moveTo(cellSize * (x + .5), cellSize * (y + .5));
				ctx.lineTo(cellSize * (x - .5), cellSize * (y + .5));
			}
			if (this.board[x + 1]?.[y]) {
				ctx.moveTo(cellSize * (x + .5), cellSize * (y + .5));
				ctx.lineTo(cellSize * (x + 1.5), cellSize * (y + .5));
			}
			if (this.board[x]?.[y - 1]) {
				ctx.moveTo(cellSize * (x + .5), cellSize * (y + .5));
				ctx.lineTo(cellSize * (x + .5), cellSize * (y - .5));
			}
			if (this.board[x]?.[y + 1]) {
				ctx.moveTo(cellSize * (x + .5), cellSize * (y + .5));
				ctx.lineTo(cellSize * (x + .5), cellSize * (y + 1.5));
			}
		}
		ctx.stroke();

		this.cachedBoard = {
			canvas: canvas, width: canvasWidth, height: canvasHeight, isImageLoaded: GobanView.boardImage.complete
		};
	}

	display(showEstimate = false, colors, estimate, canPlace, currentPlayerColor) {
		const {
			/** @type {CanvasRenderingContext2D}*/
			ctx, /** @type {HTMLCanvasElement}*/
			canvas
		} = this;

		canvas.style.setProperty('aspect-ratio', `${this.width / this.height}`);
		canvas.clientWidth;

		const canvasWidth = canvas.width;
		const canvasHeight = canvas.height;
		const cellSize = canvasWidth / this.width;

		this.cacheGobanBackground(this);

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		ctx.drawImage(this.cachedBoard.canvas, 0, 0);

		for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
			const [drawX, drawY, drawSize] = [x + .025, y + .025, .95].map(i => ~~(i * cellSize));

			let color = colors[x]?.[y];
			if (Color.isPlayer(color)) {
				ctx.drawImage(GobanView.getImageForColor(color), drawX, drawY, drawSize, drawSize);
			} else {
				if (canPlace[x]?.[y] && this.hovered[0] === x && this.hovered[1] === y) {
					ctx.globalAlpha = 0.7;
					ctx.drawImage(GobanView.getImageForColor(currentPlayerColor), drawX, drawY, drawSize, drawSize);
					ctx.globalAlpha = 1.0;
				} else if (showEstimate) {
					const e = .2 * (1 + Math.pow(1.2, -Math.abs(estimate[x]?.[y])));
					const [squareX, squareY, squareSize] = [x + e, y + e, 1 - 2 * e].map(i => ~~(i * cellSize));
					if (estimate[x]?.[y] > 0) {
						ctx.fillStyle = '#000';
						ctx.fillRect(squareX, squareY, squareSize, squareSize);
					}
					if (estimate[x]?.[y] < 0) {
						ctx.fillStyle = '#fff';
						ctx.fillRect(squareX, squareY, squareSize, squareSize);
					}
				}
			}
		}
	}
}

const gameCode = window.location.href.match(/(?<=play\?code=)[A-Z0-9]{5}/)?.[0];

document.querySelector('title').innerText = `Goban Explorer | Board ${gameCode}`;
document.getElementById('game-code-display').dataset.gameCode = gameCode;

const socket = io.connect('/game');
const canvas = document.getElementById('goban');

socket.on('create-board', data => {
	const { width, height, size, boardTemplate } = data;
	const gobanView = new GobanView(canvas, width, height, size, boardTemplate);

	/**
	 * @type {{
	 *     stones: StoneColor[][],
	 *     allowedPlacements: boolean[][],
	 *     currentColor: StoneColor,
	 *     whiteCaptures: number,
	 *     blackCaptures: number,
	 *     currentMove: number,
	 *     estimate: number[][]
	 * }}
	 */

	let currData = data;

	console.log(gobanView, currData);

	socket.on('update-state', data => {
		currData = data;
		console.log(currData);
		updateDisplay();
	});


	function toPos(clientX, clientY) {
		const x = ~~((clientX - canvas.getBoundingClientRect().left) / canvas.width * gobanView.width);
		const y = ~~((clientY - canvas.getBoundingClientRect().top) / canvas.height * gobanView.height);
		return [x, y];
	}

	canvas.addEventListener('mouseleave', _ => gobanView.hovered = [-1, -1]);
	canvas.addEventListener('mousemove', ({ clientX, clientY }) => {
		const [x, y] = toPos(clientX, clientY)
		gobanView.hovered = [x, y];
	})

	function updateDisplay() {
		let historyPointer = currData.currentMove;
		document.getElementById('move-display').innerText = `${historyPointer} move${historyPointer === 1 ? '' : 's'} made`;
		document.getElementById('turn-display').innerText = `${currData.currentColor === Color.BLACK ? 'Black' : 'White'}'s turn`;
		document.querySelectorAll('.black-captures-display').forEach(i => i.innerText = `${currData.blackCaptures} captures`)
		document.querySelectorAll('.white-captures-display').forEach(i => i.innerText = `${currData.whiteCaptures} captures`)
	}

	updateDisplay();

	canvas.addEventListener('touchmove', (e) => {
		const { touches: [{ clientX, clientY }] } = e;
		const [x, y] = toPos(clientX, clientY)
		if (boardTemplate[x]?.[y]) e.preventDefault();
		gobanView.hovered = [x, y];
	})

	canvas.addEventListener('mousedown', ({ clientX, clientY }) => {
		const [x, y] = toPos(clientX, clientY)
		gobanView.hovered = [x, y];
		if (currData.allowedPlacements[x]?.[y]) {
			socket.emit('place', { x: x, y: y });
		}
	});
	canvas.addEventListener('touchend', ({ changedTouches: [{ clientX, clientY }] }) => {
		const [x, y] = toPos(clientX, clientY)
		gobanView.hovered = [x, y];
		if (currData.allowedPlacements[x]?.[y]) {
			socket.emit('place', { x: x, y: y });
		}
	});

	let shouldDisplayTerritory = true;


	document.getElementById('undo-button').addEventListener('click', _ => socket.emit('undo'));
	document.getElementById('redo-button').addEventListener('click', _ => socket.emit('redo'));
	document.getElementById('undo-many-button').addEventListener('click', _ => socket.emit('undo-many'));
	document.getElementById('redo-many-button').addEventListener('click', _ => socket.emit('redo-many'));
	document.getElementById('pass-button').addEventListener('click', _ => socket.emit('pass'));


	(function frame() {
		const { stones, allowedPlacements, currentColor, estimate } = currData;

		gobanView.display(shouldDisplayTerritory, stones, estimate, allowedPlacements, currentColor);

		requestAnimationFrame(frame);
	})();
})
