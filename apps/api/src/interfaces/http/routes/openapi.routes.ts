import { Router } from 'express';

import { openApiSpec } from '../openapi.js';

export function openApiRouter(): Router {
  const r = Router();

  r.get('/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  return r;
}
