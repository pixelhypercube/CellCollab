const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');
const gameSocket = require('./sockets/gameSocket.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
    },
});

app.use(cors());
app.get('/', (req, res) => {
    res.send('CellCollab Server Running!');
});

gameSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));