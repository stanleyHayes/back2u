import { io, type Socket } from 'socket.io-client';

import { useAuth } from './auth.store.js';

let socket: Socket | null = null;
let socketToken: string | null = null;

function createSocket(token: string): Socket {
  return io(import.meta.env.VITE_API_URL ?? 'http://localhost:4000', {
    autoConnect: true,
    auth: { token },
    transports: ['websocket'],
  });
}

export function getSocket(): Socket {
  const token = useAuth.getState().accessToken;
  // Recreate the connection when the session changed (login/logout/silent refresh)
  // so the socket never authenticates with a stale token.
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socket = createSocket(token ?? '');
  socketToken = token;
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
