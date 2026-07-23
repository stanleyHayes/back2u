import { useState, type ReactNode } from 'react';
import { Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '@back2u/ui-web';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { useAuth } from '../lib/auth.store.js';

const INK_PANEL = '#0A0F1C';
const TEAL = '#2DD4BF';
const MARIGOLD = '#E0A106';
const MUTED = 'rgba(233,238,247,0.62)';
const SIDEBAR_W = 256;

type NavItem = { to: string; label: string; icon: ReactNode };
type NavGroup = { heading: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    heading: 'Operations',
    items: [
      { to: '/', label: 'Overview', icon: <SpaceDashboardOutlinedIcon /> },
      { to: '/verifications', label: 'Verifications', icon: <FactCheckOutlinedIcon /> },
      { to: '/trusted-finder', label: 'Trusted Finder', icon: <WorkspacePremiumOutlinedIcon /> },
      { to: '/moderation', label: 'Moderation', icon: <GavelOutlinedIcon /> },
      { to: '/safety', label: 'Safety reports', icon: <HealthAndSafetyOutlinedIcon /> },
    ],
  },
  {
    heading: 'Commerce',
    items: [
      { to: '/marketplace', label: 'Marketplace', icon: <StorefrontOutlinedIcon /> },
      { to: '/redemptions', label: 'Redemptions', icon: <RedeemOutlinedIcon /> },
    ],
  },
  {
    heading: 'Network',
    items: [
      { to: '/users', label: 'Users', icon: <GroupOutlinedIcon /> },
      { to: '/institutions', label: 'Institutions', icon: <ApartmentOutlinedIcon /> },
      { to: '/leads', label: 'Leads', icon: <TrendingUpOutlinedIcon /> },
    ],
  },
  {
    heading: 'System',
    items: [
      { to: '/feature-flags', label: 'Feature flags', icon: <ToggleOnOutlinedIcon /> },
      { to: '/audit', label: 'Audit log', icon: <ReceiptLongOutlinedIcon /> },
    ],
  },
  {
    heading: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: <PersonOutlineIcon /> },
      { to: '/settings', label: 'Settings', icon: <SettingsOutlinedIcon /> },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
      {NAV.map((group) => (
        <Box key={group.heading} sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              px: 1.5,
              mb: 0.75,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(233,238,247,0.38)',
            }}
          >
            {group.heading}
          </Typography>
          <Stack spacing={0.25}>
            {group.items.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <Box
                  key={item.to}
                  component={Link}
                  to={item.to}
                  onClick={onNavigate}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    textDecoration: 'none',
                    color: active ? '#FFFFFF' : MUTED,
                    bgcolor: active ? 'rgba(45,212,191,0.12)' : 'transparent',
                    transition: 'background-color .15s, color .15s',
                    '&:hover': { bgcolor: active ? 'rgba(45,212,191,0.16)' : 'rgba(255,255,255,0.05)', color: '#FFFFFF' },
                    '& svg': { fontSize: 20, color: active ? TEAL : 'rgba(233,238,247,0.5)' },
                    // marigold active accent bar
                    '&::before': active
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 18,
                          width: 3,
                          borderRadius: 2,
                          bgcolor: MARIGOLD,
                        }
                      : undefined,
                  }}
                >
                  {item.icon}
                  <Typography sx={{ fontSize: 14.5, fontWeight: active ? 700 : 500 }}>{item.label}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const { user, clear } = useAuth();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: INK_PANEL }}>
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BrandLogo size={26} onDark />
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 999,
            border: `1px solid ${MARIGOLD}`,
            color: MARIGOLD,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Admin
        </Box>
      </Box>
      <Box sx={{ mx: 2.5, mb: 1, borderTop: '1px solid rgba(255,255,255,0.07)' }} />

      <NavList onNavigate={onNavigate} />

      {/* User footer */}
      <Box sx={{ p: 1.5, m: 1.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(150deg, ${TEAL}, #0F766E)`,
              color: '#04201d',
              fontWeight: 800,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {(user?.email ?? '?').charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: '#E9EEF7' }}>
              {user?.name ?? 'Admin'}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11.5, color: MUTED }}>
              {user?.email}
            </Typography>
          </Box>
          <Tooltip title="Sign out">
            <IconButton onClick={clear} size="small" sx={{ color: MUTED, '&:hover': { color: '#fff' } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const current = [...ALL_ITEMS].sort((a, b) => b.to.length - a.to.length).find((i) => isActive(pathname, i.to));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Fixed sidebar (desktop) */}
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_W,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: 0,
          height: '100vh',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <SidebarInner />
      </Box>

      {/* Drawer (mobile) */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_W, border: 'none' } }}
      >
        <SidebarInner onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main column */}
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: { xs: 2, md: 4 },
            py: 2,
            bgcolor: 'rgba(11,18,32,0.82)',
            backdropFilter: 'saturate(150%) blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            borderTop: '2px solid',
            borderImage: 'linear-gradient(90deg, #0F766E, #E0A106, #0F766E) 1',
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, color: '#E9EEF7' }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, fontSize: 22, color: '#F3F6FB', lineHeight: 1.15 }}
            >
              {current?.label ?? 'Console'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: MUTED }}>Back2u operations console</Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, width: '100%', maxWidth: 1440, mx: 'auto', p: { xs: 2, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
