import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import { GetMessagesUseCase, ListThreadsUseCase } from '../../../application/use-cases/chat/list-threads.js';
import { MarkMessageReadUseCase } from '../../../application/use-cases/chat/mark-message-read.js';
import { PostMessageUseCase } from '../../../application/use-cases/chat/post-message.js';
import { SendTypingUseCase } from '../../../application/use-cases/chat/send-typing.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from './_helpers.js';

const PostMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  images: z.array(z.object({ url: z.string().url() })).max(3).optional(),
});

const TypingSchema = z.object({
  typing: z.boolean(),
});

export const chatRouter = (c: Container): Router => {
  const r = Router();

  r.get('/threads', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(ListThreadsUseCase).execute(req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/threads/:id/messages', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c.get(GetMessagesUseCase).execute(req.auth!.sub, req.params.id as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/threads/:id/messages', requireAuth(c), async (req, res, next) => {
    try {
      const input = PostMessageSchema.parse(req.body);
      const data = await c.get(PostMessageUseCase).execute(req.auth!.sub, {
        threadId: req.params.id as string,
        body: input.body,
        images: input.images,
      });
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/threads/:threadId/messages/:messageId/read', requireAuth(c), async (req, res, next) => {
    try {
      const data = await c
        .get(MarkMessageReadUseCase)
        .execute(req.auth!.sub, req.params.threadId as string, req.params.messageId as string);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/threads/:id/typing', requireAuth(c), async (req, res, next) => {
    try {
      const input = TypingSchema.parse(req.body);
      const data = await c.get(SendTypingUseCase).execute(req.auth!.sub, req.params.id as string, input.typing);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
