import { useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import QRCode from 'react-qr-code';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { useMutation } from '@tanstack/react-query';
import { PageHeader, type ConsoleThemeMode } from '@back2u/ui-web';
import type { EmailPreferences, Locale } from '@back2u/shared-types';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { useUi } from '../lib/ui.store.js';
import { uploadImageUrl } from '../lib/cloudinary-upload.js';

const INK = '#2E3D2F';
const MARIGOLD = '#8B6F4E';

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'tw', label: 'Twi' },
  { value: 'ga', label: 'Ga' },
  { value: 'ee', label: 'Eʋe' },
];

const EMAIL_PREFS: { key: keyof EmailPreferences; label: string; desc: string }[] = [
  {
    key: 'matches',
    label: 'Match alerts',
    desc: 'When the AI links a lost report to a found item at your venue.',
  },
  { key: 'chat', label: 'Messages', desc: 'New anonymous chat messages on your items.' },
  { key: 'courier', label: 'Courier updates', desc: 'Pickup and delivery status changes.' },
  { key: 'reminders', label: 'Reminders', desc: 'Expiring items and pending actions.' },
  {
    key: 'marketing',
    label: 'Product news',
    desc: 'Occasional feature announcements from Back2u.',
  },
];

function errMsg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function SettingCard({
  title,
  desc,
  children,
  action,
}: {
  title: string;
  desc?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
          {desc && (
            <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 0.5 }}>{desc}</Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
}

/* ---------------------------------- Profile --------------------------------- */

function ProfileSection() {
  const user = useAuth((s) => s.user)!;
  const updateUser = useAuth((s) => s.updateUser);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [uploading, setUploading] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const save = useMutation({
    mutationFn: () => api.updateProfile({ name: name.trim(), phone }),
    onSuccess: (u) => {
      updateUser(u);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const onAvatarPick = async (file: File) => {
    setUploading(true);
    setAvatarErr(null);
    try {
      const url = await uploadImageUrl(file, 'avatars');
      updateUser(await api.updateProfile({ avatarUrl: url }));
    } catch (e) {
      setAvatarErr(errMsg(e, 'Photo upload failed — try again'));
    } finally {
      setUploading(false);
    }
  };

  const dirty = name.trim() !== user.name || phone !== (user.phone ?? '');

  return (
    <Stack spacing={2.5}>
      <SettingCard
        title="Profile"
        desc="How you appear to the Back2u team and in redemption receipts."
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <Box sx={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
            <Avatar
              src={user.avatarUrl}
              sx={{ width: 84, height: 84, fontSize: 32, fontWeight: 800 }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Tooltip title="Change photo">
              <IconButton
                size="small"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                sx={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  bgcolor: MARIGOLD,
                  color: INK,
                  '&:hover': { bgcolor: '#6F5940' },
                }}
              >
                {uploading ? (
                  <CircularProgress size={16} sx={{ color: INK }} />
                ) : (
                  <PhotoCameraOutlinedIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onAvatarPick(f);
                e.target.value = '';
              }}
            />
          </Box>
          <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              helperText="Changing your phone number resets its verification."
            />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 2.5, alignItems: 'center' }}>
          <Button
            variant="contained"
            disabled={!dirty || !name.trim() || save.isPending}
            onClick={() => save.mutate()}
            sx={{
              bgcolor: MARIGOLD,
              color: INK,
              borderRadius: 999,
              fontWeight: 700,
              '&:hover': { bgcolor: '#6F5940' },
            }}
          >
            {save.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {saved && <Chip size="small" color="success" icon={<CheckRoundedIcon />} label="Saved" />}
        </Stack>
        {save.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errMsg(save.error, 'Failed to save profile')}
          </Alert>
        )}
        {avatarErr && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setAvatarErr(null)}>
            {avatarErr}
          </Alert>
        )}
      </SettingCard>

      <SettingCard
        title="Email"
        desc="Sign-in identity for the partner portal. Contact Back2u support to change it."
        action={
          user.emailVerified ? (
            <Chip
              size="small"
              color="success"
              icon={<VerifiedUserOutlinedIcon />}
              label="Verified"
            />
          ) : (
            <Chip size="small" color="warning" label="Unverified" />
          )
        }
      >
        <Typography sx={{ fontFamily: 'ui-monospace, monospace', fontSize: 14 }}>
          {user.email}
        </Typography>
      </SettingCard>
    </Stack>
  );
}

/* ---------------------------------- Security -------------------------------- */

function ChangePasswordCard() {
  const user = useAuth((s) => s.user)!;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const change = useMutation({
    mutationFn: () => api.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    },
  });
  const reset = useMutation({
    mutationFn: () => api.requestPasswordReset(user.email),
    onSuccess: () => setResetSent(true),
  });

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && !change.isPending;

  return (
    <SettingCard title="Password" desc="Changing your password signs out every other device.">
      <Stack spacing={2} sx={{ maxWidth: 440 }}>
        {done && (
          <Alert severity="success">Password updated. Other sessions have been signed out.</Alert>
        )}
        {change.isError && (
          <Alert severity="error">{errMsg(change.error, 'Failed to change password')}</Alert>
        )}
        <TextField
          label="Current password"
          type={show ? 'text' : 'password'}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          type={show ? 'text' : 'password'}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          error={tooShort}
          helperText={tooShort ? 'At least 8 characters.' : ' '}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShow((v) => !v)}
                    edge="end"
                    aria-label="Toggle password visibility"
                  >
                    {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Confirm new password"
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={mismatch}
          helperText={mismatch ? 'Passwords do not match.' : ' '}
        />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            disabled={!canSubmit}
            onClick={() => change.mutate()}
            sx={{
              bgcolor: MARIGOLD,
              color: INK,
              borderRadius: 999,
              fontWeight: 700,
              '&:hover': { bgcolor: '#6F5940' },
            }}
          >
            {change.isPending ? 'Updating…' : 'Update password'}
          </Button>
          {resetSent ? (
            <Typography sx={{ fontSize: 13, color: 'success.main' }}>
              Reset link sent to {user.email}.
            </Typography>
          ) : (
            <Button
              size="small"
              onClick={() => reset.mutate()}
              disabled={reset.isPending}
              sx={{ color: 'text.secondary' }}
            >
              Forgot it? Email me a reset link
            </Button>
          )}
        </Stack>
      </Stack>
    </SettingCard>
  );
}

function MfaCard() {
  const user = useAuth((s) => s.user)!;
  const updateUser = useAuth((s) => s.updateUser);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const setup = useMutation({ mutationFn: () => api.setupMfa() });
  const enable = useMutation({
    mutationFn: () => api.enableMfa(code),
    onSuccess: (u) => {
      updateUser(u);
      setEnrollOpen(false);
    },
  });
  const disable = useMutation({
    mutationFn: () => api.disableMfa(code),
    onSuccess: (u) => {
      updateUser(u);
      setDisableOpen(false);
    },
  });

  const openEnroll = () => {
    setCode('');
    enable.reset();
    setEnrollOpen(true);
    setup.mutate();
  };
  const openDisable = () => {
    setCode('');
    disable.reset();
    setDisableOpen(true);
  };

  const copySecret = async () => {
    if (!setup.data) return;
    await navigator.clipboard.writeText(setup.data.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SettingCard
      title="Two-factor authentication"
      desc="Require a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password…) at sign-in."
      action={
        user.mfaEnabled ? (
          <Chip size="small" color="success" icon={<VerifiedUserOutlinedIcon />} label="Enabled" />
        ) : (
          <Chip size="small" variant="outlined" label="Off" />
        )
      }
    >
      {user.mfaEnabled ? (
        <Button
          variant="outlined"
          color="inherit"
          onClick={openDisable}
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          Disable MFA
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={openEnroll}
          startIcon={<SecurityOutlinedIcon />}
          sx={{
            bgcolor: MARIGOLD,
            color: INK,
            borderRadius: 999,
            fontWeight: 700,
            '&:hover': { bgcolor: '#6F5940' },
          }}
        >
          Set up authenticator
        </Button>
      )}

      {/* Enrollment dialog */}
      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Set up two-factor authentication</DialogTitle>
        <DialogContent>
          {setup.isPending && (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
              <CircularProgress size={26} />
            </Box>
          )}
          {setup.isError && (
            <Alert severity="error">{errMsg(setup.error, 'Could not start MFA setup')}</Alert>
          )}
          {setup.data && (
            <Stack spacing={2}>
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                1. Scan this QR code with your authenticator app.
              </Typography>
              <Box sx={{ display: 'grid', placeItems: 'center' }}>
                <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2 }}>
                  <QRCode value={setup.data.otpauthUrl} size={168} />
                </Box>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <Typography
                  sx={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 12.5,
                    letterSpacing: '0.08em',
                    wordBreak: 'break-all',
                  }}
                >
                  {setup.data.secret}
                </Typography>
                <Tooltip title={copied ? 'Copied' : 'Copy secret'}>
                  <IconButton size="small" onClick={() => void copySecret()}>
                    {copied ? (
                      <CheckRoundedIcon fontSize="small" />
                    ) : (
                      <ContentCopyOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Stack>
              <Divider />
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                2. Enter the 6-digit code the app shows to confirm.
              </Typography>
              <TextField
                label="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                    style: { letterSpacing: '0.4em', textAlign: 'center', fontSize: 18 },
                  },
                }}
                autoFocus
              />
              {enable.isError && (
                <Alert severity="error">{errMsg(enable.error, 'Invalid code')}</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEnrollOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={code.length !== 6 || enable.isPending || !setup.data}
            onClick={() => enable.mutate()}
            sx={{
              bgcolor: MARIGOLD,
              color: INK,
              borderRadius: 999,
              fontWeight: 700,
              '&:hover': { bgcolor: '#6F5940' },
            }}
          >
            {enable.isPending ? 'Verifying…' : 'Turn on MFA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disable dialog */}
      <Dialog open={disableOpen} onClose={() => setDisableOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Disable two-factor authentication</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Enter a current code from your authenticator app to confirm. Your account will fall
              back to password-only sign-in.
            </Typography>
            <TextField
              label="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              slotProps={{
                htmlInput: {
                  inputMode: 'numeric',
                  style: { letterSpacing: '0.4em', textAlign: 'center', fontSize: 18 },
                },
              }}
              autoFocus
            />
            {disable.isError && (
              <Alert severity="error">{errMsg(disable.error, 'Invalid code')}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDisableOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={code.length !== 6 || disable.isPending}
            onClick={() => disable.mutate()}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            {disable.isPending ? 'Verifying…' : 'Disable MFA'}
          </Button>
        </DialogActions>
      </Dialog>
    </SettingCard>
  );
}

/* -------------------------------- Preferences ------------------------------- */

function PreferencesSection() {
  const user = useAuth((s) => s.user)!;
  const updateUser = useAuth((s) => s.updateUser);
  const themeMode = useUi((s) => s.themeMode);
  const setThemeMode = useUi((s) => s.setThemeMode);
  const [locale, setLocale] = useState<Locale>(user.locale ?? 'en');

  const saveLocale = useMutation({
    mutationFn: (l: Locale) => api.setLocale(l),
    onSuccess: (_res, l) => updateUser({ ...user, locale: l }),
  });

  return (
    <Stack spacing={2.5}>
      <SettingCard title="Theme" desc="Choose how the portal looks on this device.">
        <ToggleButtonGroup
          exclusive
          value={themeMode}
          onChange={(_e, v: ConsoleThemeMode | null) => {
            if (v) setThemeMode(v);
          }}
          size="small"
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="dark" sx={{ px: 2, gap: 1 }}>
            <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> Dark
          </ToggleButton>
          <ToggleButton value="light" sx={{ px: 2, gap: 1 }}>
            <LightModeOutlinedIcon sx={{ fontSize: 18 }} /> Light
          </ToggleButton>
          <ToggleButton value="system" sx={{ px: 2, gap: 1 }}>
            <SettingsBrightnessOutlinedIcon sx={{ fontSize: 18 }} /> System
          </ToggleButton>
        </ToggleButtonGroup>
      </SettingCard>

      <SettingCard
        title="Language"
        desc="Used for the emails and notifications Back2u sends to your account."
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            select
            label="Language"
            value={locale}
            onChange={(e) => {
              const l = e.target.value as Locale;
              setLocale(l);
              saveLocale.mutate(l);
            }}
            sx={{ minWidth: 220 }}
          >
            {LANGUAGES.map((l) => (
              <MenuItem key={l.value} value={l.value}>
                {l.label}
              </MenuItem>
            ))}
          </TextField>
          {saveLocale.isPending && <CircularProgress size={18} />}
          {saveLocale.isSuccess && (
            <Chip size="small" color="success" icon={<CheckRoundedIcon />} label="Saved" />
          )}
        </Stack>
        {saveLocale.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errMsg(saveLocale.error, 'Failed to save language')}
          </Alert>
        )}
      </SettingCard>
    </Stack>
  );
}

/* ------------------------------- Notifications ------------------------------ */

function NotificationsSection() {
  const user = useAuth((s) => s.user)!;
  const updateUser = useAuth((s) => s.updateUser);
  const prefs = user.emailPreferences ?? {};

  const save = useMutation({
    mutationFn: (next: EmailPreferences) => api.updateEmailPreferences(next),
    onSuccess: (u) => updateUser(u),
  });

  const toggle = (key: keyof EmailPreferences, value: boolean) => {
    // Patch only the changed key — the server merges, so concurrent changes
    // from another tab/device are not clobbered by a stale snapshot.
    const patch: EmailPreferences = {};
    patch[key] = value;
    save.mutate(patch);
  };

  return (
    <Stack spacing={2.5}>
      <SettingCard
        title="Email notifications"
        desc="Pick what lands in your inbox. In-app notifications always show under the bell."
      >
        <Stack divider={<Divider />} spacing={0}>
          {EMAIL_PREFS.map((p) => (
            <Stack
              key={p.key}
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}
            >
              <Box sx={{ pr: 2 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>{p.label}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{p.desc}</Typography>
              </Box>
              <Switch
                checked={prefs[p.key] !== false}
                onChange={(_e, v) => toggle(p.key, v)}
                disabled={save.isPending}
              />
            </Stack>
          ))}
        </Stack>
        {save.isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {errMsg(save.error, 'Failed to update preferences')}
          </Alert>
        )}
      </SettingCard>

      <SettingCard
        title="Notification inbox"
        desc="Browse the full history of everything the portal has told you."
      >
        <Button
          component={RouterLink}
          to="/notifications"
          variant="outlined"
          color="inherit"
          startIcon={<OpenInNewOutlinedIcon />}
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          Open inbox
        </Button>
      </SettingCard>
    </Stack>
  );
}

/* ------------------------------ Data & session ------------------------------ */

function DataSection() {
  const clear = useAuth((s) => s.clear);
  const setTourOpen = useUi((s) => s.setTourOpen);
  const [exported, setExported] = useState(false);

  const exportData = useMutation({
    mutationFn: () => api.exportMyData(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'back2u-account-export.json';
      a.click();
      URL.revokeObjectURL(url);
      setExported(true);
    },
  });

  return (
    <Stack spacing={2.5}>
      <SettingCard
        title="Export my data"
        desc="Download a JSON copy of everything linked to your account."
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DownloadOutlinedIcon />}
            onClick={() => exportData.mutate()}
            disabled={exportData.isPending}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            {exportData.isPending ? 'Preparing…' : 'Download export'}
          </Button>
          {exported && (
            <Chip size="small" color="success" icon={<CheckRoundedIcon />} label="Downloaded" />
          )}
        </Stack>
        {exportData.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errMsg(exportData.error, 'Export failed')}
          </Alert>
        )}
      </SettingCard>

      <SettingCard title="Portal tour" desc="Replay the guided walkthrough of the partner portal.">
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ReplayOutlinedIcon />}
          onClick={() => setTourOpen(true)}
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          Replay tutorial
        </Button>
      </SettingCard>

      <SettingCard title="Session" desc="Sign out of the partner portal on this device.">
        <Button
          onClick={clear}
          startIcon={<LogoutIcon />}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          Sign out
        </Button>
      </SettingCard>
    </Stack>
  );
}

/* ----------------------------------- Page ----------------------------------- */

const TABS = [
  { key: 'profile', label: 'Profile', icon: <PersonOutlineIcon /> },
  { key: 'security', label: 'Security', icon: <SecurityOutlinedIcon /> },
  { key: 'preferences', label: 'Preferences', icon: <TuneOutlinedIcon /> },
  { key: 'notifications', label: 'Notifications', icon: <NotificationsNoneOutlinedIcon /> },
  { key: 'data', label: 'Data & session', icon: <StorageOutlinedIcon /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function PartnerSettingsPage() {
  const user = useAuth((s) => s.user);
  const [tab, setTab] = useState<TabKey>('profile');

  if (!user) return null;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 760, mx: 'auto', width: '100%' }}>
      <PageHeader
        icon={<SettingsOutlinedIcon />}
        title="Settings"
        description="Profile, security, appearance, language and notification controls for your partner account."
      />
      <Tabs
        value={tab}
        onChange={(_e, v: TabKey) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            label={t.label}
            icon={t.icon}
            iconPosition="start"
            sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600 }}
          />
        ))}
      </Tabs>
      <Box>
        {tab === 'profile' && <ProfileSection />}
        {tab === 'security' && (
          <Stack spacing={2.5}>
            <ChangePasswordCard />
            <MfaCard />
          </Stack>
        )}
        {tab === 'preferences' && <PreferencesSection />}
        {tab === 'notifications' && <NotificationsSection />}
        {tab === 'data' && <DataSection />}
      </Box>
    </Stack>
  );
}
