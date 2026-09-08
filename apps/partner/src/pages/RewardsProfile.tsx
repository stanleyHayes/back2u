import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import {
  PartnerWorkspace,
  WorkspaceHeader as PageHeader,
  workspacePanel,
  workspaceHeading,
} from '../components/PartnerWorkspace.js';
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
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useQuery } from '@tanstack/react-query';
import type { InstitutionType } from '@back2u/shared-types';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { uploadImageUrl } from '../lib/cloudinary-upload.js';

const TEAL = '#A8B5A0';
const DISPLAY = 'Outfit, sans-serif';
const PANEL = workspacePanel;

const TYPES: {
  value: InstitutionType;
  label: string;
  description: string;
  icon: typeof StorefrontOutlinedIcon;
}[] = [
  {
    value: 'restaurant',
    label: 'Restaurant',
    description: 'Dining and food experiences',
    icon: RestaurantOutlinedIcon,
  },
  {
    value: 'cafe',
    label: 'Café',
    description: 'Coffee, drinks and light bites',
    icon: LocalCafeOutlinedIcon,
  },
  {
    value: 'mall',
    label: 'Shopping mall',
    description: 'Multiple stores, one destination',
    icon: ShoppingBagOutlinedIcon,
  },
  {
    value: 'retail',
    label: 'Shop / retail',
    description: 'Everyday shopping and retail',
    icon: StorefrontOutlinedIcon,
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy',
    description: 'Health and wellness essentials',
    icon: LocalPharmacyOutlinedIcon,
  },
  { value: 'hotel', label: 'Hotel', description: 'Stays and hospitality', icon: HotelOutlinedIcon },
  {
    value: 'school',
    label: 'Campus',
    description: 'Schools and university communities',
    icon: SchoolOutlinedIcon,
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Another kind of partner venue',
    icon: CategoryOutlinedIcon,
  },
];

function CategoryOption({ option }: { option: (typeof TYPES)[number] }) {
  const Icon = option.icon;
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: '11px',
          bgcolor: 'action.selected',
          color: 'text.primary',
        }}
      >
        <Icon sx={{ fontSize: 21 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{option.label}</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', whiteSpace: 'normal' }}>
          {option.description}
        </Typography>
      </Box>
    </Stack>
  );
}

function RewardsProfileContent() {
  const user = useAuth((s) => s.user);
  const institutionId = user?.institutionId;

  const {
    data: inst,
    isLoading,
    isError,
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
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ mb: 3 }}>
        <PageHeader
          icon={<StorefrontOutlinedIcon />}
          title="Rewards storefront"
          description="Opt in to the bak2me rewards directory so members can discover you and spend their finder points at your venue. Your storefront is advertised for free across the app."
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box sx={PANEL}>
          <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 23, mb: 1 }}>
            Shape your storefront
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            Set your visibility, tell members what you offer, then save to publish your changes.
          </Typography>
          {isError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={<Button onClick={() => refetch()}>Retry</Button>}
            >
              Storefront details could not be loaded.
            </Alert>
          )}
          {feedback && (
            <Alert
              severity={feedback.ok ? 'success' : 'error'}
              sx={{ mb: 2 }}
              onClose={() => setFeedback(null)}
            >
              {feedback.msg}
            </Alert>
          )}
          <Stack
            spacing={2.5}
            sx={{
              '& .MuiFormControlLabel-root': {
                m: 0,
                p: 1.5,
                borderRadius: '15px',
                boxShadow: 'var(--workspace-inset)',
              },
            }}
          >
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
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  renderValue: (value) => {
                    const option = TYPES.find((t) => t.value === value);
                    return option ? <CategoryOption option={option} /> : String(value);
                  },
                  MenuProps: {
                    slotProps: {
                      paper: {
                        sx: {
                          mt: 1,
                          borderRadius: '18px',
                          bgcolor: 'background.default',
                          maxHeight: 440,
                          '& .MuiList-root': { p: 1 },
                          '& .MuiMenuItem-root': {
                            borderRadius: '12px',
                            py: 1.25,
                            whiteSpace: 'normal',
                            gap: 1,
                          },
                        },
                      },
                    },
                  },
                },
              }}
              value={type}
              onChange={(e) => setType(e.target.value as InstitutionType)}
              fullWidth
            >
              {TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  <CategoryOption option={t} />
                  {type === t.value && <CheckRoundedIcon sx={{ ml: 'auto', fontSize: 18 }} />}
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
              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                sx={{ alignItems: 'center', flexWrap: 'wrap' }}
              >
                <Avatar
                  src={logoUrl || undefined}
                  variant="rounded"
                  sx={{
                    width: 64,
                    height: 48,
                    bgcolor: 'rgba(168,181,160,0.15)',
                    color: 'primary.main',
                  }}
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
                  sx={{ color: 'primary.main', borderColor: 'primary.main', fontWeight: 700 }}
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
                disabled={saving || isLoading || isError || uploadingLogo}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {saving ? 'Saving…' : 'Save rewards profile'}
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* Live preview of the directory card */}
        <Box sx={{ ...PANEL, position: { lg: 'sticky' }, top: 100 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
            Directory preview
          </Typography>
          <Box sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Box
              sx={{
                height: 110,
                position: 'relative',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
                background: logoUrl ? undefined : `linear-gradient(135deg, ${TEAL}, #2E3D2F)`,
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
                sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, color: 'text.primary' }}
              >
                {inst?.name ?? 'Your venue'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description || 'Your short description will appear here.'}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'var(--workspace-amber)', fontWeight: 700, display: 'block', mt: 1 }}
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
                  Enable directory listing and save your profile to go live.
                </Typography>
              )}
            </Box>
          </Box>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2, lineHeight: 1.7 }}>
            Preview only. Changes take effect when you save your rewards profile.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function RewardsProfilePage() {
  return (
    <PartnerWorkspace>
      <RewardsProfileContent />
    </PartnerWorkspace>
  );
}
