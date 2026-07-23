import type { Server as HttpServer } from 'node:http';

import type { Container } from 'inversify';
import { Server as SocketServer } from 'socket.io';

import type { Env } from '../../config/env.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { IThreadRepository } from '../../application/ports/repositories.js';
import type { ITokenService } from '../../application/ports/services.js';
import { SocketIoBus } from '../../infrastructure/realtime/socketio.bus.js';

export function attachSocketIo(httpServer: HttpServer, c: Container): SocketServer {
  const env = c.get<Env>(TOKENS.Env);
  const tokens = c.get<ITokenService>(TOKENS.TokenService);
  const threads = c.get<IThreadRepository>(TOKENS.ThreadRepository);

  const io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()), credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('unauthorized'));
      const claims = tokens.verifyAccess(token);
      socket.data.userId = claims.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    socket.on('thread:join', (threadId: string) => {
      void (async () => {
        try {
          const thread = await threads.findById(threadId);
          // Only participants may subscribe to a thread's room.
          if (!thread || !thread.hasParticipant(userId)) return;
          socket.join(`thread:${threadId}`);
        } catch {
          // Ignore lookup failures: never join on error.
        }
      })();
    });
    socket.on('thread:leave', (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });
  });

  c.get(SocketIoBus).attach(io);
  return io;
}
