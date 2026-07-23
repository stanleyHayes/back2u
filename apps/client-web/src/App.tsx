import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { AppShell, circularThemeTransition } from '@back2u/ui-web';
import { NotificationsNoneOutlined } from '@mui/icons-material';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import type { SxProps, Theme } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const INK = '#0B3D38';
const MARIGOLD = '#E0A106';

const moreItemSx = {
  alignItems: 'flex-start',
  gap: 1.25,
  py: 1,
  px: 1.25,
  mx: 0.5,
  my: 0.25,
  borderRadius: 2,
  whiteSpace: 'normal',
} as const;

/** Rich nav-menu row: a tinted icon tile, a bold title and a one-line description. */
function moreContent(icon: ReactNode, title: string, desc: string, danger = false) {
  return (
    <>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          bgcolor: danger ? 'rgba(220,38,38,0.10)' : 'rgba(15,118,110,0.10)',
          color: danger ? '#DC2626' : '#0F766E',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25, color: danger ? '#DC2626' : INK }}
        >
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.3 }}>
          {desc}
        </Typography>
      </Box>
    </>
  );
}

function NavBtn({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <Button
      component={NavLink}
      to={to}
      end={end}
      sx={{
        color: 'text.primary',
        fontWeight: 600,
        borderRadius: 2,
        px: 1.5,
        '&.active': { color: 'primary.main', bgcolor: 'rgba(15,118,110,0.1)' },
      }}
    >
      {children}
    </Button>
  );
}

function ThemeToggle() {
  const dark = useTheme().palette.mode === 'dark';
  const setThemeMode = useUi((s) => s.setThemeMode);
  return (
    <Tooltip title={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <IconButton
        onClick={(e) => circularThemeTransition(e, () => setThemeMode(dark ? 'light' : 'dark'))}
        sx={{ color: 'text.primary' }}
        aria-label="Toggle theme"
      >
        {dark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}

import { EmailVerificationBanner } from './components/EmailVerificationBanner.js';
import { api, signOut } from './lib/api.js';
import { useAuth } from './lib/auth.store.js';
import { useUi } from './lib/ui.store.js';
import { isFlagEnabled } from './lib/feature-flags.js';
import { ensureServiceWorker } from './lib/web-push.js';
import { ChatPage } from './pages/Chat.js';
import { CourierPage } from './pages/Courier.js';
import { CourierTrackingPage } from './pages/CourierTracking.js';
import { FeedPage } from './pages/Feed.js';
import { ForgotPasswordPage } from './pages/ForgotPassword.js';
import { ItemDetailPage } from './pages/ItemDetail.js';
import { LeaderboardPage } from './pages/Leaderboard.js';
import { LoginPage } from './pages/Login.js';
import { MapPage } from './pages/Map.js';
import { MarketplacePage } from './pages/Marketplace.js';
import { MatchesPage } from './pages/Matches.js';
import { PostItemPage } from './pages/PostItem.js';
import { BookmarksPage } from './pages/Bookmarks.js';
import { ProfilePage } from './pages/Profile.js';
import { RegisterPage } from './pages/Register.js';
import { ResetPasswordPage } from './pages/ResetPassword.js';
import { SafetyPage } from './pages/Safety.js';
import { SettingsPage } from './pages/Settings.js';
import { TagsPage } from './pages/Tags.js';
import { VaultPage } from './pages/Vault.js';
import { VerificationPage } from './pages/Verification.js';
import { VerifyEmailPage } from './pages/VerifyEmail.js';
import { VerifyPhonePage } from './pages/VerifyPhone.js';
import { ZonesPage } from './pages/Zones.js';
import { NotificationsPage } from './pages/Notifications.js';
import { ScanTagPage } from './pages/ScanTag.js';
import { RedeemPage } from './pages/Redeem.js';
import { RewardPartnersPage } from './pages/RewardPartners.js';
import { FoundNearYouPage } from './pages/FoundNearYou.js';
import { TrustedFinderApplyPage } from './pages/TrustedFinderApply.js';
import { QrTagShopPage } from './pages/QrTagShop.js';

function NotificationBell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.getUnreadNotificationCount(),
    refetchInterval: 30_000,
    enabled: !!useAuth((s) => s.user),
  });

  const { data: recent } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => api.listNotifications(5),
    enabled: !!anchor,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  const open = !!anchor;
  const count = unread?.count ?? 0;

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: 'text.primary' }}
      >
        <Badge badgeContent={count} color="error">
          <NotificationsNoneOutlined />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 420, mt: 1 } } }}
      >
        <Paper elevation={0}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setAnchor(null);
                navigate('/notifications');
              }}
            >
              View all
            </Button>
          </Stack>
          <Divider />
          <List dense disablePadding>
            {(recent ?? []).length === 0 && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary">
                      No notifications yet
                    </Typography>
                  }
                />
              </ListItem>
            )}
            {(recent ?? []).map((n: import('@back2u/shared-types').NotificationDTO) => (
              <ListItem
                key={n.id}
                component="div"
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                  setAnchor(null);
                  if (n.data && typeof n.data === 'object') {
                    const d = n.data as Record<string, unknown>;
                    if (d.matchId) navigate('/matches');
                    else if (d.jobId && typeof d.jobId === 'string')
                      navigate(`/courier/${d.jobId}`);
                    else if (d.listingId) navigate('/marketplace');
                    else if (d.itemId && typeof d.itemId === 'string')
                      navigate(`/items/${d.itemId}`);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  bgcolor: n.read ? 'transparent' : 'rgba(15,118,110,0.06)',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 700 }} noWrap>
                      {n.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {n.body}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>
    </>
  );
}

type MobileLink = { to: string; label: string; desc: string; icon: React.ReactNode };

const MOBILE_PRIMARY: MobileLink[] = [
  { to: '/', label: 'Feed', desc: 'Browse lost & found', icon: <HomeOutlinedIcon /> },
  { to: '/map', label: 'Map', desc: 'Live map of reports', icon: <MapOutlinedIcon /> },
  {
    to: '/leaderboard',
    label: 'Top finders',
    desc: 'Reward leaderboard',
    icon: <EmojiEventsOutlinedIcon />,
  },
  {
    to: '/marketplace',
    label: 'Marketplace',
    desc: 'Auctions & donations',
    icon: <StorefrontOutlinedIcon />,
  },
];

const MOBILE_AUTHED_PRIMARY: MobileLink[] = [
  {
    to: '/bookmarks',
    label: 'Bookmarks',
    desc: 'Your saved items',
    icon: <BookmarkBorderOutlinedIcon />,
  },
  {
    to: '/matches',
    label: 'Matches',
    desc: 'AI match suggestions',
    icon: <AutoAwesomeOutlinedIcon />,
  },
  { to: '/chat', label: 'Chat', desc: 'Your conversations', icon: <ChatBubbleOutlineIcon /> },
];

const MOBILE_MORE: MobileLink[] = [
  {
    to: '/tags',
    label: 'QR tags',
    desc: 'Protect belongings with branded tags',
    icon: <QrCode2Icon />,
  },
  {
    to: '/shop/tags',
    label: 'Tag shop',
    desc: 'Buy QR tag packs',
    icon: <ShoppingBagOutlinedIcon />,
  },
  {
    to: '/vault',
    label: 'Memory vault',
    desc: 'Pre-register what matters most',
    icon: <Inventory2OutlinedIcon />,
  },
  {
    to: '/redeem',
    label: 'Redeem points',
    desc: 'Turn finder points into rewards',
    icon: <RedeemOutlinedIcon />,
  },
  {
    to: '/rewards',
    label: 'Reward partners',
    desc: 'Where to spend your points',
    icon: <StorefrontOutlinedIcon />,
  },
  {
    to: '/near',
    label: 'Found near you',
    desc: 'AR view of nearby finds',
    icon: <ExploreOutlinedIcon />,
  },
  {
    to: '/courier',
    label: 'Courier',
    desc: 'Arrange a safe, tracked handoff',
    icon: <LocalShippingOutlinedIcon />,
  },
  {
    to: '/zones',
    label: 'Zone alerts',
    desc: 'Get pinged about your areas',
    icon: <SensorsOutlinedIcon />,
  },
  {
    to: '/safety',
    label: 'Safety center',
    desc: 'Tips & report a concern',
    icon: <ShieldOutlinedIcon />,
  },
  {
    to: '/profile',
    label: 'Profile',
    desc: 'Your finds & reputation',
    icon: <PersonOutlineIcon />,
  },
  {
    to: '/settings',
    label: 'Settings',
    desc: 'Account & preferences',
    icon: <SettingsOutlinedIcon />,
  },
];

/** Collapsed navigation for small/medium screens: a bell + hamburger that opens a full drawer. */
function MobileNav({
  loggedIn,
  clear,
  sx,
}: {
  loggedIn: boolean;
  clear: () => void;
  sx?: SxProps<Theme>;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const rowSx = {
    ...moreItemSx,
    display: 'flex',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': { bgcolor: 'action.hover' },
  } as const;
  const linkRow = (item: MobileLink) => (
    <Box key={item.to} component={Link} to={item.to} onClick={close} sx={rowSx}>
      {moreContent(item.icon, item.label, item.desc)}
    </Box>
  );

  return (
    <Box sx={sx}>
      {loggedIn && <NotificationBell />}
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        sx={{ color: 'text.primary' }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{ paper: { sx: { width: 322, p: 1 } } }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', px: 1, py: 1, mb: 0.5 }}
        >
          <Typography
            sx={{
              fontFamily: '"Black Ops One", Georgia, serif',
              fontWeight: 600,
              fontSize: 20,
              color: 'text.primary',
            }}
          >
            Menu
          </Typography>
          <IconButton onClick={close} aria-label="Close menu">
            <CloseIcon />
          </IconButton>
        </Stack>

        {loggedIn && (
          <Button
            component={Link}
            to="/post"
            onClick={close}
            variant="contained"
            fullWidth
            sx={{
              bgcolor: MARIGOLD,
              color: INK,
              borderRadius: 999,
              fontWeight: 700,
              mb: 1,
              mx: 0.5,
              width: 'auto',
            }}
          >
            Post item
          </Button>
        )}

        {MOBILE_PRIMARY.map(linkRow)}
        {loggedIn && MOBILE_AUTHED_PRIMARY.map(linkRow)}

        {loggedIn ? (
          <>
            <Divider sx={{ my: 1 }} />
            {MOBILE_MORE.map(linkRow)}
            <Divider sx={{ my: 1 }} />
            <Box
              onClick={() => {
                void signOut();
                close();
              }}
              sx={rowSx}
            >
              {moreContent(<LogoutIcon />, 'Sign out', 'End your session', true)}
            </Box>
          </>
        ) : (
          <Box sx={{ px: 0.5, mt: 1 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Button
              component={Link}
              to="/login"
              onClick={close}
              fullWidth
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              Sign in
            </Button>
            <Button
              component={Link}
              to="/register"
              onClick={close}
              variant="contained"
              fullWidth
              sx={{ bgcolor: INK, color: '#FBF6EC', borderRadius: 999, fontWeight: 700, mt: 1 }}
            >
              Get started
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

export function App() {
  const { user, featureFlags, setFeatureFlags } = useAuth();
  const [more, setMore] = useState<HTMLElement | null>(null);

  useEffect(() => {
    void ensureServiceWorker().catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .listFeatureFlags()
      .then((flags) => {
        if (!cancelled) setFeatureFlags(flags);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, setFeatureFlags]);

  return (
    <AppShell
      navRight={
        <>
          <Stack
            direction="row"
            spacing={{ xs: 0.25, md: 0.75 }}
            sx={{ alignItems: 'center', display: { xs: 'none', lg: 'flex' } }}
          >
            <NavBtn to="/" end>
              Feed
            </NavBtn>
            <NavBtn to="/map">Map</NavBtn>
            <NavBtn to="/leaderboard">Top finders</NavBtn>
            <NavBtn to="/marketplace">Marketplace</NavBtn>
            {user ? (
              <>
                <NavBtn to="/bookmarks">Bookmarks</NavBtn>
                <NavBtn to="/matches">Matches</NavBtn>
                <NavBtn to="/chat">Chat</NavBtn>
                <NotificationBell />
                <Button
                  component={Link}
                  to="/post"
                  variant="contained"
                  sx={{
                    bgcolor: MARIGOLD,
                    color: INK,
                    borderRadius: 999,
                    fontWeight: 700,
                    ml: 0.5,
                    '&:hover': { bgcolor: '#cf9305' },
                  }}
                >
                  Post item
                </Button>
                <Button
                  color="inherit"
                  sx={{ color: 'text.primary', fontWeight: 600 }}
                  onClick={(e) => setMore(e.currentTarget)}
                >
                  More
                </Button>
                <Menu
                  open={!!more}
                  anchorEl={more}
                  onClose={() => setMore(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{
                    paper: {
                      sx: {
                        width: 324,
                        borderRadius: 3,
                        p: 0.5,
                        mt: 1,
                        boxShadow: '0 26px 60px -34px rgba(11,61,56,0.55)',
                      },
                    },
                  }}
                >
                  <MenuItem
                    component={Link}
                    to="/tags"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <QrCode2Icon />,
                      'QR tags',
                      'Protect belongings with branded tags',
                    )}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/shop/tags"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(<ShoppingBagOutlinedIcon />, 'Tag shop', 'Buy QR tag packs')}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/vault"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <Inventory2OutlinedIcon />,
                      'Memory vault',
                      'Pre-register what matters most',
                    )}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/redeem"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <RedeemOutlinedIcon />,
                      'Redeem points',
                      'Turn finder points into rewards',
                    )}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/rewards"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <StorefrontOutlinedIcon />,
                      'Reward partners',
                      'Where to spend your points',
                    )}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/near"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <ExploreOutlinedIcon />,
                      'Found near you',
                      'AR view of nearby finds',
                    )}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/courier"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <LocalShippingOutlinedIcon />,
                      'Courier',
                      'Arrange a safe, tracked handoff',
                    )}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/zones"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <SensorsOutlinedIcon />,
                      'Zone alerts',
                      'Get pinged about your areas',
                    )}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/safety"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(
                      <ShieldOutlinedIcon />,
                      'Safety center',
                      'Tips & report a concern',
                    )}
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    component={Link}
                    to="/profile"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(<PersonOutlineIcon />, 'Profile', 'Your finds & reputation')}
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/settings"
                    onClick={() => setMore(null)}
                    sx={moreItemSx}
                  >
                    {moreContent(<SettingsOutlinedIcon />, 'Settings', 'Account & preferences')}
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    onClick={() => {
                      void signOut();
                      setMore(null);
                    }}
                    sx={moreItemSx}
                  >
                    {moreContent(<LogoutIcon />, 'Sign out', 'End your session', true)}
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  sx={{ color: 'text.primary', fontWeight: 600 }}
                >
                  Sign in
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    bgcolor: INK,
                    color: '#FBF6EC',
                    borderRadius: 999,
                    fontWeight: 700,
                    px: 2.5,
                    '&:hover': { bgcolor: '#0a322e' },
                  }}
                >
                  Get started
                </Button>
              </>
            )}
          </Stack>
          <ThemeToggle />
          <MobileNav
            loggedIn={!!user}
            clear={() => void signOut()}
            sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 0.5 }}
          />
        </>
      }
    >
      <EmailVerificationBanner />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        {/* The feed lives at "/", but the marketing site and older emails
            deep-link to /feed — keep the alias working forever. */}
        <Route path="/feed" element={<Navigate to="/" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/rewards" element={<RewardPartnersPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route
          path="/items/:itemId/verify"
          element={user ? <VerificationPage /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/verify-email"
          element={user ? <VerifyEmailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/verify-phone"
          element={user ? <VerifyPhonePage /> : <Navigate to="/login" />}
        />
        <Route path="/post" element={user ? <PostItemPage /> : <Navigate to="/login" />} />
        <Route path="/matches" element={user ? <MatchesPage /> : <Navigate to="/login" />} />
        <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/tags" element={user ? <TagsPage /> : <Navigate to="/login" />} />
        <Route path="/vault" element={user ? <VaultPage /> : <Navigate to="/login" />} />
        <Route path="/courier" element={user ? <CourierPage /> : <Navigate to="/login" />} />
        <Route
          path="/courier/:id"
          element={user ? <CourierTrackingPage /> : <Navigate to="/login" />}
        />
        <Route path="/zones" element={user ? <ZonesPage /> : <Navigate to="/login" />} />
        <Route path="/safety" element={user ? <SafetyPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route
          path="/notifications"
          element={user ? <NotificationsPage /> : <Navigate to="/login" />}
        />
        <Route path="/bookmarks" element={user ? <BookmarksPage /> : <Navigate to="/login" />} />
        <Route path="/redeem" element={user ? <RedeemPage /> : <Navigate to="/login" />} />
        <Route path="/near" element={user ? <FoundNearYouPage /> : <Navigate to="/login" />} />
        <Route
          path="/trusted-finder/apply"
          element={user ? <TrustedFinderApplyPage /> : <Navigate to="/login" />}
        />
        <Route path="/shop/tags" element={user ? <QrTagShopPage /> : <Navigate to="/login" />} />
        <Route path="/tags/:code" element={<ScanTagPage />} />
        {/* Unknown deep links land on the feed instead of a blank shell. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
