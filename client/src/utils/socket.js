import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Match backend port

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket']
});
