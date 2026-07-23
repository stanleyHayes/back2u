import { useState } from 'react';
import { Box, Button, Container, Drawer, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';

import { Wordmark } from './Wordmark';
import { LanguageSwitcher } from './LanguageSwitcher';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const INK = '#0B3D38';
const MARIGOLD = '#E0A106';

type NLink = { label: string; to?: string; href?: string };
const LINKS: NLink[] = [
  { label: 'Browse', href: `${APP_URL}/feed` },
  { label: 'Live map', to: '/map' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'For institutions', to: '/partner' },
  { label: 'Get the app', to: '/download' },
];

function NavLink({ link, onClick }: { link: NLink; onClick?: () => void }) {
  const sx = {
    position: 'relative',
    color: 'text.primary',
    fontWeight: 600,
    fontSize: 15,
    px: 0.5,
    py: 0.5,
    textDecoration: 'none',
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -2,
      height: 2,
      borderRadius: 2,
      background: MARIGOLD,
      transform: 'scaleX(0)',
      transformOrigin: 'left',
      transition: 'transform .22s cubic-bezier(.2,.7,.2,1)',
    },
    '&:hover::after': { transform: 'scaleX(1)' },
  } as const;
  return link.to ? (
    <Box component={Link} to={link.to} onClick={onClick} sx={sx}>
      {link.label}
    </Box>
  ) : (
    <Box component="a" href={link.href} onClick={onClick} sx={sx}>
      {link.label}
    </Box>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        // marigold hairline that rhymes with the footer
        borderTop: '2px solid',
        borderImage: 'linear-gradient(90deg, #0F766E, #E0A106, #0F766E) 1',
        borderBottom: '1px solid',
        borderBottomColor: 'divider',
        backdropFilter: 'saturate(150%) blur(12px)',
        bgcolor: 'rgba(251,246,236,0.82)',
      }}
    >
      <Container sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box component={Link} to="/" sx={{ textDecoration: 'none' }} aria-label="Back2u home">
          <Wordmark />
        </Box>
        <Box sx={{ flex: 1 }} />
        <Stack
          direction="row"
          spacing={3}
          sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}
        >
          {LINKS.map((l) => (
            <NavLink key={l.label} link={l} />
          ))}
          <Box
            component="a"
            href={`${APP_URL}/login`}
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              '&:hover': { color: INK },
            }}
          >
            Sign in
          </Box>
          <Button
            href={APP_URL}
            variant="contained"
            sx={{
              bgcolor: INK,
              color: '#FBF6EC',
              borderRadius: 999,
              px: 2.5,
              fontWeight: 700,
              '&:hover': { bgcolor: '#0a322e' },
            }}
          >
            Open app
          </Button>
          <LanguageSwitcher />
        </Stack>
        <IconButton
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 288, p: 2.5, height: '100%', bgcolor: 'background.default' }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
          >
            <Wordmark />
            <IconButton onClick={() => setOpen(false)} aria-label="Close menu">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={2.5} sx={{ alignItems: 'flex-start' }}>
            {LINKS.map((l) => (
              <NavLink key={l.label} link={l} onClick={() => setOpen(false)} />
            ))}
            <Box
              component="a"
              href={`${APP_URL}/login`}
              onClick={() => setOpen(false)}
              sx={{ color: 'text.primary', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
            >
              Sign in
            </Box>
            <Button
              href={APP_URL}
              variant="contained"
              fullWidth
              sx={{
                bgcolor: INK,
                color: '#FBF6EC',
                borderRadius: 999,
                fontWeight: 700,
                mt: 1,
                '&:hover': { bgcolor: '#0a322e' },
              }}
            >
              Open app
            </Button>
            <Box sx={{ pt: 1 }}>
              <LanguageSwitcher />
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
