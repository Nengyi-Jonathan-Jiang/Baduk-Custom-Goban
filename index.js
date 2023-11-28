
class Board {
    /** @type {Map<string, Board>}*/
    static openBoards = new Map;
    static generateCode() {
        let res;
        do {
            res = [0,0,0,0,0].map(_ => (~~(Math.random() * 36)).toString(36)).join('').toUpperCase()
        } while(this.openBoards.has(res));
        return res;
    }

    constructor(code, map, komi) {
        this.komi = komi;
        this.code = code;

        const dat = custom_boards[map];
        const {pattern, size, width, height} = dat;
        this.size = size;
        this.width = width;
        this.height = height;
        const arr = pattern.trim().split(/\n/g).map(l => l.trim().split('').map(c => c === 'O'))
        this.goban = new Goban(
            new Array(width).fill(null).map((_, i) =>
                new Array(height).fill(false).map((_, j) =>
                    !!arr[j]?.[i]
                )
            ),
            size, width / height, width, height);

        Board.openBoards.set(code, this);
    }
}


const port = 80;
const path = require("path");
const express = require("express");
const {Goban} = require('./go.server');
const {custom_boards} = require('./res/custom-boards.data');
const app = express();
app.use(express.static(__dirname));
app.use(express.json());

require("socket.io");
let server = require("http").createServer(app);
// noinspection JSValidateTypes
/** @type {Server} */
const io = require("socket.io")(server);

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')))
app.get('/play', (_req, res) => {
    if(Board.openBoards.has(_req.url.match(/(?<=play\?code=)[A-Z0-9]{5}/)?.[0])) {
        res.sendFile(path.join(__dirname, 'play.html'))
    }
    else {
        res.redirect('/');
    }
})

app.post('/create-game', (req, res) => {
    const code = Board.generateCode();
    const {komi, board} = req.body;
    new Board(code, board, komi);
    console.log(`Created new board (map=${board}, komi=${komi}, code=${code})`)
    res.json({code: code});
});

app.post('/join-game', (req, res) => {
    const {code} = req.body;
    if(Board.openBoards.has(code)) res.json({status: 'Good code'});
    else res.json({status: 'Bad code'});
});

const gameSocket = io.of('/game');

gameSocket.on("connection", /** @param {Socket} socket */ function(socket) {
    let code = socket.request.headers.referer.match(/(?<=play\?code=)[A-Z0-9]{5}/)[0];
    let board = Board.openBoards.get(code);
    if(!board) {
        socket.disconnect();
        return;
    }
    socket.join(`room-${code}`)

    const updateAll = () => {
        gameSocket.to(`room-${code}`).emit('update-state', board.goban.getBoardDataJSON());
    }

    socket.emit('create-board', {
        ...board.goban.getBoardInfoJSON(),
        ...board.goban.getBoardDataJSON()
    });

    socket.on("undo", _ => {
        board.goban.undo();
        updateAll();
    });
    socket.on("redo", _ => {
        board.goban.redo();
        updateAll();
    })
    socket.on("undo-many", _ => {
        board.goban.undo(10);
        updateAll();
    })
    socket.on("redo-many", _ => {
        board.goban.redo(10);
        updateAll();
    })
    socket.on("pass", _ => {
        board.goban.pass();
        updateAll();
    })
    socket.on("place", ({x, y}) => {
        try {
            board.goban.place(x, y);
        } catch(e){}
        updateAll();
    })
})




server.listen(port);

console.log("started server");
