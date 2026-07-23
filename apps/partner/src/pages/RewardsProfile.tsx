import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { useQuery } from '@tanstack/react-query';
import type { InstitutionType } from '@back2u/shared-types';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { uploadImageUrl } from '../lib/cloudinary-upload.js';

const TEAL = '#2DD4BF';
const DISPLAY = '"Fraunces", Georgia, serif';
const PANEL = {
  p: { xs: 2.5, md: 3 },
  borderRadius: 3,
  border: '1px solid rgba(255,255,255,0.08)',
  bgcolor: 'background.paper',
};

const TYPES: { value: InstitutionType; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'mall', label: 'Shopping mall' },
  { value: 'retail', label: 'Shop / retail' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'school', label: 'Campus' },
  { value: 'other', label: 'Other' },
];

export function RewardsProfilePage() {
  const user = useAuth((s) => s.user);
  const institutionId = user?.institutionId;

  const {
    data: inst,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-institution', institutionId],
    queryFn: () => api.getInstitution(institutionId!),
    enabled: !!institutionId,
  });

  const [listed, setListed] = useState(false);
  const [redeemable, setRedeemable] = useState(true);
  const [type, setType] = useState<InstitutionType>('restaurant');
  const [rate, setRate] = useState('1');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingLogo(true);
    setFeedback(null);
    try {
      setLogoUrl(await uploadImageUrl(file, 'partner-logos'));
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (!inst) return;
    setListed(inst.rewardsListed ?? false);
    setRedeemable(inst.pointsRedeemable ?? true);
    setType((inst.type as InstitutionType) ?? 'restaurant');
    setRate(String(inst.pointToCurrencyRate ?? 1));
    setLogoUrl(inst.logoUrl ?? '');
    setDescription(inst.description ?? '');
    setWebsite(inst.website ?? '');
  }, [inst]);

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await api.updateRewardsProfile({
        rewardsListed: listed,
        pointsRedeemable: redeemable,
        type,
        pointToCurrencyRate: Number(rate) || 1,
        logoUrl: logoUrl.trim(),
        description: description.trim(),
        website: website.trim(),
      });
      await refetch();
      setFeedback({ ok: true, msg: 'Rewards profile saved.' });
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  if (!institutionId) {
    return <Alert severity="warning">Your account is not linked to an institution yet.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 880 }}>
      <Typography
        sx={{
          color: TEAL,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 12,
          mb: 0.5,
        }}
      >
        Commerce
      </Typography>
      <Typography
        sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 30, color: '#F3F6FB', mb: 1 }}
      >
        Rewards storefront
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 620 }}>
        Opt in to the Back2u rewards directory so members can discover you and spend their finder
        points at your venue. Your storefront is advertised for free across the app.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box sx={PANEL}>
          {feedback && (
            <Alert
              severity={feedback.ok ? 'success' : 'error'}
              sx={{ mb: 2 }}
              onClose={() => setFeedback(null)}
            >
              {feedback.msg}
            </Alert>
          )}
          <Stack spacing={2.5}>
            <FormControlLabel
              control={<Switch checked={listed} onChange={(e) => setListed(e.target.checked)} />}
              label="List us in the public rewards directory"
            />
            <FormControlLabel
              control={
                <Switch checked={redeemable} onChange={(e) => setRedeemable(e.target.checked)} />
              }
              label="Accept point redemptions at our counter"
            />
            <TextField
              select
              label="Category"
              value={type}
              onChange={(e) => setType(e.target.value as InstitutionType)}
              fullWidth
            >
              {TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Points → GHS rate (pesewa per point)"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              fullWidth
              helperText={`At this rate, 100 points ≈ GHS ${((100 * (Number(rate) || 0)) / 100).toFixed(2)} for the member.`}
            />
            <TextField
              label="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              slotProps={{ htmlInput: { maxLength: 600 } }}
              helperText={`${description.length}/600 — what members get when they visit you.`}
            />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Storefront logo / cover image
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Avatar
                  src={logoUrl || undefined}
                  variant="rounded"
                  sx={{ width: 64, height: 48, bgcolor: 'rgba(45,212,191,0.15)', color: TEAL }}
                >
                  {(inst?.name ?? 'P').charAt(0)}
                </Avatar>
                <Button
                  component="label"
                  variant="outlined"
                  disabled={uploadingLogo}
                  startIcon={
                    uploadingLogo ? <CircularProgress size={16} /> : <PhotoCameraOutlinedIcon />
                  }
                  sx={{ color: TEAL, borderColor: 'rgba(45,212,191,0.4)', fontWeight: 700 }}
                >
                  {uploadingLogo ? 'Uploading…' : logoUrl ? 'Change image' : 'Upload image'}
                  <input hidden type="file" accept="image/*" onChange={onPickLogo} />
                </Button>
                {logoUrl && !uploadingLogo && (
                  <Button
                    color="inherit"
                    onClick={() => setLogoUrl('')}
                    sx={{ color: 'text.secondary' }}
                  >
                    Remove
                  </Button>
                )}
              </Stack>
            </Box>
            <TextField
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              fullWidth
              placeholder="https://…"
            />
            <Box>
              <Button
                variant="contained"
                onClick={save}
                disabled={saving || isLoading}
                sx={{
                  bgcolor: TEAL,
                  color: '#04201d',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#5fe6d4' },
                }}
              >
                {saving ? 'Saving…' : 'Save rewards profile'}
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* Live preview of the directory card */}
        <Box sx={PANEL}>
          <Typography sx={{ fontWeight: 700, color: '#F3F6FB', mb: 2 }}>
            Directory preview
          </Typography>
          <Box
            sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Box
              sx={{
                height: 110,
                position: 'relative',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
                background: logoUrl ? undefined : `linear-gradient(135deg, ${TEAL}, #0B3D38)`,
              }}
            >
              {logoUrl ? (
                <Box
                  component="img"
                  src={logoUrl}
                  alt=""
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.2)', width: 52, height: 52 }}>
                  {(inst?.name ?? 'P').charAt(0)}
                </Avatar>
              )}
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography
                sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: '#F3F6FB' }}
              >
                {inst?.name ?? 'Your venue'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description || 'Your short description will appear here.'}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#E0A106', fontWeight: 700, display: 'block', mt: 1 }}
              >
                {TYPES.find((t) => t.value === type)?.label} · 100 pts ≈ GHS{' '}
                {((100 * (Number(rate) || 0)) / 100).toFixed(2)}
              </Typography>
              {!listed && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}
                >
                  Turn on “List us in the public rewards directory” to go live.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
