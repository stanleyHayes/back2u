import { Box, Stack, Typography } from '@mui/material';

import { PageShell } from '../components/PageShell';
import { AppStoreBadges } from '../components/AppStoreBadges';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';

const PERKS = [
  { title: 'Snap on the go', body: 'Report a lost or found item in 30 seconds, wherever you are.' },
  { title: 'Instant alerts', body: 'Get a push the moment a likely match is reported near you.' },
  { title: 'Anonymous chat', body: 'Coordinate a hand-off without sharing your number.' },
];

export function Download() {
  return (
    <PageShell maxWidth="md">
      <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
        <Typography component="span" className="b2u-eyebrow" sx={{ justifyContent: 'center' }}>
          Get the app
        </Typography>
        <Typography className="b2u-display" component="h1" sx={{ mt: 2, fontSize: { xs: 38, md: 56 }, fontWeight: 600, color: INK }}>
          Back2u in your pocket
        </Typography>
        <Typography sx={{ mt: 2.5, color: 'text.secondary', fontSize: 18, lineHeight: 1.7 }}>
          Lost &amp; found happens on the move — in taxis, on campuses, at the mall. The mobile app keeps
          reunions one tap away.
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <AppStoreBadges tone="dark" />
        </Box>

        {/* Phone mock */}
        <Box
          sx={{
            mt: 7,
            mx: 'auto',
            width: 248,
            height: 320,
            borderRadius: 6,
            bgcolor: INK,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 40px 80px -40px rgba(11,61,56,.6)',
            border: '8px solid #0a322e',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(20rem 16rem at 80% 110%, rgba(224,161,6,0.3), transparent 60%), radial-gradient(18rem 14rem at 10% -10%, rgba(20,184,166,0.32), transparent 60%)',
            }}
          />
          <Stack sx={{ position: 'relative', height: '100%' }} justifyContent="center" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50% 50% 50% 8px',
                background: 'linear-gradient(150deg, #0F766E, #14B8A6)',
                transform: 'rotate(-45deg)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: PAPER, transform: 'rotate(45deg)' }} />
            </Box>
            <Typography className="b2u-display" sx={{ color: PAPER, fontSize: 22, fontWeight: 600 }}>
              Back2u
            </Typography>
            <Typography sx={{ color: 'rgba(255,253,248,0.7)', fontSize: 13 }}>Reunite. Repeat.</Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            mt: 7,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3,
            textAlign: 'left',
          }}
        >
          {PERKS.map((p) => (
            <Box key={p.title}>
              <Typography className="b2u-display" sx={{ fontSize: 18, fontWeight: 600, color: INK }}>
                {p.title}
              </Typography>
              <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 15 }}>{p.body}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </PageShell>
  );
}
