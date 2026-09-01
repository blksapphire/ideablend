import { io } from 'socket.io-client';
import { API_BASE } from './api';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const token = localStorage.getItem('ib_token');
  const url = API_BASE.replace('/api', '');
  socket = io(url, { auth: { token } });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
