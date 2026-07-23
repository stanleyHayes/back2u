import { injectable } from 'inversify';

import type { IMessageRepository, IThreadRepository } from '../../../../application/ports/repositories.js';
import { Message, type MessageSnapshot } from '../../../../domain/chat/message.entity.js';
import { Thread, type ThreadSnapshot } from '../../../../domain/chat/thread.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  MessageModel,
  ThreadModel,
  type MessageDoc,
  type ThreadDoc,
} from '../models/chat.model.js';

function threadToSnapshot(d: ThreadDoc): ThreadSnapshot {
  const { _id, ...rest } = d;
  return { id: _id, ...rest };
}

function messageToSnapshot(d: MessageDoc): MessageSnapshot {
  const { _id, ...rest } = d;
  return { id: _id, ...rest };
}

@injectable()
export class MongoThreadRepository implements IThreadRepository {
  async save(thread: Thread): Promise<void> {
    const { id, ...rest } = thread.snapshot;
    await ThreadModel.updateOne({ _id: id }, { $set: { _id: id, ...rest } }, { upsert: true });
  }

  async findById(id: Id): Promise<Thread | null> {
    const doc = await ThreadModel.findById(id).lean<ThreadDoc>();
    return doc ? Thread.rehydrate(threadToSnapshot(doc)) : null;
  }

  async findForUser(userId: Id): Promise<Thread[]> {
    const docs = await ThreadModel.find({ participantIds: userId })
      .sort({ lastMessageAt: -1 })
      .lean<ThreadDoc[]>();
    return docs.map((d) => Thread.rehydrate(threadToSnapshot(d)));
  }

  async findByItemAndParticipants(itemId: Id, participantIds: Id[]): Promise<Thread | null> {
    const doc = await ThreadModel.findOne({
      itemId,
      participantIds: { $all: participantIds, $size: participantIds.length },
    }).lean<ThreadDoc>();
    return doc ? Thread.rehydrate(threadToSnapshot(doc)) : null;
  }
}

@injectable()
export class MongoMessageRepository implements IMessageRepository {
  async save(message: Message): Promise<void> {
    const { id, ...rest } = message.snapshot;
    await MessageModel.updateOne({ _id: id }, { $set: { _id: id, ...rest } }, { upsert: true });
  }

  async findById(id: Id): Promise<Message | null> {
    const doc = await MessageModel.findById(id).lean<MessageDoc>();
    return doc ? Message.rehydrate(messageToSnapshot(doc)) : null;
  }

  async listForThread(threadId: Id, limit = 50): Promise<Message[]> {
    const docs = await MessageModel.find({ threadId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<MessageDoc[]>();
    return docs.reverse().map((d) => Message.rehydrate(messageToSnapshot(d)));
  }

  async markMessageRead(messageId: Id, userId: Id): Promise<void> {
    await MessageModel.updateOne({ _id: messageId }, { $addToSet: { readBy: userId } });
  }
}
