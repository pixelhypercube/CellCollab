const { gameOfLife, initBoard, resizeBoard } = require("../game/gameEngine.js");

module.exports = function(io) {
    const rooms = {};
    
    const DEFAULT_WIDTH = 35, DEFAULT_HEIGHT = 25;
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('joinRoom', (roomId) => {
            if (!rooms[roomId]) {
                rooms[roomId] = {
                    board: initBoard(DEFAULT_HEIGHT, DEFAULT_WIDTH, false),
                    isRunning: false,
                    intervalId: null
                };
            }
            socket.join(roomId);
            socket.emit("init", rooms[roomId].board);
            socket.emit("status", rooms[roomId].isRunning);
        });

        socket.on('joinRoomWithSettings', (roomId, width, height) => {
            if (!rooms[roomId]) {
                rooms[roomId] = {
                    board: initBoard(height, width, false),
                    isRunning: false,
                    intervalId: null
                };
            } else {
                if (rooms[roomId].board) {
                    // check whether to resize board or not
                    let board = rooms[roomId].board;
                    const boardHeight = board.length;
                    const boardWidth = board[0].length;
                    if (height != boardHeight || width != boardWidth) {
                        rooms[roomId].board = resizeBoard(height,width,board);
                    }
                }
            }

            socket.join(roomId);
            socket.emit("init", rooms[roomId].board);
            socket.emit("status", rooms[roomId].isRunning);
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
                    }, 100);
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
            }
        });

        socket.on("reset", (roomId) => {
            if (rooms[roomId]) {
                const room = rooms[roomId];
                const { width, height } = room.board[0].length ? { width: room.board[0].length, height: room.board.length } : { width: 25, height: 25 };
                room.board = initBoard(height, width, false);
                io.to(roomId).emit("update", room.board);
            }
        });

        socket.on("updateCell", (roomId, i, j, value) => {
            if (rooms[roomId]) {
                rooms[roomId].board[i][j] = value;
                io.to(roomId).emit("update", rooms[roomId].board);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client Disconnected");
        });
    });
};
