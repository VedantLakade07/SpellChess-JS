import { io } from 'socket.io-client';

// Establish socket connection URL
const SOCKET_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:5000'
  : `${window.location.protocol}//${window.location.hostname}:5000`;

export const socket = io(SOCKET_URL, {
  autoConnect: false
});
