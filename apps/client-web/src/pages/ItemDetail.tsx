import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import HourglassBottomOutlinedIcon from '@mui/icons-material/HourglassBottomOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { EmptyState, DetailSkeleton, neuShadow } from '@back2u/ui-web';
import SearchOffIcon from '@mui/icons-material/SearchOff';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { ShareButton } from '../components/ShareButton.js';
import { ImageLightbox } from '../components/ImageLightbox.js';

function isExpiringWithin7Days(item: { expiresAt?: string; status: string }): boolean {
  if (!item.expiresAt || item.status !== 'open') return false;
  const msLeft = new Date(item.expiresAt).getTime() - Date.now();
  return msLeft > 0 && msLeft <= 7 * 86_400_000;
}

function StarButton({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      sx={{ minWidth: 36, fontSize: 24, color: filled ? '#8B6F4E' : 'text.disabled', p: 0 }}
    >
      {filled ? '★' : '☆'}
    </Button>
  );
}

function ReviewPrompt({ matchId, itemId }: { matchId: string; itemId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: existingReview } = useQuery({
    queryKey: ['my-review', matchId],
    queryFn: () => api.getMyReviewForMatch(matchId),
    enabled: !!matchId,
  });

  const submit = useMutation({
    mutationFn: () => api.createReview({ matchId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-review', matchId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
  });

  if (existingReview) {
    return (
      <Alert severity="success" sx={{ mt: 2 }}>
        You rated this return {existingReview.rating}★ — thanks for the feedback!
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} gutterBottom>
        How did the return go?
      </Typography>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: 'center', mb: 1 }}
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <StarButton key={s} filled={s <= (hoverRating || rating)} onClick={() => setRating(s)} />
        ))}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {rating > 0 ? `${rating} / 5` : 'Tap to rate'}
        </Typography>
      </Stack>
      <TextField
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        fullWidth
        multiline
        rows={2}
        sx={{ mb: 1.5 }}
      />
      <Button
        variant="contained"
        onClick={() => submit.mutate()}
        disabled={rating === 0 || submit.isPending}
      >
        {submit.isPending ? 'Submitting…' : 'Submit review'}
      </Button>
      {submit.isError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {submit.error instanceof Error ? submit.error.message : 'Failed to submit review'}
        </Alert>
      )}
    </Paper>
  );
}

const surfaceSx = (mode: 'light' | 'dark') => ({
  bgcolor: mode === 'dark' ? '#263026' : '#F2EFEA',
  border: '1px solid',
  borderColor: mode === 'dark' ? 'rgba(234,243,237,.08)' : 'rgba(255,255,255,.7)',
  boxShadow: neuShadow(mode, 'raised'),
  borderRadius: '24px',
});

function Fact({
  icon,
  label,
  value,
  span,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** Make the tile span the full grid width. */
  span?: boolean;
}) {
  return (
    <Box
      sx={{
        gridColumn: span ? '1 / -1' : undefined,
        p: 2,
        borderRadius: '16px',
        boxShadow: (theme) => neuShadow(theme.palette.mode, 'inset'),
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'center', color: 'primary.main', mb: 0.5 }}
      >
        <Box sx={{ display: 'inline-flex', '& svg': { fontSize: 16 } }}>{icon}</Box>
        <Typography
          sx={{
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

export function ItemDetailPage() {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => api.getItem(id!),
    enabled: !!id,
  });

  const policeReport = useMutation({
    mutationFn: () => api.generateStolenReport(id!),
    onSuccess: (c) => c.pdfUrl && window.open(c.pdfUrl, '_blank'),
  });
  const reportListing = useMutation({
    mutationFn: () => api.fileReport({ target: 'item', targetId: id!, reason: 'spam' }),
  });
  const bumpItem = useMutation({
    mutationFn: () => api.bumpItem(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    },
  });

  const { data: bookmarks } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.listBookmarks(),
    enabled: !!user,
  });

  const { data: matches } = useQuery({
    queryKey: ['matches-for-item', id],
    queryFn: () => api.listMatchesForItem(id!),
    enabled: !!id && !!user && item?.status === 'returned',
  });

  const relevantMatch = matches?.find(
    (m) =>
      (m.status === 'accepted' || m.status === 'verified') &&
      (m.lostItemId === item?.id || m.foundItemId === item?.id),
  );

  const otherItemId = relevantMatch
    ? item?.id === relevantMatch.lostItemId
      ? relevantMatch.foundItemId
      : relevantMatch.lostItemId
    : undefined;

  const { data: otherItem } = useQuery({
    queryKey: ['item', otherItemId],
    queryFn: () => api.getItem(otherItemId!),
    enabled: !!otherItemId && item?.status === 'returned',
  });

  const isBookmarked = bookmarks?.some((b) => b.itemId === id);

  const bookmarkMutation = useMutation({
    mutationFn: () => api.bookmarkItem(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const unbookmarkMutation = useMutation({
    mutationFn: () => api.unbookmarkItem(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  if (isLoading) return <DetailSkeleton />;
  if (!item)
    return (
      <EmptyState
        icon={<SearchOffIcon />}
        title="Item not found"
        description="This listing may have been closed, claimed, or removed."
        actions={[{ label: 'Back to feed', onClick: () => navigate('/') }]}
      />
    );

  const isOwner = user?.id === item.postedById;
  const isParticipant = isOwner || otherItem?.postedById === user?.id;

  const showReviewPrompt = item.status === 'returned' && user && relevantMatch && isParticipant;

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };
  const hasImages = item.images.length > 0;
  const expiringSoon = isExpiringWithin7Days(item);

  return (
    <Stack spacing={{ xs: 3, md: 4 }} sx={{ pb: 4 }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: 'flex-start', color: 'text.secondary', fontWeight: 600 }}
      >
        Back to feed
      </Button>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(0, 1fr)' },
          gap: { xs: 3, md: 4 },
          alignItems: 'start',
        }}
      >
        {/* Gallery + description */}
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ ...surfaceSx(mode), p: { xs: 1.25, sm: 1.5 } }}>
            {hasImages ? (
              <Box
                component="button"
                type="button"
                onClick={() => openLightbox(0)}
                aria-label={`View photos of ${item.title}`}
                sx={{
                  display: 'block',
                  width: '100%',
                  p: 0.75,
                  border: 0,
                  borderRadius: '18px',
                  bgcolor: 'transparent',
                  boxShadow: neuShadow(mode, 'inset'),
                  cursor: 'zoom-in',
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 4,
                  },
                }}
              >
                <Box
                  component="img"
                  src={item.images[0]!.url}
                  alt={item.title}
                  sx={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '1/1',
                    maxHeight: 560,
                    objectFit: 'contain',
                    bgcolor: mode === 'dark' ? '#1C231B' : '#E7E3DC',
                    borderRadius: '14px',
                  }}
                />
              </Box>
            ) : (
              <Stack
                spacing={1}
                sx={{
                  aspectRatio: '1/1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '18px',
                  boxShadow: neuShadow(mode, 'inset'),
                  color: 'text.secondary',
                }}
              >
                <ImageOutlinedIcon sx={{ fontSize: 48 }} />
                <Typography>No photos on this listing</Typography>
              </Stack>
            )}
            {item.images.length > 1 && (
              <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: 'wrap', p: 1.5 }}>
                {item.images.map((img, i) => (
                  <Box
                    key={img.publicId}
                    component="button"
                    type="button"
                    onClick={() => openLightbox(i)}
                    aria-label={`View photo ${i + 1}`}
                    sx={{
                      width: 64,
                      height: 64,
                      p: 0.5,
                      border: 0,
                      bgcolor: 'transparent',
                      borderRadius: '12px',
                      boxShadow: neuShadow(mode, 'raised'),
                      cursor: 'pointer',
                      '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main' },
                    }}
                  >
                    <Box
                      component="img"
                      src={img.url}
                      alt=""
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
            {hasImages && (
              <Stack
                direction="row"
                sx={{
                  px: 1.5,
                  pt: 2,
                  pb: 1,
                  justifyContent: 'space-between',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">
                  {item.images.length} {item.images.length === 1 ? 'photo' : 'photos'}
                </Typography>
                <Typography variant="body2">Tap photo to enlarge</Typography>
              </Stack>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ ...surfaceSx(mode), p: { xs: 2.5, md: 3.5 } }}>
            <Typography component="h2" sx={{ fontSize: 21, fontWeight: 700, mb: 1.5 }}>
              About this item
            </Typography>
            <Typography
              variant="body1"
              sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}
            >
              {item.description || 'No description provided.'}
            </Typography>
          </Paper>

          {showReviewPrompt && relevantMatch && (
            <ReviewPrompt matchId={relevantMatch.id} itemId={item.id} />
          )}
        </Stack>

        {/* Sticky info + actions */}
        <Paper
          variant="outlined"
          sx={{
            ...surfaceSx(mode),
            p: { xs: 2.5, md: 3.5 },
            position: { md: 'sticky' },
            top: { md: 100 },
          }}
        >
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mb: 1.5 }} useFlexGap>
            <Chip
              size="small"
              label={item.kind === 'lost' ? 'Lost item' : 'Found item'}
              color={item.kind === 'lost' ? 'error' : 'success'}
              sx={{ textTransform: 'capitalize', fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={item.status}
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
            {item.classification === 'stolen' && (
              <Chip size="small" label="stolen" color="warning" sx={{ fontWeight: 700 }} />
            )}
          </Stack>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 29, sm: 36 },
              fontWeight: 700,
              letterSpacing: '-.035em',
              lineHeight: 1.15,
              mb: 3,
              overflowWrap: 'anywhere',
            }}
          >
            {item.title}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1.5,
            }}
          >
            <Fact span icon={<LocationOnOutlinedIcon />} label="Location" value={item.place.name} />
            <Fact
              icon={<ScheduleOutlinedIcon />}
              label={item.kind === 'lost' ? 'Lost' : 'Found'}
              value={new Date(item.occurredAt).toLocaleDateString()}
            />
            <Fact
              icon={<CategoryOutlinedIcon />}
              label="Category"
              value={
                <Box component="span" sx={{ textTransform: 'capitalize' }}>
                  {item.category}
                </Box>
              }
            />
            {item.expiresAt && (
              <Fact
                icon={<HourglassBottomOutlinedIcon />}
                label="Expires"
                value={
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <span>{new Date(item.expiresAt).toLocaleDateString()}</span>
                    {expiringSoon && (
                      <Chip
                        size="small"
                        color="warning"
                        label="Soon"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    )}
                  </Stack>
                }
              />
            )}
            {typeof item.bookmarkCount === 'number' && (
              <Fact
                icon={<BookmarkBorderIcon />}
                label="Saved by"
                value={`${item.bookmarkCount} ${item.bookmarkCount === 1 ? 'person' : 'people'}`}
              />
            )}
          </Box>

          {item.status === 'returned' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              This item has been successfully returned.
            </Alert>
          )}
          {bumpItem.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Item bumped successfully.
            </Alert>
          )}
          {policeReport.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to generate report.
            </Alert>
          )}

          {!isOwner && item.status !== 'returned' && (
            <Box sx={{ mt: 3, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
              <Typography component="h2" sx={{ fontSize: 19, fontWeight: 700, mb: 0.75 }}>
                {item.kind === 'found' ? 'Does this look familiar?' : 'Have you seen this item?'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {item.kind === 'found'
                  ? 'Check the photos and details. Be ready to provide proof of ownership before arranging a return.'
                  : 'Compare the details with what you found. Keep identifying details private to help confirm the owner.'}
              </Typography>
            </Box>
          )}
          {/* Primary actions */}
          <Stack spacing={1.75} sx={{ mt: 2.5 }}>
            {!user && item.status !== 'returned' && (
              <Button
                component={Link}
                to="/login"
                variant="contained"
                fullWidth
                startIcon={<VerifiedUserOutlinedIcon />}
                sx={{ py: 1.5, boxShadow: neuShadow(mode, 'raised') }}
              >
                Sign in to help reunite this item
              </Button>
            )}
            {!isOwner && user && item.status !== 'returned' && (
              <Button
                component={Link}
                to={`/items/${item.id}/verify`}
                variant="contained"
                fullWidth
                startIcon={<VerifiedUserOutlinedIcon />}
                sx={{ borderRadius: 999, fontWeight: 700, py: 1.1 }}
              >
                I'm the owner — verify
              </Button>
            )}
            {isOwner && item.status === 'open' && expiringSoon && (
              <Button
                variant="contained"
                fullWidth
                onClick={() => bumpItem.mutate()}
                disabled={bumpItem.isPending}
                sx={{ borderRadius: 999, fontWeight: 700, py: 1.1 }}
              >
                {bumpItem.isPending ? 'Bumping…' : 'Bump to top'}
              </Button>
            )}
            {isOwner && item.classification === 'stolen' && (
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                onClick={() => policeReport.mutate()}
                disabled={policeReport.isPending}
                sx={{ borderRadius: 999, fontWeight: 700 }}
              >
                Generate police report
              </Button>
            )}

            {/* Secondary row */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {user && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() =>
                    isBookmarked ? unbookmarkMutation.mutate() : bookmarkMutation.mutate()
                  }
                  aria-pressed={!!isBookmarked}
                  disabled={bookmarkMutation.isPending || unbookmarkMutation.isPending}
                  startIcon={isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
                    boxShadow: neuShadow(mode, isBookmarked ? 'inset' : 'raised'),
                    fontWeight: 600,
                    borderColor: 'divider',
                    color: isBookmarked ? 'warning.main' : 'text.primary',
                  }}
                >
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
              )}
              <Box
                sx={{
                  display: 'inline-flex',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 999,
                }}
              >
                <ShareButton itemId={id!} size="medium" />
              </Box>
            </Stack>

            {!isOwner && user && (
              <Button
                size="small"
                color="error"
                variant="text"
                onClick={() => reportListing.mutate()}
                sx={{ alignSelf: 'flex-start' }}
              >
                {reportListing.isSuccess ? 'Reported' : 'Report listing'}
              </Button>
            )}
          </Stack>
        </Paper>
      </Box>

      <ImageLightbox
        images={item.images.map((img) => ({ url: img.url, alt: item.title }))}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </Stack>
  );
}
