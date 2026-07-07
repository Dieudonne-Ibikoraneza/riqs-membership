import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (socket) return socket;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : null;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') 
    : 'http://localhost:5000';

  socket = io(backendUrl, {
    auth: {
      token
    },
    autoConnect: false // We connect manually when needed
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from server');
  });

  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
