const { gameOfLife, initBoard, resizeBoard } = require("../game/gameEngine.js");

module.exports = function(io) {
    // modules
    const crypto = require("crypto");

    const rooms = {};

    
    const generateRoomId = (socketId) => {
        const timestamp = Date.now().toString();
        const random = crypto.randomBytes(4).toString('base64'); // 8 chars
        const raw = `${socketId}-${timestamp}-${random}`;
        return crypto.createHash('sha256').update(raw).digest('base64').slice(0, 8); // 8-char room ID
    };

    const generateRandomUsername = () => {
        const adjectives = ["Quick", "Lazy", "Happy", "Sad", "Angry", "Excited", "Bored"];
        const nouns = ["Fox", "Dog", "Cat", "Bird", "Fish", "Lion", "Tiger"];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${randomAdjective}${randomNoun}${Math.floor(Math.random() * 100)}`;
    }
    
    const DEFAULT_WIDTH = 100, DEFAULT_HEIGHT = 100;
    const DEFAULT_SPEED = 100; // speed (ms)
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('joinRoom', (roomId,username) => {
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

                username = username=="" ? generateRandomUsername() : username;

                // player joined
                if (!rooms[roomId].activePlayers) {
                    rooms[roomId].activePlayers = {};
                }
                rooms[roomId].activePlayers[socket.id] = {
                    username,
                    hoverPosition:null,
                    hoverCells:[]
                };
                io.to(roomId).emit("userJoin",username,rooms[roomId].activePlayers[socket.id]); 
                socket.emit("selfJoined",{
                    playerSocketId:socket.id,
                    // activePlayers:rooms[roomId].activePlayers,
                    username
                });
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

                    // player joined
                    username = username=="" ? generateRandomUsername() : username;

                    if (!rooms[roomId].activePlayers) {
                        rooms[roomId].activePlayers = {};
                    }
                    rooms[roomId].activePlayers[socket.id] = {
                        username,
                        hoverPosition:null,
                        hoverCells:[]
                    };

                    io.to(roomId).emit("userJoin",username,rooms[roomId].activePlayers[socket.id]);
                    socket.emit("selfJoined",{
                        playerSocketId:socket.id,
                        // activePlayers:rooms[roomId].activePlayers[socket.id],
                        username
                    });
                }
            }
        });

        socket.on('joinRoomWithSettings', (roomId, width, height, speed, username) => {
            if (roomId === "" || roomId.length == 0) {
                roomId = generateRoomId(roomId);
                if (!rooms[roomId]) {
                    rooms[roomId] = {
                        board: initBoard(height, width, false),
                        isRunning: false,
                        intervalId: null,
                        speed:speed,
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

                    // player joined
                    username = username=="" ? generateRandomUsername() : username;

                    if (!rooms[roomId].activePlayers) {
                        rooms[roomId].activePlayers = {};
                    }
                    rooms[roomId].activePlayers[socket.id] = {
                        username,
                        hoverPosition:null,
                        hoverCells:[]
                    };
                    io.to(roomId).emit("userJoin",username,rooms[roomId].activePlayers[socket.id]);
                    socket.emit("selfJoined",{
                        playerSocketId:socket.id,
                        // activePlayers:rooms[roomId].activePlayers[socket.id],
                        username
                    });
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
                        socket.emit("speed",speed);
                        socket.emit("iterations",rooms[roomId].iterations);

                        // player joined
                        username = username=="" ? generateRandomUsername() : username;

                        if (!rooms[roomId].activePlayers) {
                            rooms[roomId].activePlayers = {};
                        }
                        rooms[roomId].activePlayers[socket.id] = {
                            username,
                            hoverPosition:null,
                            hoverCells:[]
                        };
                        io.to(roomId).emit("userJoin",username,rooms[roomId].activePlayers[socket.id]);
                        socket.emit("selfJoined",{
                            playerSocketId:socket.id,
                            // activePlayers:rooms[roomId].activePlayers[socket.id],
                            username
                        });
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
                        socket.emit("speed",speed);
                        socket.emit("iterations",rooms[roomId].iterations);

                        // player joined
                        username = username=="" ? generateRandomUsername() : username;

                        if (!rooms[roomId].activePlayers) {
                            rooms[roomId].activePlayers = {};
                        }
                        rooms[roomId].activePlayers[socket.id] = {
                            username,
                            hoverPosition:null,
                            hoverCells:[]
                        };
                        io.to(roomId).emit("userJoin",username,rooms[roomId].activePlayers[socket.id]);
                        socket.emit("selfJoined",{
                            playerSocketId:socket.id,
                            // activePlayers:rooms[roomId].activePlayers[socket.id],
                            username
                        });
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
                room.iterations = 0;
                io.to(roomId).emit("iterations",room.iterations);
            }
        });

        socket.on("hoverCellBrush",(roomId, hoverCells, hoverPosition, socketId)=>{
            if (rooms[roomId]) {
                if (rooms[roomId].activePlayers) {
                    if (rooms[roomId].activePlayers[socketId]) {
                        rooms[roomId].activePlayers[socketId].hoverCells = hoverCells;
                        rooms[roomId].activePlayers[socketId].hoverPosition = hoverPosition;
                        io.in(roomId).emit("updatePlayer",rooms[roomId].activePlayers);
                    }
                }
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
                        const boardY = i + x;
                        const boardX = j + y;

                        if (boardY >= 0 && boardY < room.board.length && boardX >= 0 && boardX < room.board[0].length) {
                            if (room.board[boardY][boardX]==0 && brush[x][y]==1) room.board[boardY][boardX] = 1;
                            else if (room.board[boardY][boardX]==1 && brush[x][y]==1) room.board[boardY][boardX] = 0;
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

                io.to(roomId).emit("speed", speed);
        
                if (room.isRunning) {
                    clearInterval(room.intervalId);
                    room.intervalId = setInterval(() => {
                        room.board = gameOfLife(room.board);
                        io.to(roomId).emit("update", room.board);
                        io.to(roomId).emit("iterations", ++room.iterations);
                    }, speed);
                }
            }
        });

        socket.on("disconnect", (roomId) => {
            if (rooms[roomId]) {
                if (rooms[roomId].activePlayers) {
                    if (rooms[roomId].activePlayers[socket.id]) {
                        delete rooms[roomId].activePlayers[socket.id];
                        const activePlayers = rooms[roomId].activePlayers;
                        const username = activePlayers[socket.id].username;
                        io.to(roomId).emit("userLeave",activePlayers,username);
                    }
                }
            }
            console.log("Client Disconnected",socket.id);
        });
    });
};
