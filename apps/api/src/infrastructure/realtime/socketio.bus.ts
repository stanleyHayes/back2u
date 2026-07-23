import { injectable } from 'inversify';
import type { Server as SocketServer } from 'socket.io';

import type { IRealtimeBus } from '../../application/ports/services.js';

@injectable()
export class SocketIoBus implements IRealtimeBus {
  private io: SocketServer | null = null;

  attach(io: SocketServer) {
    this.io = io;
  }
  publishToUser(userId: string, event: string, payload: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, payload);
  }
  publishToThread(threadId: string, event: string, payload: unknown): void {
    this.io?.to(`thread:${threadId}`).emit(event, payload);
  }
}
