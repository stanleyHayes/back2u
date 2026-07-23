import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import type { EmailPreferences, Locale } from '@back2u/shared-types';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { pushSupported, subscribeToPush } from '../lib/web-push.js';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';

const inkBtn = {
  bgcolor: INK,
  color: PAPER,
  borderRadius: 999,
  fontWeight: 700,
  px: 2.5,
  '&:hover': { bgcolor: '#0a322e' },
} as const;
const outlineBtn = {
  borderRadius: 999,
  fontWeight: 700,
  color: 'text.primary',
  borderColor: 'divider',
  '&:hover': { borderColor: TEAL, color: 'primary.main' },
} as const;

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'tw', label: 'Twi' },
  { code: 'ga', label: 'Ga' },
  { code: 'ee', label: 'Ewe' },
];

function SettingCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: '20px 20px 20px 6px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(15,118,110,0.1)',
            color: 'primary.main',
            flexShrink: 0,
            '& svg': { fontSize: 21 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 700, fontSize: 16.5, color: 'text.primary', lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {desc && <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>{desc}</Typography>}
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

export function SettingsPage() {
  const user = useAuth((s) => s.user);
  const [locale, setLocale] = useState<Locale>(user?.locale ?? 'en');
  const [redeem, setRedeem] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const pushAvailable = pushSupported();

  const [prefs, setPrefs] = useState<EmailPreferences>({
    marketing: user?.emailPreferences?.marketing ?? true,
    matches: user?.emailPreferences?.matches ?? true,
    chat: user?.emailPreferences?.chat ?? true,
    reminders: user?.emailPreferences?.reminders ?? true,
    courier: user?.emailPreferences?.courier ?? true,
  });

  useEffect(() => {
    if (user?.emailPreferences) {
      setPrefs(user.emailPreferences);
    }
  }, [user?.emailPreferences]);

  useEffect(() => {
    let cancelled = false;
    if (!pushAvailable) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setSubscribed(sub !== null);
      });
    return () => {
      cancelled = true;
    };
  }, [pushAvailable]);

  const setLoc = useMutation({ mutationFn: () => api.setLocale(locale) });
  const prefsMut = useMutation({
    mutationFn: () => api.updateEmailPreferences(prefs),
    onSuccess: (data) => {
      useAuth.getState().setUser(data);
      setSnackbarMessage('Email preferences saved');
      setSnackbarOpen(true);
    },
    onError: () => {
      setSnackbarMessage('Failed to save email preferences');
      setSnackbarOpen(true);
    },
  });
  const redeemMut = useMutation({ mutationFn: () => api.redeemPoints(redeem) });
  const exportMut = useMutation({
    mutationFn: () => api.exportAccount(),
    onSuccess: (data) => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'back2u-data.json';
      a.click();
      URL.revokeObjectURL(url);
    },
  });
  const deleteMut = useMutation({
    mutationFn: () => api.deleteAccount(),
    onSuccess: () => {
      useAuth.getState().clear();
      window.location.assign('/');
    },
  });

  const enablePush = async () => {
    setLoading(true);
    try {
      const r = await subscribeToPush();
      if (r.ok) {
        setSubscribed(true);
        setSnackbarMessage('Subscribed to push notifications');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(`Failed: ${r.reason}`);
        setSnackbarOpen(true);
      }
    } catch {
      setSnackbarMessage('Failed: unexpected error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const disablePush = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await api.unsubscribeWebPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setSnackbarMessage('Unsubscribed from push notifications');
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage('Failed: unexpected error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Typography
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 12,
          mb: 0.5,
        }}
      >
        Account
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Black Ops One", Georgia, serif',
          fontWeight: 600,
          fontSize: 30,
          color: 'text.primary',
          mb: 3,
        }}
      >
        Settings
      </Typography>

      <Stack spacing={2.5}>
        <SettingCard
          icon={<TranslateOutlinedIcon />}
          title="Language"
          desc="Pick the language for emails and the app."
        >
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              sx={{ minWidth: 180 }}
            >
              {LOCALES.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() => setLoc.mutate()}
              disabled={setLoc.isPending}
              sx={inkBtn}
            >
              {setLoc.isPending ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        </SettingCard>

        <SettingCard
          icon={<MailOutlineIcon />}
          title="Email preferences"
          desc="Choose which emails you want to receive."
        >
          <Stack spacing={0.25}>
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.matches}
                  onChange={(e) => setPrefs((p) => ({ ...p, matches: e.target.checked }))}
                />
              }
              label="Match alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.chat}
                  onChange={(e) => setPrefs((p) => ({ ...p, chat: e.target.checked }))}
                />
              }
              label="Chat notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.courier}
                  onChange={(e) => setPrefs((p) => ({ ...p, courier: e.target.checked }))}
                />
              }
              label="Courier updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.reminders}
                  onChange={(e) => setPrefs((p) => ({ ...p, reminders: e.target.checked }))}
                />
              }
              label="Item reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.marketing}
                  onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
                />
              }
              label="Marketing / newsletters"
            />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={() => prefsMut.mutate()}
              disabled={prefsMut.isPending}
              sx={inkBtn}
            >
              {prefsMut.isPending ? 'Saving…' : 'Save'}
            </Button>
            {prefsMut.isError && (
              <Alert severity="error" sx={{ py: 0 }}>
                Failed to save preferences
              </Alert>
            )}
          </Stack>
        </SettingCard>

        <SettingCard
          icon={<BadgeOutlinedIcon />}
          title="Identity"
          desc="Verify your details and unlock trusted-finder status."
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <Button component={Link} to="/verify-email" variant="outlined" sx={outlineBtn}>
              Verify email
            </Button>
            <Button component={Link} to="/verify-phone" variant="outlined" sx={outlineBtn}>
              Verify phone
            </Button>
            {user && !user.trustedFinder && (
              <Button
                component={Link}
                to="/trusted-finder/apply"
                variant="outlined"
                sx={outlineBtn}
              >
                Apply as Trusted Finder
              </Button>
            )}
          </Stack>
        </SettingCard>

        <SettingCard
          icon={<NotificationsActiveOutlinedIcon />}
          title="Browser notifications"
          desc={
            subscribed
              ? 'This browser receives geo-fenced alerts when matching items are reported nearby.'
              : 'Get alerted in this browser when matching items are reported near you.'
          }
        >
          {!pushAvailable ? (
            <Alert severity="info">This browser does not support web push notifications.</Alert>
          ) : subscribed ? (
            <Button
              variant="outlined"
              color="error"
              onClick={disablePush}
              disabled={loading}
              sx={{ borderRadius: 999, fontWeight: 700 }}
            >
              {loading ? 'Working…' : 'Unsubscribe from push notifications'}
            </Button>
          ) : (
            <Button variant="outlined" onClick={enablePush} disabled={loading} sx={outlineBtn}>
              {loading ? 'Working…' : 'Enable push notifications'}
            </Button>
          )}
        </SettingCard>

        <SettingCard
          icon={<RedeemOutlinedIcon />}
          title="Redeem points"
          desc={`Balance: ${(user?.pointsBalance ?? 0).toLocaleString()} pts · spend at partner institutions.`}
        >
          {redeemMut.isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              New balance: {redeemMut.data.pointsBalance}
            </Alert>
          )}
          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              size="small"
              label="Points to redeem"
              value={redeem}
              onChange={(e) => setRedeem(Number(e.target.value))}
            />
            <Button
              variant="contained"
              onClick={() => redeemMut.mutate()}
              disabled={redeem <= 0 || redeemMut.isPending}
              sx={{
                bgcolor: MARIGOLD,
                color: INK,
                borderRadius: 999,
                fontWeight: 700,
                px: 2.5,
                '&:hover': { bgcolor: '#cf9305' },
              }}
            >
              Redeem
            </Button>
          </Stack>
        </SettingCard>

        <SettingCard
          icon={<PrivacyTipOutlinedIcon />}
          title="Privacy"
          desc="Export your data, or permanently anonymise your account."
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <Button variant="outlined" onClick={() => exportMut.mutate()} sx={outlineBtn}>
              Download my data
            </Button>
            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                if (confirm('This permanently anonymises your account. Continue?'))
                  deleteMut.mutate();
              }}
              sx={{ borderRadius: 999, fontWeight: 700 }}
            >
              Delete account
            </Button>
          </Stack>
        </SettingCard>
      </Stack>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
