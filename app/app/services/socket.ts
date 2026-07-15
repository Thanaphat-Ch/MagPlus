import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connSocket = (url: string) => {
  if (!socket) {
    socket = io(url, { transports: ['websocket']});

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket() first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
