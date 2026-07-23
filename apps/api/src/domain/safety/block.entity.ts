import type { Id } from '../shared/id.js';

export interface BlockSnapshot {
  id: Id;
  blockerId: Id;
  blockedId: Id;
  createdAt: Date;
}

export class Block {
  private constructor(private state: BlockSnapshot) {}
  static rehydrate(s: BlockSnapshot): Block {
    return new Block({ ...s });
  }
  static create(input: { id: Id; blockerId: Id; blockedId: Id }): Block {
    return new Block({ ...input, createdAt: new Date() });
  }
  get snapshot(): BlockSnapshot {
    return { ...this.state };
  }
}
