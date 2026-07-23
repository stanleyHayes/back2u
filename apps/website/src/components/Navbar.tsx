import { useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Tooltip, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { Link } from 'react-router-dom';

import { Wordmark } from './Wordmark';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toggleThemeWithReveal } from '../lib/theme-mode';

function ThemeToggleButton() {
  const dark = useTheme().palette.mode === 'dark';
  return (
    <Tooltip title={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <IconButton
        onClick={(e) => toggleThemeWithReveal(e)}
        aria-label="Toggle theme"
        sx={{ color: 'text.primary' }}
      >
        {dark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const INK = '#0B3D38';

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
    color: 'text.primary',
    fontWeight: 600,
    fontSize: 14.5,
    px: 1.75,
    py: 0.75,
    borderRadius: 999,
    textDecoration: 'none',
    transition: 'background-color .18s ease, color .18s ease',
    '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
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
        px: { xs: 1.5, sm: 3 },
        pt: { xs: 1, sm: 1.5 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1040,
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 1.5, sm: 2.5 },
          py: 1,
          borderRadius: 999,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(20,32,27,0.86)' : 'rgba(251,246,236,0.88)',
          backdropFilter: 'saturate(150%) blur(14px)',
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? '0 8px 28px rgba(0,0,0,0.4)'
              : '0 8px 28px rgba(11,61,56,0.12), 0 1px 0 rgba(255,255,255,0.6) inset',
        }}
      >
        <Box
          component={Link}
          to="/"
          sx={{ textDecoration: 'none', display: 'inline-flex', pl: 0.5 }}
          aria-label="Back2u home"
        >
          <Wordmark />
        </Box>
        <Box sx={{ flex: 1 }} />
        <Stack
          direction="row"
          spacing={0.5}
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
              fontSize: 14.5,
              px: 1.75,
              py: 0.75,
              borderRadius: 999,
              textDecoration: 'none',
              transition: 'background-color .18s ease, color .18s ease',
              '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
            }}
          >
            Sign in
          </Box>
          <Button
            href={APP_URL}
            variant="contained"
            sx={{
              bgcolor: (t) => (t.palette.mode === 'dark' ? '#14B8A6' : INK),
              color: (t) => (t.palette.mode === 'dark' ? '#08140F' : '#FBF6EC'),
              borderRadius: 999,
              px: 2.5,
              ml: 0.5,
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#0a322e', boxShadow: 'none' },
            }}
          >
            Open app
          </Button>
          <ThemeToggleButton />
          <LanguageSwitcher />
        </Stack>
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ alignItems: 'center', display: { xs: 'flex', md: 'none' } }}
        >
          <ThemeToggleButton />
          <IconButton
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            sx={{ color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        </Stack>
      </Box>

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
                bgcolor: (t) => (t.palette.mode === 'dark' ? '#14B8A6' : INK),
                color: (t) => (t.palette.mode === 'dark' ? '#08140F' : '#FBF6EC'),
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
