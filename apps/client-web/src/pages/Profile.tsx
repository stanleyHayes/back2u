import { useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { uploadAvatar } from '../lib/cloudinary-upload.js';
import type { ItemDTO } from '@back2u/shared-types';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const CLAY = '#C2410C';
const DISPLAY = '"Black Ops One", Georgia, serif';

function formatExpiryStatus(item: ItemDTO): string | null {
  if (item.status !== 'open' || !item.expiresAt) return null;
  const msLeft = new Date(item.expiresAt).getTime() - Date.now();
  if (msLeft <= 0) return 'Expired';
  const days = Math.ceil(msLeft / 86_400_000);
  return days <= 3 ? `Expires in ${days} day${days === 1 ? '' : 's'}` : null;
}

function StarRating({ value, size = 16 }: { value?: number; size?: number }) {
  if (!value || value <= 0) return null;
  return (
    <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Box
          key={s}
          component="span"
          sx={{ fontSize: size, color: s <= Math.round(value) ? MARIGOLD : 'text.disabled' }}
        >
          {s <= Math.round(value) ? '★' : '☆'}
        </Box>
      ))}
      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
        {value.toFixed(1)}
      </Typography>
    </Stack>
  );
}

function SectionTitle({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count?: number;
}) {
  return (
    <Box>
      <Typography
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 11,
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: 'text.primary' }}
      >
        {title}
        {count !== undefined && count > 0 && (
          <Box component="span" sx={{ color: 'text.secondary', fontFamily: 'inherit' }}>
            {' '}
            ({count})
          </Box>
        )}
      </Typography>
    </Box>
  );
}

function ProfileItemRow({ item, action }: { item: ItemDTO; action?: ReactNode }) {
  const isFound = item.kind === 'found';
  const expiry = formatExpiryStatus(item);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.25,
        borderRadius: '16px 16px 16px 4px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'transform .15s, box-shadow .15s',
        '&:hover': {
          transform: 'translateX(3px)',
          boxShadow: '0 16px 30px -26px rgba(11,61,56,.5)',
        },
      }}
    >
      <Box
        component={Link}
        to={`/items/${item.id}`}
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          bgcolor: isFound ? 'rgba(15,118,110,0.08)' : 'rgba(194,65,12,0.08)',
        }}
      >
        {item.images[0]?.url ? (
          <Box
            component="img"
            src={item.images[0].url}
            alt={item.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>No photo</Typography>
        )}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component={Link}
          to={`/items/${item.id}`}
          noWrap
          sx={{
            display: 'block',
            fontWeight: 700,
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {item.title}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}
          useFlexGap
        >
          <Chip
            size="small"
            label={item.kind}
            sx={{
              textTransform: 'capitalize',
              height: 20,
              fontWeight: 700,
              bgcolor: isFound ? 'rgba(15,118,110,0.12)' : 'rgba(194,65,12,0.12)',
              color: isFound ? 'primary.main' : CLAY,
            }}
          />
          {expiry && (
            <Chip
              size="small"
              label={expiry}
              color="warning"
              variant="outlined"
              sx={{ height: 20 }}
            />
          )}
        </Stack>
      </Box>
      {action}
    </Box>
  );
}

function OpenItemsSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['items', 'profile', userId],
    queryFn: () => api.listItems({ postedById: userId, status: 'open', pageSize: 100 }),
  });

  const bump = useMutation({
    mutationFn: (id: string) => api.bumpItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'profile', userId] });
    },
  });

  return (
    <Stack spacing={1.5}>
      <SectionTitle eyebrow="Active" title="Your open items" count={data?.items.length} />
      {isLoading ? (
        <ListSkeleton rows={3} avatar={false} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          dense
          tone="teal"
          icon={<Inventory2OutlinedIcon />}
          title="No open items"
          description="Post a lost or found item and it'll show up here."
          actions={[{ label: 'Post an item', onClick: () => navigate('/post') }]}
        />
      ) : (
        data.items.map((item) => {
          const canBump =
            item.status === 'open' &&
            item.expiresAt &&
            new Date(item.expiresAt).getTime() - Date.now() <= 7 * 86_400_000;
          return (
            <ProfileItemRow
              key={item.id}
              item={item}
              action={
                canBump ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => bump.mutate(item.id)}
                    disabled={bump.isPending && bump.variables === item.id}
                    sx={{ borderRadius: 999, fontWeight: 700, flexShrink: 0 }}
                  >
                    {bump.isPending && bump.variables === item.id ? 'Bumping…' : 'Bump'}
                  </Button>
                ) : undefined
              }
            />
          );
        })
      )}
    </Stack>
  );
}

function ReturnedItemsSection({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['items', 'profile', userId, 'returned'],
    queryFn: () => api.listItems({ postedById: userId, status: 'returned', pageSize: 100 }),
  });

  if (isLoading) return <ListSkeleton rows={2} avatar={false} />;
  if (!data || data.items.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      <SectionTitle eyebrow="Reunited" title="Items returned" count={data.items.length} />
      {data.items.map((item) => (
        <ProfileItemRow
          key={item.id}
          item={item}
          action={
            <Chip
              size="small"
              icon={<VolunteerActivismOutlinedIcon sx={{ fontSize: 15 }} />}
              label="Returned"
              color="success"
              variant="outlined"
              sx={{ flexShrink: 0 }}
            />
          }
        />
      ))}
    </Stack>
  );
}

function ReviewsSection({ userId }: { userId: string }) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => api.listReviewsForUser(userId, 10),
  });

  if (isLoading) return <ListSkeleton rows={2} avatar={false} />;
  if (!reviews || reviews.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      <SectionTitle eyebrow="From the community" title="Recent reviews" count={reviews.length} />
      {reviews.map((review) => (
        <Box
          key={review.id}
          sx={{
            p: 2,
            borderRadius: '16px 16px 16px 4px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', mb: 0.5, justifyContent: 'space-between' }}
          >
            <StarRating value={review.rating} size={15} />
            <Typography variant="caption" color="text.secondary">
              {new Date(review.createdAt).toLocaleDateString()}
            </Typography>
          </Stack>
          {review.comment && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
              {review.comment}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: { main: string; soft: string };
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 2.25,
        borderRadius: '18px 18px 18px 4px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: tone.soft,
          color: tone.main,
          mb: 1.25,
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: 30,
          color: 'text.primary',
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

export function ProfilePage() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      setEditing(false);
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Failed to save'),
  });

  if (!user) return null;

  const startEditing = () => {
    setName(user.name);
    setPhone(user.phone ?? '');
    setAvatarUrl(user.avatarUrl);
    setError(null);
    setEditing(true);
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      {/* Hero banner */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 3, md: 4 },
          borderRadius: '28px 28px 28px 10px',
          bgcolor: INK,
          color: PAPER,
        }}
      >
        {/* decorative grid + glow */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,253,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,253,248,0.05) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
            maskImage: 'radial-gradient(70% 70% at 80% 20%, #000, transparent)',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: -120,
            top: -120,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(224,161,6,0.22), transparent 60%)',
          }}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, position: 'relative' }}
        >
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                p: '3px',
                borderRadius: '50%',
                background: `linear-gradient(150deg, ${MARIGOLD}, ${TEAL})`,
                display: 'inline-flex',
              }}
            >
              <Avatar
                src={editing ? avatarUrl : user.avatarUrl}
                sx={{ width: 84, height: 84, fontSize: 34, border: '3px solid', borderColor: INK }}
              >
                {user.name[0]}
              </Avatar>
            </Box>
            {editing && (
              <>
                <IconButton
                  size="small"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: PAPER,
                    color: INK,
                    '&:hover': { bgcolor: '#efe7d6' },
                  }}
                  aria-label="Change avatar"
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
              </>
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: MARIGOLD,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              {editing ? 'Editing profile' : 'Your profile'}
            </Typography>
            <Typography
              sx={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: { xs: 28, md: 34 },
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {user.name}
            </Typography>
            <Typography sx={{ color: 'rgba(255,253,248,0.7)', fontSize: 14.5 }}>
              {user.email}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap' }} useFlexGap>
              {user.trustedFinder && (
                <Chip
                  size="small"
                  icon={<WorkspacePremiumIcon sx={{ fontSize: 15, color: `${INK} !important` }} />}
                  label="Trusted Finder"
                  sx={{ bgcolor: MARIGOLD, color: INK, fontWeight: 700 }}
                />
              )}
              {user.roles.map((r) => (
                <Chip
                  key={r}
                  size="small"
                  label={r.replace(/_/g, ' ')}
                  sx={{
                    textTransform: 'capitalize',
                    bgcolor: 'rgba(255,253,248,0.1)',
                    color: PAPER,
                    border: '1px solid rgba(255,253,248,0.18)',
                  }}
                />
              ))}
              {user.phone && (
                <Chip
                  size="small"
                  icon={
                    user.phoneVerified ? (
                      <VerifiedRoundedIcon sx={{ fontSize: 15, color: '#7fe0c8 !important' }} />
                    ) : undefined
                  }
                  label={
                    user.phoneVerified ? `${user.phone} · verified` : `${user.phone} · unverified`
                  }
                  sx={{
                    bgcolor: 'rgba(255,253,248,0.1)',
                    color: PAPER,
                    border: '1px solid rgba(255,253,248,0.18)',
                  }}
                />
              )}
            </Stack>
          </Box>

          {!editing && (
            <Button
              onClick={startEditing}
              startIcon={<EditOutlinedIcon />}
              sx={{
                color: PAPER,
                fontWeight: 700,
                borderRadius: 999,
                px: 2,
                border: '1px solid rgba(255,253,248,0.3)',
                alignSelf: { xs: 'stretch', sm: 'flex-start' },
                '&:hover': { borderColor: MARIGOLD, color: MARIGOLD },
              }}
            >
              Edit
            </Button>
          )}
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {editing ? (
        <Box
          sx={{
            mt: 2.5,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: '24px 24px 24px 8px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={2.25}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              placeholder="+233…"
              helperText={
                user.phoneVerified
                  ? 'Changing your number will require re-verification.'
                  : undefined
              }
            />
            {uploading && (
              <Typography variant="caption" color="text.secondary">
                Uploading avatar…
              </Typography>
            )}
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={() => save.mutate()}
                disabled={save.isPending || uploading || name.trim().length === 0}
                sx={{
                  bgcolor: INK,
                  color: PAPER,
                  borderRadius: 999,
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#0a322e' },
                }}
              >
                {save.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                color="inherit"
                onClick={() => setEditing(false)}
                disabled={save.isPending}
                sx={{ fontWeight: 600 }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <>
          {/* Stats */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2.5 }}>
            <StatCard
              icon={<MilitaryTechOutlinedIcon />}
              label="Reputation score"
              value={user.reputationScore}
              tone={{ main: TEAL, soft: 'rgba(15,118,110,0.12)' }}
            />
            <StatCard
              icon={<SavingsOutlinedIcon />}
              label="Points balance"
              value={user.pointsBalance.toLocaleString()}
              tone={{ main: MARIGOLD, soft: 'rgba(224,161,6,0.14)' }}
            />
            <StatCard
              icon={<VolunteerActivismOutlinedIcon />}
              label="Returns confirmed"
              value={user.successfulReturns ?? 0}
              tone={{ main: CLAY, soft: 'rgba(194,65,12,0.12)' }}
            />
          </Stack>

          {/* Sections */}
          <Stack spacing={4} sx={{ mt: 4 }}>
            <OpenItemsSection userId={user.id} />
            <ReturnedItemsSection userId={user.id} />
            <ReviewsSection userId={user.id} />
          </Stack>
        </>
      )}
    </Box>
  );
}
