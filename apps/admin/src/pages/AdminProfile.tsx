import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { uploadImageUrl } from '../lib/cloudinary-upload.js';

const TEAL = '#2DD4BF';
const DISPLAY = '"Fraunces", Georgia, serif';
const PANEL = { p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'background.paper' };

function MetaRow({ label, value, mono, action }: { label: string; value: string; mono?: boolean; action?: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.secondary' }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography sx={{ fontWeight: 600, fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all', fontSize: mono ? 13 : undefined }}>
          {value}
        </Typography>
        {action}
      </Stack>
    </Box>
  );
}

export function AdminProfilePage() {
  const user = useAuth((s) => s.user);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    setFeedback(null);
    try {
      setAvatarUrl(await uploadImageUrl(file, 'avatars'));
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const initial = (name || user.email).charAt(0).toUpperCase();
  let since = '—';
  try {
    since = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    since = '—';
  }

  const dirty = name.trim() !== (user.name ?? '') || (phone ?? '') !== (user.phone ?? '') || (avatarUrl ?? '') !== (user.avatarUrl ?? '');

  const save = async () => {
    if (!name.trim()) {
      setFeedback({ ok: false, msg: 'Name cannot be empty.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await api.updateProfile({ name: name.trim(), phone: phone.trim() || undefined, avatarUrl: avatarUrl.trim() });
      const { accessToken, refreshToken } = useAuth.getState();
      useAuth.getState().set({ user: updated, accessToken: accessToken!, refreshToken: refreshToken! });
      setFeedback({ ok: true, msg: 'Profile updated.' });
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : 'Could not save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const copyId = () => {
    navigator.clipboard?.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, mb: 0.5 }}>
        Account
      </Typography>
      <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 30, color: '#F3F6FB', mb: 3 }}>
        Your profile
      </Typography>

      {/* Identity banner */}
      <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
        <Box sx={{ height: 96, background: `linear-gradient(120deg, ${TEAL} 0%, #0F766E 55%, #0B3D38 100%)` }} />
        <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 3, bgcolor: 'background.paper' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ mt: -5 }}>
            <Avatar
              src={avatarUrl || undefined}
              sx={{ width: 92, height: 92, fontSize: 34, fontWeight: 800, border: '4px solid', borderColor: 'background.paper', bgcolor: '#0F766E', color: '#04201d' }}
            >
              {initial}
            </Avatar>
            <Box sx={{ minWidth: 0, pb: 0.5 }}>
              <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: '#F3F6FB' }}>
                {name || 'Admin'}
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>{user.email}</Typography>
              <Stack direction="row" spacing={1} mt={1.25} flexWrap="wrap" useFlexGap>
                {user.roles.map((r) => (
                  <Chip
                    key={r}
                    label={r.replace(/_/g, ' ')}
                    size="small"
                    sx={{ textTransform: 'capitalize', bgcolor: 'rgba(45,212,191,0.14)', color: TEAL, fontWeight: 700 }}
                  />
                ))}
                {user.emailVerified && (
                  <Chip icon={<VerifiedIcon sx={{ fontSize: 16 }} />} label="Email verified" size="small" color="success" variant="outlined" />
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }, gap: 3, alignItems: 'start' }}>
        {/* Editable details */}
        <Box sx={PANEL}>
          <Typography sx={{ fontWeight: 700, color: '#F3F6FB', mb: 0.5 }}>Personal details</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Update how your name and contact appear across the console.
          </Typography>
          {feedback && (
            <Alert severity={feedback.ok ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
              {feedback.msg}
            </Alert>
          )}
          <Stack spacing={2.25}>
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
            <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth placeholder="+233 …" />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Profile photo
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar src={avatarUrl || undefined} sx={{ width: 56, height: 56, bgcolor: '#0F766E', color: '#04201d', fontWeight: 800 }}>
                  {initial}
                </Avatar>
                <Button
                  component="label"
                  variant="outlined"
                  disabled={uploadingAvatar}
                  startIcon={uploadingAvatar ? <CircularProgress size={16} /> : <PhotoCameraOutlinedIcon />}
                  sx={{ color: TEAL, borderColor: 'rgba(45,212,191,0.4)', fontWeight: 700 }}
                >
                  {uploadingAvatar ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                  <input hidden type="file" accept="image/*" onChange={onPickAvatar} />
                </Button>
                {avatarUrl && !uploadingAvatar && (
                  <Button color="inherit" onClick={() => setAvatarUrl('')} sx={{ color: 'text.secondary' }}>
                    Remove
                  </Button>
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="contained"
                onClick={save}
                disabled={saving || !dirty}
                sx={{ bgcolor: TEAL, color: '#04201d', fontWeight: 700, '&:hover': { bgcolor: '#5fe6d4' } }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {dirty && !saving && (
                <Button
                  color="inherit"
                  onClick={() => {
                    setName(user.name ?? '');
                    setPhone(user.phone ?? '');
                    setAvatarUrl(user.avatarUrl ?? '');
                    setFeedback(null);
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  Reset
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Account meta */}
        <Box sx={PANEL}>
          <Typography sx={{ fontWeight: 700, color: '#F3F6FB', mb: 2 }}>Account</Typography>
          <Stack spacing={2.25}>
            <MetaRow label="Status" value={user.status ?? 'active'} />
            <MetaRow label="Member since" value={since} />
            <MetaRow
              label="User ID"
              value={user.id}
              mono
              action={
                <Tooltip title={copied ? 'Copied!' : 'Copy ID'}>
                  <IconButton size="small" onClick={copyId} sx={{ color: copied ? '#4ade80' : 'text.secondary' }}>
                    {copied ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              }
            />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
