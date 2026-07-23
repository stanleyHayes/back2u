import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useQuery } from '@tanstack/react-query';
import type { LeaderboardEntryDTO } from '@back2u/shared-types';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const DISPLAY = '"Fraunces", Georgia, serif';
const INK = '#0B3D38';
const PAPER = '#FBF6EC';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const CLAY = '#C2410C';

const MEDAL = [MARIGOLD, TEAL, CLAY];

function Badges({ badges }: { badges: string[] }) {
  if (!badges?.length) return null;
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
      useFlexGap
    >
      {badges.map((b) => (
        <Chip
          key={b}
          label={b.replace(/_/g, ' ')}
          size="small"
          sx={{
            bgcolor: 'rgba(224,161,6,0.14)',
            color: '#8a6300',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        />
      ))}
    </Stack>
  );
}

function PodiumCard({ e, place }: { e: LeaderboardEntryDTO; place: number }) {
  const color = MEDAL[place] ?? TEAL;
  const isFirst = place === 0;
  return (
    <Box
      sx={{
        flex: 1,
        order: { xs: place, md: place === 0 ? 1 : place === 1 ? 0 : 2 },
        mt: { md: isFirst ? 0 : 5 },
        p: 3,
        textAlign: 'center',
        borderRadius: '28px 28px 28px 8px',
        bgcolor: isFirst ? INK : 'background.paper',
        color: isFirst ? PAPER : 'text.primary',
        border: '1px solid',
        borderColor: isFirst ? 'transparent' : 'divider',
        boxShadow: isFirst ? '0 30px 60px -34px rgba(11,61,56,.6)' : '0 1px 2px rgba(11,61,56,.05)',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 34,
          height: 34,
          borderRadius: '50%',
          bgcolor: color,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          boxShadow: '0 8px 16px -8px rgba(0,0,0,.4)',
        }}
      >
        {place + 1}
      </Box>
      <Avatar
        src={e.avatarUrl}
        sx={{
          width: isFirst ? 80 : 64,
          height: isFirst ? 80 : 64,
          mx: 'auto',
          mt: 1,
          mb: 1.5,
          border: `3px solid ${color}`,
        }}
      >
        {e.name[0]}
      </Avatar>
      <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: isFirst ? 24 : 20 }}>
        {e.name}
      </Typography>
      <Typography
        sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: isFirst ? 36 : 30, color, mt: 0.5 }}
      >
        {e.pointsBalance.toLocaleString()}
      </Typography>
      <Typography
        sx={{
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.7,
          mb: 1.5,
        }}
      >
        points · {e.successfulReturns} returns
      </Typography>
      <Badges badges={e.badges} />
    </Box>
  );
}

export function LeaderboardPage() {
  const { data } = useQuery({ queryKey: ['leaderboard'], queryFn: () => api.getLeaderboard(50) });
  const top = (data ?? []).slice(0, 3);
  const rest = (data ?? []).slice(3);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', color: TEAL, mb: 1 }}>
        <EmojiEventsIcon fontSize="small" />
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Hall of finders
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: { xs: 34, md: 44 },
          color: INK,
          letterSpacing: '-0.02em',
        }}
      >
        Top finders
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Ranked by reward points and successful returns. Earn the <b>Hero Finder</b> badge at 5
        returns and <b>Trusted Guardian</b> at 25.
      </Typography>

      {/* Podium */}
      {top.length > 0 && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2.5}
          sx={{ alignItems: { md: 'flex-start' }, mb: 4 }}
        >
          {top.map((e, i) => (
            <PodiumCard key={e.userId} e={e} place={i} />
          ))}
        </Stack>
      )}

      {/* Ranked list */}
      <Stack spacing={1}>
        {rest.map((e) => (
          <Box
            key={e.userId}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'transform .15s',
              '&:hover': { transform: 'translateX(3px)' },
            }}
          >
            <Typography
              sx={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 20,
                color: 'text.secondary',
                minWidth: 36,
                textAlign: 'center',
              }}
            >
              {e.rank}
            </Typography>
            <Avatar src={e.avatarUrl}>{e.name[0]}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {e.name}
              </Typography>
              {e.badges?.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.25, flexWrap: 'wrap' }} useFlexGap>
                  {e.badges.map((b) => (
                    <Chip
                      key={b}
                      label={b.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: 11, textTransform: 'capitalize' }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
            <Stack sx={{ alignItems: 'flex-end' }}>
              <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: INK }}>
                {e.pointsBalance.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {e.successfulReturns} returns
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>

      {!data && <ListSkeleton rows={6} />}
      {data && data.length === 0 && (
        <EmptyState
          tone="marigold"
          icon={<EmojiEventsIcon />}
          title="No finders ranked yet"
          description="Return a found item to earn reward points and claim the very first spot on the board."
        />
      )}
    </Box>
  );
}
