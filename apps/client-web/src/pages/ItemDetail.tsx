import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
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
import { EmptyState, DetailSkeleton } from '@back2u/ui-web';
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
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
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
            fontSize: 10.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{value}</Typography>
    </Box>
  );
}

export function ItemDetailPage() {
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
    <Stack spacing={2.5}>
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
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.5fr) minmax(0, 1fr)' },
          gap: { xs: 2.5, md: 3 },
          alignItems: 'start',
        }}
      >
        {/* Gallery + description */}
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          {hasImages ? (
            <Box>
              <Box
                component="img"
                src={item.images[0]!.url}
                alt={item.title}
                onClick={() => openLightbox(0)}
                sx={{
                  width: '100%',
                  aspectRatio: '4/3',
                  objectFit: 'cover',
                  borderRadius: 3,
                  cursor: 'zoom-in',
                  border: 1,
                  borderColor: 'divider',
                  display: 'block',
                }}
              />
              {item.images.length > 1 && (
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ mt: 1.25, flexWrap: 'wrap' }}
                  useFlexGap
                >
                  {item.images.map((img, i) => (
                    <Box
                      key={img.publicId}
                      component="img"
                      src={img.url}
                      alt={`${item.title} ${i + 1}`}
                      onClick={() => openLightbox(i)}
                      sx={{
                        width: 76,
                        height: 76,
                        objectFit: 'cover',
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: 2,
                        borderColor: i === 0 ? 'primary.main' : 'divider',
                        transition: 'border-color .15s, transform .15s',
                        '&:hover': { transform: 'translateY(-2px)' },
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'action.hover',
                display: 'grid',
                placeItems: 'center',
                color: 'text.disabled',
              }}
            >
              <Stack sx={{ alignItems: 'center' }} spacing={1}>
                <ImageOutlinedIcon sx={{ fontSize: 44 }} />
                <Typography variant="body2">No photos on this listing</Typography>
              </Stack>
            </Box>
          )}

          <Paper
            variant="outlined"
            sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, borderColor: 'divider' }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
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
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            borderColor: 'divider',
            position: { md: 'sticky' },
            top: { md: 16 },
          }}
        >
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mb: 1.5 }} useFlexGap>
            <Chip
              size="small"
              label={item.kind}
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

          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 2 }}>
            {item.title}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1,
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

          {/* Primary actions */}
          <Stack spacing={1.25} sx={{ mt: 2.5 }}>
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
                  startIcon={isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
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
