import { useState, type ReactNode } from 'react';
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
import type { Theme } from '@mui/material/styles';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Link, NavLink } from 'react-router-dom';
import { BrandMark, neuShadow } from '@back2u/ui-web';

import { LanguageSwitcher } from './LanguageSwitcher';
import { toggleThemeWithReveal } from '../lib/theme-mode';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const INK = '#2E3D2F';
const CREAM = '#F2EFEA';
// Carries cream text, so it uses the deeper marigold (5.11:1, was 4.09:1).
const MARIGOLD = '#7A6044';

type NLink = { label: string; description: string; icon: ReactNode; to?: string; href?: string };
const LINKS: NLink[] = [
  {
    label: 'Home',
    description: 'Discover how bak2me brings things back.',
    icon: <HomeOutlinedIcon />,
    to: '/',
  },
  {
    label: 'Browse',
    description: 'Explore lost and found items near you.',
    icon: <SearchRoundedIcon />,
    href: `${APP_URL}/feed`,
  },
  {
    label: 'Live map',
    description: 'See where items are lost and found.',
    icon: <MapOutlinedIcon />,
    to: '/map',
  },
  {
    label: 'Pricing',
    description: 'Find the right plan for your needs.',
    icon: <SellOutlinedIcon />,
    to: '/pricing',
  },
  {
    label: 'Institutions',
    description: 'Bring lost and found to your venue.',
    icon: <BusinessOutlinedIcon />,
    to: '/partner',
  },
  {
    label: 'Get the app',
    description: 'Keep your next reunion within reach.',
    icon: <PhoneIphoneRoundedIcon />,
    to: '/download',
  },
];

// Shadows use the navigation surface's own tones for soft, consistent depth.
const navigationShadow = (theme: Theme, inset = false) => {
  const prefix = inset ? 'inset ' : '';
  return theme.palette.mode === 'dark'
    ? `${prefix}4px 4px 9px #171e17, ${prefix}-3px -3px 8px #354035`
    : `${prefix}4px 4px 9px #dedbd5, ${prefix}-3px -3px 8px #ffffff`;
};
const focusRing = { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 };

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

function TopLink({ link }: { link: NLink }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    whiteSpace: 'nowrap',
    color: 'text.secondary',
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
    px: 1.5,
    borderRadius: '12px',
    transition: 'color .18s ease, box-shadow .18s ease',
    '&:hover': { color: 'text.primary', boxShadow: (t: Theme) => navigationShadow(t) },
    '&:focus-visible': focusRing,
    '&.active': {
      color: 'text.primary',
      boxShadow: (t: Theme) => navigationShadow(t, true),
      '&::before': {
        content: '\"\"',
        width: 5,
        height: 5,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        mr: 0.75,
      },
    },
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  } as const;
  return link.to ? (
    <Box component={NavLink} to={link.to} end={link.to === '/'} sx={base}>
      {link.label}
    </Box>
  ) : (
    <Box component="a" href={link.href} sx={base}>
      {link.label}
    </Box>
  );
}

function SidebarLink({ link, onClose }: { link: NLink; onClose: () => void }) {
  return (
    <Box
      component={link.to ? NavLink : 'a'}
      {...(link.to ? { to: link.to, end: link.to === '/' } : { href: link.href })}
      onClick={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        minHeight: 76,
        borderRadius: '16px',
        textDecoration: 'none',
        color: 'text.primary',
        boxShadow: (t) => navigationShadow(t),
        transition: 'box-shadow .18s ease, color .18s ease',
        '&:hover': { color: 'primary.main' },
        '&:focus-visible': focusRing,
        '&.active': {
          boxShadow: (t) => navigationShadow(t, true),
          '& .nav-icon': { color: 'primary.main' },
          '& .nav-indicator': { opacity: 1 },
        },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Box
        className="nav-icon"
        sx={{
          width: 42,
          height: 42,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '13px',
          color: 'text.secondary',
          boxShadow: (t) => navigationShadow(t, true),
          '& svg': { fontSize: 22 },
        }}
      >
        {link.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="span"
          sx={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}
        >
          {link.label}
        </Typography>
        <Typography
          component="span"
          sx={{ display: 'block', mt: 0.4, color: 'text.secondary', fontSize: 12, lineHeight: 1.5 }}
        >
          {link.description}
        </Typography>
      </Box>
      <Box
        className="nav-indicator"
        sx={{
          opacity: 0,
          width: 6,
          height: 6,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: 'primary.main',
        }}
      />
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
        color: '#F2EFEA',
        fontWeight: 800,
        fontSize: 14,
        textDecoration: 'none',
        boxShadow: (t) => neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
        transition: 'transform .18s ease, box-shadow .18s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: (t) => neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: (t) => neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'inset'),
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
        pb: { xs: 0.5, sm: 0.75 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          display: 'flex',
          alignItems: 'stretch',
          minHeight: { xs: 64, md: 74 },
          borderRadius: { xs: '16px', md: '18px' },
          overflow: 'hidden',
          bgcolor: (t) => (t.palette.mode === 'dark' ? '#263026' : '#FAF8F3'),
          boxShadow: (t) => neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
          position: 'relative',
        }}
      >
        {/* Design #4 brand panel: square at the top-right, with one deep
            bottom-right sweep cutting back into the panel. */}
        <Box
          component={Link}
          to="/"
          aria-label="bak2me home"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            pl: { xs: 2, md: 3 },
            pr: { xs: 3, md: 3 },
            textDecoration: 'none',
            bgcolor: INK,
            borderRadius: 0,
            // The reference is an ellipse, not a quarter-circle: it travels
            // the full panel height but only cuts roughly 54px back horizontally.
            borderBottomRightRadius: { xs: '44px 58px', md: '54px 72px' },
            boxShadow: '10px 0 26px -22px rgba(46,61,47,0.95)',
          }}
        >
          <BrandMark size={34} onDark />
          <Box sx={{ display: 'block', minWidth: 0 }}>
            <Typography
              className="b2u-display"
              sx={{
                color: CREAM,
                fontWeight: 600,
                fontSize: { xs: 18, sm: 20 },
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              bak2me
            </Typography>
            <Typography
              sx={{
                color: 'rgba(242,239,234,0.6)',
                display: { xs: 'none', sm: 'block' },
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
            component="nav"
            aria-label="Main navigation"
            spacing={0.5}
            sx={{
              alignItems: 'center',
              display: { xs: 'none', lg: 'flex' },
              p: 0.5,
              borderRadius: '16px',
              boxShadow: (t) => navigationShadow(t, true),
            }}
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
              sx={{
                color: 'text.primary',
                width: 40,
                height: 40,
                bgcolor: (t) =>
                  t.palette.mode === 'dark' ? 'rgba(242,239,234,0.06)' : 'rgba(46,61,47,0.045)',
                '&:hover': { bgcolor: 'rgba(139,111,78,0.14)' },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 'min(380px, 100vw)',
              bgcolor: (t) => (t.palette.mode === 'dark' ? '#263026' : '#FAF8F3'),
              backgroundImage: 'none',
              borderLeft: '1px solid',
              borderColor: 'divider',
              borderRadius: '24px 0 0 24px',
            },
          },
        }}
      >
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <BrandMark size={32} />
              <Box>
                <Typography
                  className="b2u-display"
                  sx={{ fontWeight: 600, fontSize: 21, color: 'text.primary' }}
                >
                  bak2me
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
                  Lost. Found. Returned.
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              sx={{ boxShadow: (t) => navigationShadow(t), '&:focus-visible': focusRing }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: '.12em',
              fontWeight: 700,
              color: 'text.secondary',
              mb: 1.75,
            }}
          >
            EXPLORE BAK2ME
          </Typography>
          <Stack component="nav" aria-label="Sidebar navigation" spacing={1.5}>
            {LINKS.map((link) => (
              <SidebarLink key={link.label} link={link} onClose={() => setOpen(false)} />
            ))}
          </Stack>
          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Divider sx={{ mb: 2.5 }} />
            <SidebarLink
              link={{
                label: 'Sign in',
                description: 'Return to your items and activity.',
                icon: <LoginRoundedIcon />,
                href: `${APP_URL}/login`,
              }}
              onClose={() => setOpen(false)}
            />
            <Box sx={{ mt: 2 }}>
              <CtaPill full />
            </Box>
            <Box sx={{ mt: 2 }}>
              <LanguageSwitcher />
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
