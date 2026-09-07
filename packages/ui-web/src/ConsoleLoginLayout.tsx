import type { ReactNode } from 'react';
import { Box, Stack, ThemeProvider, Typography } from '@mui/material';
import { BrandLogo } from './BrandLogo.js';
import { back2uTheme, neuShadow } from './theme.js';

const content = {
  admin: {
    label: 'Admin console',
    eyebrow: 'A little oversight. A lot of reunions.',
    headline: 'Good things find their way back.',
    description:
      'Behind every returned item is a team making it happen. This is your place to keep things moving.',
    tasks: ['Review ownership claims', 'Manage reports & partners', 'Oversee rewards'],
    title: 'Welcome back.',
    subtitle: 'Sign in to your admin workspace.',
    help: 'Access is limited to admin and super-admin accounts. Contact your administrator if you need access.',
    tag: 'Every claim deserves a closer look.',
  },
  partner: {
    label: 'Partner workspace',
    eyebrow: 'Your venue. Their happy ending.',
    headline: 'Lost here. Found with you.',
    description:
      'Turn the things left behind into moments of relief. Bring your lost-and-found desk together in one place.',
    tasks: ['Manage found items', 'Coordinate collections', 'Redeem finder points'],
    title: 'Your desk is ready.',
    subtitle: 'Sign in with your partner account to get started.',
    help: 'For institution staff and couriers. Ask your organisation’s administrator if you need access.',
    tag: 'A small find. A big difference.',
  },
};

/** Shared presentation only: each console owns its authentication and role checks. */
export function ConsoleLoginLayout({
  variant,
  verifying,
  children,
}: {
  variant: keyof typeof content;
  verifying: boolean;
  children: ReactNode;
}) {
  const copy = content[variant];
  const panelSurface = variant === 'admin' ? '#E5EBE1' : '#EEE8DD';
  const panelShadow =
    variant === 'admin'
      ? '6px 6px 12px #C2CCBD, -6px -6px 12px #FFFFFFCC'
      : '6px 6px 12px #CEC5B6, -6px -6px 12px #FFFFFFCC';
  return (
    <ThemeProvider theme={back2uTheme}>
      <Box
        component="main"
        sx={{
          minHeight: '100svh',
          bgcolor: '#F2EFEA',
          color: '#2E3D2F',
          p: { xs: 0, md: 2.5 },
          display: 'flex',
          fontFamily: '"Outfit", sans-serif',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1.08fr 1fr' },
          }}
        >
          <Box
            component="section"
            sx={{
              bgcolor: panelSurface,
              borderRadius: { xs: 0, md: '24px' },
              boxShadow: { xs: '0 6px 14px #C6BFB455', md: neuShadow('light', 'raised') },
              p: { xs: 3, md: 5, lg: 7 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
            >
              <BrandLogo size={36} />
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  bgcolor: panelSurface,
                  boxShadow: panelShadow,
                  px: 1.5,
                  py: 0.7,
                  borderRadius: '30px',
                }}
              >
                {copy.label}
              </Typography>
            </Stack>
            <Box sx={{ mt: { xs: 3, md: 6 }, maxWidth: 540 }}>
              <Typography
                sx={{
                  display: { xs: 'none', md: 'block' },
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  mb: 2.5,
                }}
              >
                {copy.eyebrow}
              </Typography>
              <Typography
                component="h2"
                sx={{
                  // `component` sets the element; the display face has to be
                  // stated because MUI styles from `variant`, not `component`.
                  fontFamily: '"Black Ops One", Georgia, serif',
                  fontSize: { xs: 30, md: 48, lg: 62 },
                  fontWeight: 500,
                  letterSpacing: '-.055em',
                  lineHeight: 1.06,
                  maxWidth: 480,
                }}
              >
                {copy.headline}
              </Typography>
              <Typography
                sx={{
                  display: { xs: 'none', md: 'block' },
                  mt: 2.5,
                  maxWidth: 380,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: '#596353',
                }}
              >
                {copy.description}
              </Typography>
            </Box>
            <Box
              aria-hidden="true"
              sx={{
                display: { xs: 'none', md: 'flex' },
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 245,
                my: 3,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: 210,
                  height: 210,
                  border: '1px solid #2E3D2F20',
                  borderRadius: '50%',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  width: 300,
                  height: 180,
                  border: '1px solid #2E3D2F15',
                  borderRadius: '50%',
                  transform: 'rotate(-30deg)',
                }}
              />
              <Box
                sx={{
                  width: 240,
                  bgcolor: '#F2EFEA',
                  borderRadius: '18px',
                  p: 2.5,
                  transform: 'rotate(-7deg)',
                  boxShadow: '12px 12px 24px #AAB3A277, -10px -10px 22px #FFFFFFB3',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 7,
                    borderRadius: '10px',
                    bgcolor: panelSurface,
                    mx: 'auto',
                    mb: 2.5,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '.16em',
                    color: '#65735E',
                  }}
                >
                  The way back starts here
                </Typography>
                <Typography
                  sx={{ fontSize: 31, fontWeight: 600, letterSpacing: '-.05em', mt: 0.5 }}
                >
                  Lost. Found.
                  <br />
                  Reunited.
                </Typography>
                <Box
                  sx={{
                    borderTop: '1px dashed #B6C1AF',
                    mt: 2,
                    pt: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ fontFamily: '"Black Ops One", serif', fontSize: 15 }}>
                    bak2me
                  </Typography>
                  <Typography sx={{ fontSize: 24, color: '#40614A' }}>↗</Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  ml: 24,
                  mt: 16,
                  width: 50,
                  height: 50,
                  bgcolor: '#40614A',
                  color: '#fff',
                  border: '5px solid',
                  borderColor: variant === 'admin' ? '#E5EBE1' : '#EEE8DD',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 23,
                }}
              >
                ✓
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 2 }}>{copy.tag}</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {copy.tasks.map((task) => (
                  <Typography
                    key={task}
                    sx={{
                      fontSize: 11,
                      color: '#53634E',
                      px: 1.25,
                      py: 0.75,
                      borderRadius: '6px',
                      bgcolor: panelSurface,
                      boxShadow: panelShadow,
                    }}
                  >
                    {task}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Box>
          <Box
            component="section"
            aria-label={copy.label + ' sign-in'}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              px: { xs: 2.5, sm: 6, md: 4, lg: 7 },
              gap: 4,
              py: { xs: 4, md: 3 },
            }}
          >
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                textAlign: 'right',
                color: '#74806E',
                fontSize: 12,
              }}
            >
              Lost &amp; found, connected.
            </Typography>
            <Box
              sx={{
                width: '100%',
                maxWidth: 464,
                boxSizing: 'border-box',
                bgcolor: '#F2EFEA',
                borderRadius: '24px',
                boxShadow: neuShadow('light', 'raised'),
                px: { xs: 2.5, sm: 4 },
                m: 'auto',
                py: { xs: 3, md: 4 },
                '&& .MuiOutlinedInput-root': {
                  bgcolor: '#F2EFEA',
                  borderRadius: '12px',
                  boxShadow: neuShadow('light', 'inset'),
                },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                '& .MuiButton-root': { boxShadow: neuShadow('light', 'raised') },
                '& .MuiButton-root[type="submit"]': {
                  bgcolor: '#40614A',
                  color: '#fff',
                  borderRadius: '10px',
                  minHeight: 52,
                  fontSize: 15,
                  boxShadow:
                    '6px 6px 12px #B6B4A9, -6px -6px 12px #FFFFFFE6, inset 1px 1px 2px #6F8A73',
                  '&:hover': { bgcolor: '#36543F' },
                  '&:active': {
                    boxShadow: 'inset 4px 4px 8px #263B2B, inset -4px -4px 8px #5A7D64',
                  },
                  '&.Mui-disabled': { bgcolor: '#E0E5DC', color: '#687362', boxShadow: 'none' },
                },
                '& .MuiIconButton-root': {
                  bgcolor: '#F2EFEA',
                  boxShadow: '3px 3px 6px #C6BFB499, -3px -3px 6px #FFFFFFCC',
                },
                '& .MuiButtonBase-root:focus-visible': {
                  outline: '3px solid #8B6F4E',
                  outlineOffset: 3,
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: '#F2EFEA',
                  boxShadow: neuShadow('light', 'raised'),
                  display: 'grid',
                  placeItems: 'center',
                  mb: 3,
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  sx={{ width: 23, height: 23 }}
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {variant === 'admin' ? (
                    <path d="M12 3 4 6v6c0 4 8 9 8 9s8-5 8-9V6l-8-3Zm-4 9 3 3 5-6" />
                  ) : (
                    <>
                      <path d="M4 10v10h16V10M3 4h18l1 6H2l1-6ZM9 20v-6h6v6" />
                      <path d="M2 10c0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0" />
                    </>
                  )}
                </Box>
              </Box>
              <Typography
                component="h1"
                sx={{
                  fontFamily: '"Black Ops One", Georgia, serif',
                  fontSize: { xs: 32, lg: 38 },
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: '-.04em',
                }}
              >
                {verifying ? 'One more step.' : copy.title}
              </Typography>
              <Typography sx={{ color: '#65705F', mt: 1.25, mb: 4, fontSize: 15 }}>
                {verifying ? 'Verify your identity to open your workspace.' : copy.subtitle}
              </Typography>
              {children}
              <Box sx={{ mt: 4, pt: 2.5, borderTop: '1px solid #E2E7DD' }}>
                <Typography sx={{ fontSize: 12, lineHeight: 1.7, color: '#65705F' }}>
                  {copy.help}
                </Typography>
              </Box>
            </Box>
            <Typography
              sx={{ color: '#74806E', fontSize: 11, textAlign: 'center', mt: { xs: 4, md: 0 } }}
            >
              bak2me · Bringing belongings back to people.
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
