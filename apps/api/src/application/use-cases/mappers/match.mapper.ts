import type { MatchDTO } from '@back2u/shared-types';

import type { Match } from '../../../domain/match/match.entity.js';

export function toMatchDTO(match: Match): MatchDTO {
  const s = match.snapshot;
  return {
    id: s.id,
    lostItemId: s.lostItemId,
    foundItemId: s.foundItemId,
    score: s.score,
    imageScore: s.imageScore,
    textScore: s.textScore,
    geoScore: s.geoScore,
    timeScore: s.timeScore,
    status: s.status,
    returnConfirmedByLost: s.returnConfirmedByLost,
    returnConfirmedByFound: s.returnConfirmedByFound,
    returnedAt: s.returnedAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}
