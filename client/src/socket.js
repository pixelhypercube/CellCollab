import { io } from "socket.io-client";

var url;
const STATE = 'release';
if (STATE === 'release') url = process.env.APP_API_URL || 'https://cellcollab-server.onrender.com/';
else if (STATE === 'debug') url = 'http://localhost:5000';

const socket = io(url);

export default socket;