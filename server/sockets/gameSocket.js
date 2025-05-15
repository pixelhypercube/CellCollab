const { gameOfLife, initBoard, resizeBoard } = require("../game/gameEngine.js");

module.exports = function(io) {
    // modules
    const crypto = require("crypto");

    const rooms = {};

    
    const generateRoomId = (socketId) => {
        const timestamp = Date.now().toString();
        const random = crypto.randomBytes(4).toString('hex'); // 8 chars
        const raw = `${socketId}-${timestamp}-${random}`;
        return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 8); // 8-char room ID
    };
    
    const DEFAULT_WIDTH = 100, DEFAULT_HEIGHT = 100;
    const DEFAULT_SPEED = 100; // speed (ms)
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('joinRoom', (roomId) => {
            if (roomId === "" || roomId.length == 0) {
                roomId = generateRoomId(roomId);
                if (!rooms[roomId]) {
                    rooms[roomId] = {
                        board: initBoard(DEFAULT_HEIGHT, DEFAULT_WIDTH, false),
                        isRunning: false,
                        intervalId: null,
                        speed: DEFAULT_SPEED,
                        iterations: 0,
                    };
                }
                let board = rooms[roomId].board;
                const boardHeight = board.length;
                const boardWidth = board[0].length;
                socket.join(roomId);
                socket.emit("roomExists",roomId,true);
                socket.emit("init", rooms[roomId].board);
                socket.emit("status", rooms[roomId].isRunning);
                socket.emit("hashedRoomId", roomId);
                socket.emit("boardDims",boardHeight,boardWidth);
                socket.emit("speed",rooms[roomId].speed);
            }
            else {
                if (!rooms[roomId]) socket.emit("roomExists",roomId,false);
                else {
                    let board = rooms[roomId].board;
                    const boardHeight = board.length;
                    const boardWidth = board[0].length;
                    socket.join(roomId);
                    socket.emit("roomExists",roomId,true);
                    socket.emit("init", rooms[roomId].board);
                    socket.emit("status", rooms[roomId].isRunning);
                    socket.emit("hashedRoomId", roomId);
                    socket.emit("boardDims",boardHeight,boardWidth);
                    socket.emit("speed",rooms[roomId].speed);
                }
            }
        });

        socket.on('joinRoomWithSettings', (roomId, width, height) => {
            if (roomId === "" || roomId.length == 0) {
                roomId = generateRoomId(roomId);
                if (!rooms[roomId]) {
                    rooms[roomId] = {
                        board: initBoard(height, width, false),
                        isRunning: false,
                        intervalId: null,
                        speed: DEFAULT_SPEED,
                        iterations: 0,
                    };
                    let board = rooms[roomId].board;
                    const boardHeight = board.length;
                    const boardWidth = board[0].length;
                    socket.join(roomId);
                    socket.emit("roomExists",roomId,true);
                    socket.emit("init", rooms[roomId].board);
                    socket.emit("status", rooms[roomId].isRunning);
                    socket.emit("hashedRoomId", roomId);
                    socket.emit("boardDims",boardHeight,boardWidth);
                    socket.emit("speed",rooms[roomId].speed);
                    socket.emit("iterations",rooms[roomId].iterations);
                } else {
                    if (rooms[roomId].board) {
                        // check whether to resize board or not
                        let board = rooms[roomId].board;
                        const boardHeight = board.length;
                        const boardWidth = board[0].length;
                        console.log(height,boardHeight,width,boardWidth);
                        if (height != boardHeight || width != boardWidth) {
                            rooms[roomId].board = resizeBoard(height,width,board);
                        }
                        socket.join(roomId);
                        socket.emit("roomExists",roomId,true);
                        socket.emit("init", rooms[roomId].board);
                        socket.emit("status", rooms[roomId].isRunning);
                        socket.emit("hashedRoomId", roomId);
                        socket.emit("boardDims",height,width);
                        socket.emit("speed",rooms[roomId].speed);
                        socket.emit("iterations",rooms[roomId].iterations);
                    }
                }
            }
            else {
                if (!rooms[roomId]) socket.emit("roomExists",roomId,false);
                else {

                    if (rooms[roomId].board) {
                        // check whether to resize board or not
                        let board = rooms[roomId].board;
                        const boardHeight = board.length;
                        const boardWidth = board[0].length;
                        console.log(height,boardHeight,width,boardWidth);
                        if (height != boardHeight || width != boardWidth) {
                            rooms[roomId].board = resizeBoard(height,width,board);
                        }
                        socket.join(roomId);
                        socket.emit("roomExists",roomId,true);
                        socket.emit("init", rooms[roomId].board);
                        socket.emit("status", rooms[roomId].isRunning);
                        socket.emit("hashedRoomId", roomId);
                        socket.emit("boardDims",height,width);
                        socket.emit("speed",rooms[roomId].speed);
                        socket.emit("iterations",rooms[roomId].iterations);
                    }
                }
            } 
        });

        socket.on('toggleRun', (roomId) => {
            if (rooms[roomId]) {
                const room = rooms[roomId];
                room.isRunning = !room.isRunning;
                io.to(roomId).emit("status", room.isRunning);

                if (room.isRunning) {
                    room.intervalId = setInterval(() => {
                        room.board = gameOfLife(room.board);
                        io.to(roomId).emit("update", room.board);
                        io.to(roomId).emit("iterations",++room.iterations);
                    }, rooms[roomId].speed);
                } else {
                    clearInterval(room.intervalId);
                }
            }
        });

        socket.on("stepOnce", (roomId) => {
            if (rooms[roomId]) {
                const room = rooms[roomId];
                room.board = gameOfLife(room.board);
                io.to(roomId).emit('update', room.board);
                io.to(roomId).emit("iterations",++room.iterations);
            }
        });

        socket.on("reset", (roomId) => {
            if (rooms[roomId]) {
                const room = rooms[roomId];
                const { width, height } = room.board[0].length ? { width: room.board[0].length, height: room.board.length } : { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
                room.board = initBoard(height, width, false);
                io.to(roomId).emit("update", room.board);
                io.to(roomId).emit("iterations",0);
            }
        });

        socket.on("updateCell", (roomId, i, j, value) => {
            if (rooms[roomId]) {
                const room = rooms[roomId];
                room.board[i][j] = value;
                io.to(roomId).emit("update", room.board);
                io.to(roomId).emit("iterations",++room.iterations);
            }
        });

        socket.on("updateCellBrush",(roomId,i,j,brush) => {
            if (rooms[roomId]) {
                const room = rooms[roomId];
                for (let x = 0; x < brush.length; x++) {
                    for (let y = 0; y < brush[0].length; y++) {
                        const boardX = i + x;
                        const boardY = j + y;

                        if (boardX >= 0 && boardX < room.board.length && boardY >= 0 && boardY < room.board[0].length) {
                            room.board[boardX][boardY] = brush[x][y];
                        }
                    }
                }
                io.to(roomId).emit("update", room.board);
            }
        });

        socket.on("speed",(roomId,speed)=>{
            if (rooms[roomId]) {
                const room = rooms[roomId];
                room.speed = speed;
        
                if (room.isRunning) {
                    clearInterval(room.intervalId);
                    room.intervalId = setInterval(() => {
                        room.board = gameOfLife(room.board);
                        io.to(roomId).emit("update", room.board);
                        io.to(roomId).emit("iterations",++room.iterations);
                    }, speed);
                }
            }
        });

        socket.on("disconnect", () => {
            console.log("Client Disconnected");
        });
    });
};
