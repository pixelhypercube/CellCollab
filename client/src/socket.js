import {io} from "socket.io-client";

var url;
const STATE = 'debug';
if (STATE === 'release') url = 'https://mp-conway-sandbox-5b8c5ee7a59a.herokuapp.com';
else if (STATE === 'debug') url = 'http://localhost:5000';

const socket = io(url);

export default socket;