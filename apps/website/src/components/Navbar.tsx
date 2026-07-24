import { useState } from 'react';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Link, NavLink } from 'react-router-dom';
import { BrandMark } from '@back2u/ui-web';

import { LanguageSwitcher } from './LanguageSwitcher';
import { toggleThemeWithReveal } from '../lib/theme-mode';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const INK = '#2E3D2F';
const CREAM = '#F2EFEA';
const MARIGOLD = '#8B6F4E';

type NLink = { label: string; to?: string; href?: string };
const LINKS: NLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Browse', href: `${APP_URL}/feed` },
  { label: 'Live map', to: '/map' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Institutions', to: '/partner' },
  { label: 'Get the app', to: '/download' },
];

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

/** Uppercase nav link with a marigold underline on the active route. */
function TopLink({ link }: { link: NLink }) {
  const base = {
    position: 'relative',
    color: 'text.primary',
    fontWeight: 700,
    fontSize: 12.5,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    py: 1,
    transition: 'color .18s ease',
    '&:hover': { color: 'primary.main' },
  } as const;

  const underline = {
    '&.active': { color: 'text.primary' },
    '&.active::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 2,
      mx: 'auto',
      width: 18,
      height: 3,
      borderRadius: 2,
      bgcolor: MARIGOLD,
    },
  } as const;

  return link.to ? (
    <Box component={NavLink} to={link.to} end={link.to === '/'} sx={{ ...base, ...underline }}>
      {link.label}
    </Box>
  ) : (
    <Box component="a" href={link.href} sx={base}>
      {link.label}
    </Box>
  );
}

/** The design-#4 "Open app" pill: label + dark circular arrow. */
function CtaPill({ full }: { full?: boolean }) {
  return (
    <Box
      component="a"
      href={APP_URL}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: full ? 'space-between' : 'flex-start',
        gap: 1.25,
        width: full ? '100%' : 'auto',
        pl: 2.5,
        pr: 0.5,
        py: 0.5,
        borderRadius: 999,
        bgcolor: MARIGOLD,
        color: INK,
        fontWeight: 800,
        fontSize: 14,
        textDecoration: 'none',
        boxShadow: '0 10px 22px -12px rgba(139,111,78,0.9)',
        transition: 'transform .18s ease, box-shadow .18s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 14px 26px -12px rgba(139,111,78,0.95)',
        },
      }}
    >
      Open app
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          bgcolor: INK,
          color: CREAM,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
      </Box>
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
          maxWidth: 1200,
          mx: 'auto',
          display: 'flex',
          alignItems: 'stretch',
          minHeight: { xs: 64, md: 74 },
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) => (t.palette.mode === 'dark' ? '#263026' : '#FAF8F3'),
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? '0 10px 30px rgba(0,0,0,0.45)'
              : '0 12px 30px rgba(46,61,47,0.14)',
        }}
      >
        {/* Dark brand panel with a curved right edge */}
        <Box
          component={Link}
          to="/"
          aria-label="Back2u home"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            pl: { xs: 2, md: 3 },
            pr: { xs: 2.5, md: 5 },
            textDecoration: 'none',
            bgcolor: INK,
            borderRadius: '0 40px 40px 0',
          }}
        >
          <BrandMark size={34} onDark />
          <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
            <Typography
              className="b2u-display"
              sx={{
                color: CREAM,
                fontWeight: 600,
                fontSize: 20,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              Back2u
            </Typography>
            <Typography
              sx={{
                color: 'rgba(242,239,234,0.6)',
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Lost. Found. Returned.
            </Typography>
          </Box>
        </Box>

        {/* Light section: links + actions */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            pl: { xs: 1.5, md: 3 },
            pr: { xs: 1, md: 2 },
          }}
        >
          <Stack
            direction="row"
            spacing={{ md: 2.5, lg: 3.5 }}
            sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}
          >
            {LINKS.map((l) => (
              <TopLink key={l.label} link={l} />
            ))}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: 'auto' }}>
            <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <CtaPill />
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', md: 'block' }, my: 2, borderColor: 'divider' }}
            />
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
      </Box>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 300, p: 2.5, height: '100%', bgcolor: 'background.default' }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <BrandMark size={30} />
              <Typography
                className="b2u-display"
                sx={{ fontWeight: 600, fontSize: 19, color: 'text.primary' }}
              >
                Back2u
              </Typography>
            </Stack>
            <IconButton onClick={() => setOpen(false)} aria-label="Close menu">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            {LINKS.map((l) => (
              <Box
                key={l.label}
                component={l.to ? Link : 'a'}
                {...(l.to ? { to: l.to } : { href: l.href })}
                onClick={() => setOpen(false)}
                sx={{
                  color: 'text.primary',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                {l.label}
              </Box>
            ))}
            <Box
              component="a"
              href={`${APP_URL}/login`}
              onClick={() => setOpen(false)}
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Box>
            <Box sx={{ width: '100%', pt: 0.5 }}>
              <CtaPill full />
            </Box>
            <Box sx={{ pt: 1 }}>
              <LanguageSwitcher />
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
