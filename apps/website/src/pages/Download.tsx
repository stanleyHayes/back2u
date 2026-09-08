import { Box, Stack, Typography } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

import { PageShell } from '../components/PageShell';
import { AppStoreBadges } from '../components/AppStoreBadges';

const INK = '#2E3D2F';
const PAPER = '#F2EFEA';

const PERKS = [
  {
    title: 'Snap on the go',
    label: 'Capture',
    icon: PhotoCameraOutlinedIcon,
    body: 'Add a photo and report a lost or found item, wherever you are.',
  },
  {
    title: 'Instant alerts',
    label: 'Stay updated',
    icon: NotificationsActiveOutlinedIcon,
    body: 'Get notified when a possible match is reported near you.',
  },
  {
    title: 'Anonymous chat',
    label: 'Connect privately',
    icon: ForumOutlinedIcon,
    body: 'Arrange a hand-off in the app without sharing your phone number.',
  },
];

export function Download() {
  return (
    <PageShell maxWidth="md">
      <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
        <Typography component="span" className="b2u-eyebrow" sx={{ justifyContent: 'center' }}>
          Get the app
        </Typography>
        <Typography
          className="b2u-display"
          component="h1"
          sx={{ mt: 2, fontSize: { xs: 38, md: 56 }, fontWeight: 600, color: 'text.primary' }}
        >
          bak2me in your pocket
        </Typography>
        <Typography sx={{ mt: 2.5, color: 'text.secondary', fontSize: 18, lineHeight: 1.7 }}>
          Lost &amp; found happens on the move — in taxis, on campuses, at the mall. The mobile app
          keeps reunions one tap away.
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <AppStoreBadges />
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
            boxShadow: '0 40px 80px -40px rgba(46,61,47,.6)',
            border: '8px solid #243024',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(20rem 16rem at 80% 110%, rgba(139,111,78,0.3), transparent 60%), radial-gradient(18rem 14rem at 10% -10%, rgba(126,154,130,0.32), transparent 60%)',
            }}
          />
          <Stack
            sx={{
              position: 'relative',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            spacing={1.5}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50% 50% 50% 8px',
                background: 'linear-gradient(150deg, #40614A, #7E9A82)',
                transform: 'rotate(-45deg)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: PAPER,
                  transform: 'rotate(45deg)',
                }}
              />
            </Box>
            <Typography
              className="b2u-display"
              sx={{ color: PAPER, fontSize: 22, fontWeight: 600 }}
            >
              bak2me
            </Typography>
            <Typography sx={{ color: 'rgba(250,248,243,0.7)', fontSize: 13 }}>
              Reunite. Repeat.
            </Typography>
          </Stack>
        </Box>
      </Box>
      <Box component="section" aria-label="App features" sx={{ mt: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {PERKS.map(({ title, label, icon: Icon, body }) => (
            <Box
              component="article"
              key={title}
              sx={{
                p: { xs: 3, sm: 2.5, md: 3 },
                borderRadius: '24px',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: (t) =>
                  t.palette.mode === 'dark' ? 'rgba(210,232,222,.045)' : 'rgba(255,255,255,.6)',
                boxShadow: (t) =>
                  t.palette.mode === 'dark'
                    ? '8px 8px 20px #131912, -6px -6px 18px #273026'
                    : '8px 8px 20px #dcd9d4, -6px -6px 18px #ffffff',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '18px',
                    color: 'primary.main',
                    boxShadow: (t) =>
                      t.palette.mode === 'dark'
                        ? 'inset 4px 4px 9px #121811, inset -4px -4px 9px #2a3428'
                        : 'inset 4px 4px 9px #dcd9d4, inset -4px -4px 9px #ffffff',
                  }}
                >
                  <Icon sx={{ fontSize: 26 }} />
                </Box>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '.04em',
                  }}
                >
                  {label}
                </Typography>
              </Stack>
              <Typography
                component="h2"
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: { xs: 22, sm: 20, md: 22 },
                  fontWeight: 600,
                  letterSpacing: '-.025em',
                  color: 'text.primary',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{ mt: 1.25, color: 'text.secondary', fontSize: 14, lineHeight: 1.75 }}
              >
                {body}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </PageShell>
  );
}
