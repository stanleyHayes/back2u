import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';

import {
  AcceptCustodyUseCase,
  IssueReleaseCodeUseCase,
  ListCustodyAtLocationUseCase,
  ReleaseCustodyUseCase,
} from '../../../application/use-cases/custody/custody.use-cases.js';
import {
  AddPartnerStaffUseCase,
  CreatePartnerLocationUseCase,
  DeactivatePartnerLocationUseCase,
  GetPartnerTrustSummaryUseCase,
  ListPartnerLocationsUseCase,
  ListPartnerStaffUseCase,
  RemovePartnerStaffUseCase,
} from '../../../application/use-cases/custody/partner-network.use-cases.js';
import {
  GetRecoveryCaseUseCase,
  ListInstitutionRecoveryCasesUseCase,
  ListMyRecoveryCasesUseCase,
} from '../../../application/use-cases/custody/recovery-case.use-cases.js';
import { ForbiddenError } from '../../../domain/shared/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok, param, parsePagination } from './_helpers.js';

const PointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

const PlaceSchema = z.object({
  name: z.string().min(1).max(160),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  point: PointSchema,
});

const CreateLocationSchema = z.object({
  name: z.string().min(2).max(160),
  place: PlaceSchema,
  storageDescription: z.string().max(500).optional(),
});

const AddStaffSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['agent', 'supervisor', 'manager']),
  locationId: z.string().min(1).optional(),
});

const AcceptCustodySchema = z.object({
  itemId: z.string().min(1),
  locationId: z.string().min(1),
  depositedByUserId: z.string().min(1),
  condition: z.enum(['new', 'good', 'fair', 'poor', 'damaged']),
  declaredContents: z.array(z.string().max(200)).max(50).optional(),
  storageBin: z.string().max(80).optional(),
  intakePhotos: z.array(z.string().url()).max(12).optional(),
});

const IssueCodeSchema = z.object({ claimantId: z.string().min(1) });

const ReleaseSchema = z.object({
  claimantId: z.string().min(1),
  releaseCode: z.string().min(4).max(12),
  note: z.string().max(500).optional(),
});

const CaseStatusSchema = z
  .enum([
    'found',
    'deposited',
    'matched',
    'claim_submitted',
    'ownership_verified',
    'released',
    'returned',
    'closed',
    'cancelled',
  ])
  .optional();

const CustodyStatusSchema = z.enum(['held', 'released', 'transferred', 'disposed']).optional();

/** The organisation the caller acts for; every custody route is scoped to it. */
function callerInstitution(req: { auth?: { institutionId?: string } }): string {
  const institutionId = req.auth?.institutionId;
  if (!institutionId) {
    throw new ForbiddenError('Your account is not linked to a partner organisation');
  }
  return institutionId;
}

/**
 * Recovery Point operations (spec §10) and the chain-of-custody read (§9).
 *
 * Every route here is scoped to the caller's own organisation — the id never
 * comes from the URL — so one partner can never read or act on another's
 * property.
 */
export const custodyRouter = (c: Container): Router => {
  const r = Router();
  const partner = [requireAuth(c), requireRole('partner_admin', 'admin', 'super_admin')] as const;

  // ── Recovery Points ──────────────────────────────────────────────────────
  r.get('/locations', ...partner, async (req, res, next) => {
    try {
      ok(res, await c.get(ListPartnerLocationsUseCase).execute(callerInstitution(req)));
    } catch (e) {
      next(e);
    }
  });

  r.post('/locations', ...partner, async (req, res, next) => {
    try {
      const input = CreateLocationSchema.parse(req.body);
      const data = await c
        .get(CreatePartnerLocationUseCase)
        .execute(callerInstitution(req), input, req.auth!.sub);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/locations/:id', ...partner, async (req, res, next) => {
    try {
      const data = await c
        .get(DeactivatePartnerLocationUseCase)
        .execute(callerInstitution(req), param(req, 'id'), req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/locations/:id/custody', ...partner, async (req, res, next) => {
    try {
      const { pageSize, skip } = parsePagination(req, 25, 100);
      const data = await c.get(ListCustodyAtLocationUseCase).execute({
        actorUserId: req.auth!.sub,
        institutionId: callerInstitution(req),
        locationId: param(req, 'id'),
        status: CustodyStatusSchema.parse(req.query.status),
        limit: pageSize,
        skip,
      });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  // ── Staff ────────────────────────────────────────────────────────────────
  r.get('/staff', ...partner, async (req, res, next) => {
    try {
      ok(res, await c.get(ListPartnerStaffUseCase).execute(callerInstitution(req)));
    } catch (e) {
      next(e);
    }
  });

  r.post('/staff', ...partner, async (req, res, next) => {
    try {
      const input = AddStaffSchema.parse(req.body);
      const data = await c
        .get(AddPartnerStaffUseCase)
        .execute(callerInstitution(req), input, req.auth!.sub);
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.delete('/staff/:id', ...partner, async (req, res, next) => {
    try {
      const data = await c
        .get(RemovePartnerStaffUseCase)
        .execute(callerInstitution(req), param(req, 'id'), req.auth!.sub);
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  // ── Custody ──────────────────────────────────────────────────────────────
  r.post('/custody', ...partner, async (req, res, next) => {
    try {
      const body = AcceptCustodySchema.parse(req.body);
      const data = await c.get(AcceptCustodyUseCase).execute({
        actorUserId: req.auth!.sub,
        institutionId: callerInstitution(req),
        body,
      });
      ok(res, data, 201);
    } catch (e) {
      next(e);
    }
  });

  r.post('/custody/:id/release-code', ...partner, async (req, res, next) => {
    try {
      const { claimantId } = IssueCodeSchema.parse(req.body);
      const data = await c.get(IssueReleaseCodeUseCase).execute({
        actorUserId: req.auth!.sub,
        institutionId: callerInstitution(req),
        custodyRecordId: param(req, 'id'),
        claimantId,
      });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.post('/custody/:id/release', ...partner, async (req, res, next) => {
    try {
      const body = ReleaseSchema.parse(req.body);
      const data = await c.get(ReleaseCustodyUseCase).execute({
        actorUserId: req.auth!.sub,
        institutionId: callerInstitution(req),
        custodyRecordId: param(req, 'id'),
        body,
      });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  // ── Cases ────────────────────────────────────────────────────────────────
  r.get('/cases', ...partner, async (req, res, next) => {
    try {
      const { pageSize, skip } = parsePagination(req, 25, 100);
      const data = await c
        .get(ListInstitutionRecoveryCasesUseCase)
        .execute(callerInstitution(req), {
          status: CaseStatusSchema.parse(req.query.status),
          limit: pageSize,
          skip,
        });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  r.get('/trust', ...partner, async (req, res, next) => {
    try {
      ok(res, await c.get(GetPartnerTrustSummaryUseCase).execute(callerInstitution(req)));
    } catch (e) {
      next(e);
    }
  });

  return r;
};

/** The chain-of-custody view for the people a recovery actually belongs to. */
export const recoveryRouter = (c: Container): Router => {
  const r = Router();

  r.get('/mine', requireAuth(c), async (req, res, next) => {
    try {
      ok(res, await c.get(ListMyRecoveryCasesUseCase).execute(req.auth!.sub));
    } catch (e) {
      next(e);
    }
  });

  r.get('/:id', requireAuth(c), async (req, res, next) => {
    try {
      const isAdmin = req.auth!.roles.some((role) => role === 'admin' || role === 'super_admin');
      const data = await c
        .get(GetRecoveryCaseUseCase)
        .execute(param(req, 'id'), { userId: req.auth!.sub, isAdmin });
      ok(res, data);
    } catch (e) {
      next(e);
    }
  });

  return r;
};
