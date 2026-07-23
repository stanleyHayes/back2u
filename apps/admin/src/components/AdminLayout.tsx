import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BrandLogo,
  CONSOLE_INK,
  circularThemeTransition,
  OnboardingTour,
  type TourStep,
} from '@back2u/ui-web';
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
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { useUi } from '../lib/ui.store.js';

const INK_PANEL = CONSOLE_INK.panel;
const TEAL = '#2DD4BF';
const MARIGOLD = '#E0A106';
const MUTED = 'rgba(233,238,247,0.62)';
const SIDEBAR_W = 256;
const RAIL_W = 76;

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

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to the operations console',
    body: 'This 60-second tour shows you where everything lives. You can replay it anytime from the help icon in the top bar or from the account menu.',
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Everything starts in the sidebar',
    body: 'Work is grouped: Operations (verifications, moderation, safety), Commerce (marketplace, redemptions), Network (users, institutions, leads) and System (flags, audit log). Click a group heading to fold it away.',
  },
  {
    target: '[data-tour="collapse"]',
    title: 'Need more room?',
    body: 'Collapse the sidebar to an icon rail. Hover any icon to see its label — your choice is remembered.',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    body: 'Matches, courier updates and system events land here. The badge shows what you have not read yet.',
  },
  {
    target: '[data-tour="theme-toggle"]',
    title: 'Light or dark',
    body: 'Switch the console theme in one click. A full theme picker (including “follow system”) lives in Settings → Preferences.',
  },
  {
    target: '[data-tour="account-menu"]',
    title: 'Your account',
    body: 'Open your profile, jump to settings, replay this tour, or sign out.',
  },
  {
    target: '[data-tour="nav-settings"]',
    title: 'Make it yours in Settings',
    body: 'Update your profile, change your password, turn on two-factor authentication, and pick your language and notification preferences.',
  },
  {
    title: 'You are all set',
    body: 'That is the lay of the land. Head to Settings first if you want to secure your account with MFA.',
  },
];

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86_400)}d ago`;
}

/** Curved file-tree connector from the group trunk into each item (Oguaa pattern). */
function Connector({ last, active }: { last: boolean; active: boolean }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 40"
      preserveAspectRatio="none"
      aria-hidden
      sx={{
        position: 'absolute',
        left: 18,
        top: 0,
        height: '100%',
        width: 20,
        color: active ? MARIGOLD : 'rgba(233,238,247,0.16)',
        transition: 'color .15s',
      }}
    >
      <path
        d={last ? 'M7 0 V17 Q7 23 13 23 H24' : 'M7 0 V40 M7 23 Q7 23 13 23 H24'}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </Box>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const navGroupsOpen = useUi((s) => s.navGroupsOpen);
  const toggleNavGroup = useUi((s) => s.toggleNavGroup);

  return (
    <Box data-tour="sidebar" sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
      {NAV.map((group) => {
        const hasActive = group.items.some((i) => isActive(pathname, i.to));
        // A group with the active page never folds shut underneath you.
        const open = collapsed || hasActive || (navGroupsOpen[group.heading] ?? true);
        return (
          <Box key={group.heading} sx={{ mb: 0.5 }}>
            <Box
              component="button"
              type="button"
              onClick={() => toggleNavGroup(group.heading)}
              aria-expanded={open}
              sx={{
                display: collapsed ? 'none' : 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2.25,
                py: 0.75,
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: 'rgba(233,238,247,0.38)',
                transition: 'color .15s',
                '&:hover': { color: 'rgba(233,238,247,0.7)' },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                {group.heading}
              </Typography>
              <ExpandMoreRoundedIcon
                sx={{
                  fontSize: 16,
                  transition: 'transform .2s',
                  transform: open ? 'none' : 'rotate(-90deg)',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateRows: open ? '1fr' : '0fr',
                opacity: open ? 1 : 0,
                transition: 'grid-template-rows .2s ease, opacity .2s ease',
              }}
            >
              <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                {group.items.map((item, i) => {
                  const active = isActive(pathname, item.to);
                  const link = (
                    <Box
                      key={item.to}
                      component={Link}
                      to={item.to}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      data-tour={item.to === '/settings' ? 'nav-settings' : undefined}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        height: 38,
                        gap: 1.25,
                        pl: collapsed ? 0 : '44px',
                        pr: collapsed ? 0 : 1.5,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        textDecoration: 'none',
                        color: active ? '#FFFFFF' : MUTED,
                        transition: 'color .15s',
                        '&:hover': { color: '#FFFFFF' },
                        // marigold active accent bar on the sidebar edge
                        '&::before': active
                          ? {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 8,
                              bottom: 8,
                              width: 3,
                              borderRadius: '0 2px 2px 0',
                              bgcolor: MARIGOLD,
                            }
                          : undefined,
                      }}
                    >
                      {!collapsed && (
                        <Connector last={i === group.items.length - 1} active={active} />
                      )}
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          color: active ? TEAL : 'rgba(233,238,247,0.5)',
                          transition: 'color .15s',
                          '& > svg': { fontSize: 19 },
                        }}
                      >
                        {item.icon}
                      </Box>
                      {!collapsed && (
                        <Typography noWrap sx={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>
                          {item.label}
                        </Typography>
                      )}
                    </Box>
                  );
                  return collapsed ? (
                    <Tooltip key={item.to} title={item.label} placement="right">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  );
                })}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function SidebarInner({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const { user, clear } = useAuth();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: INK_PANEL }}>
      <Box
        sx={{
          px: collapsed ? 0 : 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        <BrandLogo size={26} onDark compact={collapsed} />
        {!collapsed && (
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
        )}
      </Box>
      <Box
        sx={{ mx: collapsed ? 1.5 : 2.5, mb: 1, borderTop: '1px solid rgba(255,255,255,0.07)' }}
      />

      <NavList collapsed={collapsed} onNavigate={onNavigate} />

      {/* Desktop collapse toggle — the mobile drawer always shows full width */}
      {onToggleCollapse && (
        <Box
          component="button"
          type="button"
          data-tour="collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.25,
            px: collapsed ? 0 : 2.25,
            py: 1.25,
            border: 0,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: MUTED,
            transition: 'color .15s',
            '&:hover': { color: '#fff' },
          }}
        >
          {collapsed ? (
            <KeyboardDoubleArrowRightIcon sx={{ fontSize: 19 }} />
          ) : (
            <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 19 }} />
          )}
          {!collapsed && <Typography sx={{ fontSize: 13 }}>Collapse</Typography>}
        </Box>
      )}

      {/* User footer */}
      <Box
        sx={{
          p: collapsed ? 0.75 : 1.5,
          m: 1.5,
          borderRadius: 2.5,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Stack
          direction="row"
          spacing={collapsed ? 0 : 1.25}
          sx={{ alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <Tooltip title={collapsed ? (user?.email ?? '') : ''} placement="right">
            <Avatar
              src={user?.avatarUrl}
              sx={{
                width: 36,
                height: 36,
                fontSize: 15,
                fontWeight: 800,
                color: '#04201d',
                background: `linear-gradient(150deg, ${TEAL}, #0F766E)`,
              }}
            >
              {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
          {!collapsed && (
            <>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: '#E9EEF7' }}>
                  {user?.name ?? 'Admin'}
                </Typography>
                <Typography noWrap sx={{ fontSize: 11.5, color: MUTED }}>
                  {user?.email}
                </Typography>
              </Box>
              <Tooltip title="Sign out">
                <IconButton
                  onClick={clear}
                  size="small"
                  sx={{ color: MUTED, '&:hover': { color: '#fff' } }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function NotificationsBell() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const qc = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => api.getUnreadNotificationCount(),
    refetchInterval: 60_000,
  });
  const { data: items, isLoading } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => api.listNotifications(8),
    enabled: open,
  });
  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notif-unread'] });
      void qc.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          data-tour="notifications"
          onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
          sx={{ color: '#E9EEF7' }}
        >
          <Badge
            badgeContent={unread?.count ?? 0}
            max={99}
            sx={{ '& .MuiBadge-badge': { bgcolor: MARIGOLD, color: '#0B3D38', fontWeight: 700 } }}
          >
            <NotificationsNoneOutlinedIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: { width: 380, maxWidth: 'calc(100vw - 32px)', borderRadius: 2.5 } },
        }}
      >
        <Stack
          direction="row"
          sx={{ px: 2, py: 1.5, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Notifications</Typography>
          <Button
            size="small"
            startIcon={<DoneAllRoundedIcon />}
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || (unread?.count ?? 0) === 0}
            sx={{ fontSize: 12 }}
          >
            Mark all read
          </Button>
        </Stack>
        <Divider />
        {isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : (items ?? []).length === 0 ? (
          <Typography
            sx={{ px: 2, py: 4, textAlign: 'center', color: 'text.secondary', fontSize: 14 }}
          >
            Nothing yet — match, courier and system events will show up here.
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
            {(items ?? []).map((n) => (
              <Box
                key={n.id}
                sx={{
                  px: 2,
                  py: 1.25,
                  display: 'flex',
                  gap: 1.25,
                  alignItems: 'flex-start',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-of-type': { borderBottom: 0 },
                }}
              >
                <Box
                  sx={{
                    mt: '7px',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: n.read ? 'transparent' : TEAL,
                    border: n.read ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: n.read ? 500 : 700 }}>
                    {n.title}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    {n.body}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
                    {timeAgo(n.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Popover>
    </>
  );
}

function AccountMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const { user, clear } = useAuth();
  const setTourOpen = useUi((s) => s.setTourOpen);

  const go = (to: string) => {
    setAnchor(null);
    navigate(to);
  };

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          data-tour="account-menu"
          onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
          sx={{ p: 0.5 }}
        >
          <Avatar
            src={user?.avatarUrl}
            sx={{
              width: 32,
              height: 32,
              fontSize: 14,
              fontWeight: 800,
              color: '#04201d',
              background: `linear-gradient(150deg, ${TEAL}, #0F766E)`,
            }}
          >
            {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 240, borderRadius: 2.5, mt: 1 } } }}
      >
        <Box sx={{ px: 2, pt: 1.25, pb: 1 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>
            {user?.name ?? 'Admin'}
          </Typography>
          <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ mb: 0.5 }} />
        <MenuItem onClick={() => go('/profile')}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go('/settings')}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            setTourOpen(true);
          }}
        >
          <ListItemIcon>
            <HelpOutlineOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Replay tutorial</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={clear}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const user = useAuth((s) => s.user);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const setThemeMode = useUi((s) => s.setThemeMode);
  const tourOpen = useUi((s) => s.tourOpen);
  const setTourOpen = useUi((s) => s.setTourOpen);
  const tourDone = useUi((s) => s.tourDone);
  const markTourDone = useUi((s) => s.markTourDone);

  const current = [...ALL_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) => isActive(pathname, i.to));

  // First sign-in on this device: walk new staff through the console once.
  useEffect(() => {
    if (!user || tourDone[user.id]) return;
    const t = setTimeout(() => setTourOpen(true), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const width = collapsed ? RAIL_W : SIDEBAR_W;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Fixed sidebar (desktop) */}
      <Box
        component="nav"
        sx={{
          width,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: 0,
          height: '100vh',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          transition: 'width .2s ease',
          overflow: 'hidden',
        }}
      >
        <SidebarInner collapsed={collapsed} onToggleCollapse={toggleSidebar} />
      </Box>

      {/* Drawer (mobile) */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_W, border: 'none' },
        }}
      >
        <SidebarInner onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main column */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Topbar (stays ink-dark in both themes, like the sidebar) */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: { xs: 2, md: 4 },
            py: 1.5,
            bgcolor: isDark ? CONSOLE_INK.topbarDark : CONSOLE_INK.topbarLight,
            backdropFilter: isDark ? 'saturate(150%) blur(10px)' : 'none',
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
              noWrap
              sx={{
                fontFamily: '"Black Ops One", Georgia, serif',
                fontWeight: 600,
                fontSize: 22,
                color: '#F3F6FB',
                lineHeight: 1.15,
              }}
            >
              {current?.label ?? 'Console'}
            </Typography>
            <Typography noWrap sx={{ fontSize: 12.5, color: MUTED }}>
              Back2u operations console
            </Typography>
          </Box>

          {/* Quick actions */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <NotificationsBell />
            <Tooltip title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
              <IconButton
                data-tour="theme-toggle"
                onClick={(e) =>
                  circularThemeTransition(e, () => setThemeMode(isDark ? 'light' : 'dark'))
                }
                sx={{ color: '#E9EEF7' }}
              >
                {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Replay the tour">
              <IconButton onClick={() => setTourOpen(true)} sx={{ color: '#E9EEF7' }}>
                <HelpOutlineOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 0.75, my: 0.75, borderColor: 'rgba(255,255,255,0.14)' }}
            />
            <AccountMenu />
          </Stack>
        </Box>

        <Box sx={{ flex: 1, width: '100%', maxWidth: 1440, mx: 'auto', p: { xs: 2, md: 4 } }}>
          {/* Re-key by route so each page fades up on navigation. */}
          <Box key={pathname} sx={{ animation: 'b2uFadeUp .45s cubic-bezier(.2,.7,.2,1) both' }}>
            {children}
          </Box>
        </Box>
      </Box>

      <OnboardingTour
        steps={TOUR_STEPS}
        open={tourOpen}
        onClose={() => {
          setTourOpen(false);
          if (user) markTourDone(user.id);
        }}
      />
    </Box>
  );
}
