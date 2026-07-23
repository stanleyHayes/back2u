import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import type { ItemDTO, MatchDTO } from '@back2u/shared-types';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const DISPLAY = '"Fraunces", Georgia, serif';
const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const CLAY = '#C2410C';

const pct = (n: number) => Math.round(n * 100);
const scoreColor = (s: number) => (s >= 0.7 ? TEAL : s >= 0.55 ? MARIGOLD : CLAY);

function ConfidenceRing({ score }: { score: number }) {
  const p = pct(score);
  const color = scoreColor(score);
  return (
    <Box
      sx={{
        width: 76,
        height: 76,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        background: `conic-gradient(${color} ${p * 3.6}deg, rgba(11,61,56,0.1) 0deg)`,
      }}
    >
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: 'background.paper',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color }}>{p}%</Typography>
      </Box>
    </Box>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ flex: 1, minWidth: 56 }}>
      <Typography sx={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
        {label}
      </Typography>
      <Box sx={{ height: 5, borderRadius: 3, bgcolor: 'rgba(11,61,56,0.1)', mt: 0.4, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct(value)}%`, height: '100%', bgcolor: scoreColor(value) }} />
      </Box>
    </Box>
  );
}

export function MatchesPage() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();

  const { data: myItems } = useQuery({
    queryKey: ['my-items', user?.id],
    queryFn: () => api.listItems({ pageSize: 50 }),
  });

  const myItemIds = (myItems?.items ?? []).filter((i) => i.postedById === user?.id);

  const { data: matchGroups, isLoading } = useQuery({
    queryKey: ['my-matches', myItemIds.map((i) => i.id)],
    queryFn: async () => {
      const groups = await Promise.all(
        myItemIds.map(async (it) => ({
          item: it,
          matches: await api.listMatchesForItem(it.id),
        })),
      );
      return groups.filter((g) => g.matches.length > 0);
    },
    enabled: myItemIds.length > 0,
  });

  const accept = useMutation({
    mutationFn: (id: string) => api.acceptMatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-matches'] }),
  });
  const reject = useMutation({
    mutationFn: (id: string) => api.rejectMatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-matches'] }),
  });
  const confirmReturn = useMutation({
    mutationFn: (id: string) => api.confirmItemReturn(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-matches'] }),
  });

  const header = (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ color: TEAL, mb: 1 }}>
        <AutoAwesomeIcon fontSize="small" />
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          AI matching
        </Typography>
      </Stack>
      <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: { xs: 34, md: 44 }, color: INK, letterSpacing: '-0.02em' }}>
        Possible matches
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Ranked by visual, text, location, and time similarity. Accept to start an anonymous chat.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      {header}
      {isLoading && <ListSkeleton rows={3} avatar={false} />}
      {!isLoading && (!matchGroups || matchGroups.length === 0) && (
        <EmptyState
          tone="teal"
          icon={<AutoAwesomeIcon />}
          title="No matches yet"
          description="Our AI is watching. The moment a found item lines up with one of yours, it'll appear here — and we'll notify you."
          actions={[{ label: 'Post an item', href: '/post' }]}
        />
      )}
      <Stack spacing={3}>
        {(matchGroups ?? []).map((g) => (
          <ItemMatches
            key={g.item.id}
            item={g.item}
            matches={g.matches}
            userId={user?.id}
            pending={accept.isPending || reject.isPending || confirmReturn.isPending}
            onAccept={(id) => accept.mutate(id)}
            onReject={(id) => reject.mutate(id)}
            onConfirmReturn={(id) => confirmReturn.mutate(id)}
          />
        ))}
      </Stack>
    </Box>
  );
}

function ItemMatches({
  item,
  matches,
  userId,
  pending,
  onAccept,
  onReject,
  onConfirmReturn,
}: {
  item: ItemDTO;
  matches: MatchDTO[];
  userId?: string;
  pending: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onConfirmReturn: (id: string) => void;
}) {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '24px 24px 24px 8px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <Typography sx={{ mb: 2 }}>
        <Box component="span" sx={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.secondary' }}>
          For your item
        </Box>
        <br />
        <Box component={Link} to={`/items/${item.id}`} sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: INK, textDecoration: 'none', '&:hover': { color: TEAL } }}>
          {item.title}
        </Box>
      </Typography>

      <Stack spacing={1.5}>
        {matches.map((m) => {
          const isReturned = !!m.returnedAt;
          const waitingOnOther =
            (m.returnConfirmedByLost && !m.returnConfirmedByFound) ||
            (!m.returnConfirmedByLost && m.returnConfirmedByFound);
          const userConfirmed =
            m.returnConfirmedByLost === userId || m.returnConfirmedByFound === userId;

          return (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                gap: 2,
                p: 2,
                borderRadius: 3,
                bgcolor: isReturned ? 'rgba(15,118,110,0.06)' : 'rgba(15,118,110,0.04)',
                border: '1px solid',
                borderColor: isReturned ? TEAL : 'divider',
              }}
            >
              <ConfidenceRing score={m.score} />
              <Box flex={1} width="100%">
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  {pct(m.score)}% confidence
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <SubScore label="Image" value={m.imageScore} />
                  <SubScore label="Text" value={m.textScore} />
                  <SubScore label="Geo" value={m.geoScore} />
                  <SubScore label="Time" value={m.timeScore} />
                </Stack>
                {(m.returnConfirmedByLost || m.returnConfirmedByFound) && (
                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                    {m.returnConfirmedByLost && (
                      <Chip size="small" icon={<CheckCircleIcon fontSize="small" />} label="Lost owner confirmed" color="success" variant="outlined" />
                    )}
                    {m.returnConfirmedByFound && (
                      <Chip size="small" icon={<CheckCircleIcon fontSize="small" />} label="Found owner confirmed" color="success" variant="outlined" />
                    )}
                    {waitingOnOther && <Chip size="small" icon={<PendingIcon fontSize="small" />} label="Waiting for other party" color="warning" variant="outlined" />}
                  </Stack>
                )}
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                {m.status === 'suggested' && (
                  <>
                    <Button
                      size="small"
                      disabled={pending}
                      onClick={() => onAccept(m.id)}
                      sx={{ bgcolor: MARIGOLD, color: INK, borderRadius: 999, fontWeight: 700, px: 2, '&:hover': { bgcolor: '#cf9305' } }}
                    >
                      Accept
                    </Button>
                    <Button size="small" disabled={pending} onClick={() => onReject(m.id)} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Reject
                    </Button>
                  </>
                )}
                {m.status === 'accepted' && !isReturned && !userConfirmed && (
                  <Button
                    size="small"
                    disabled={pending}
                    onClick={() => onConfirmReturn(m.id)}
                    sx={{ bgcolor: TEAL, color: '#fff', borderRadius: 999, fontWeight: 700, px: 2, '&:hover': { bgcolor: '#0b5c56' } }}
                  >
                    Confirm return
                  </Button>
                )}
                {m.status === 'accepted' && isReturned && (
                  <Chip size="small" icon={<CheckCircleIcon fontSize="small" />} label="Successfully returned!" color="success" />
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
