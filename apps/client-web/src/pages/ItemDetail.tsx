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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
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
      sx={{ minWidth: 36, fontSize: 24, color: filled ? '#E0A106' : 'text.disabled', p: 0 }}
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

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 1, alignItems: 'center', flexWrap: 'wrap' }}
          useFlexGap
        >
          <Chip
            label={item.kind}
            color={item.kind === 'lost' ? 'error' : 'success'}
            sx={{ textTransform: 'capitalize' }}
          />
          <Chip label={item.status} variant="outlined" />
          <Chip label={item.category} variant="outlined" />
          {item.classification === 'stolen' && <Chip label="stolen" color="warning" />}
          <Box sx={{ flex: 1 }} />
          {user && (
            <IconButton
              size="small"
              onClick={() => {
                if (isBookmarked) {
                  unbookmarkMutation.mutate();
                } else {
                  bookmarkMutation.mutate();
                }
              }}
              sx={{ color: isBookmarked ? 'warning.main' : 'text.secondary' }}
            >
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          )}
          <ShareButton itemId={id!} size="medium" />
          {isOwner && item.classification === 'stolen' && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => policeReport.mutate()}
              disabled={policeReport.isPending}
            >
              Generate police report
            </Button>
          )}
          {isOwner && item.status === 'open' && isExpiringWithin7Days(item) && (
            <Button
              size="small"
              variant="contained"
              onClick={() => bumpItem.mutate()}
              disabled={bumpItem.isPending}
            >
              {bumpItem.isPending ? 'Bumping…' : 'Bump to top'}
            </Button>
          )}
          {!isOwner && user && item.status !== 'returned' && (
            <Button
              size="small"
              component={Link}
              to={`/items/${item.id}/verify`}
              variant="contained"
            >
              I'm the owner — verify
            </Button>
          )}
        </Stack>
        <Typography variant="h3" gutterBottom>
          {item.title}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {item.description}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {item.place.name} · {new Date(item.occurredAt).toLocaleString()}
          </Typography>
          {typeof item.bookmarkCount === 'number' && (
            <Typography variant="body2" color="text.secondary">
              · {item.bookmarkCount} bookmark{item.bookmarkCount === 1 ? '' : 's'}
            </Typography>
          )}
        </Stack>
        {item.expiresAt && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Expires: {new Date(item.expiresAt).toLocaleString()}
          </Typography>
        )}
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
        {!isOwner && user && (
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              color="error"
              variant="text"
              onClick={() => reportListing.mutate()}
            >
              {reportListing.isSuccess ? 'Reported' : 'Report listing'}
            </Button>
          </Box>
        )}
        {policeReport.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to generate report.
          </Alert>
        )}
        {showReviewPrompt && relevantMatch && (
          <ReviewPrompt matchId={relevantMatch.id} itemId={item.id} />
        )}
      </Paper>
      {item.images.length === 1 ? (
        <Box
          component="img"
          src={item.images[0]!.url}
          alt={item.title}
          onClick={() => {
            setLightboxIndex(0);
            setLightboxOpen(true);
          }}
          sx={{ width: '100%', borderRadius: 2, objectFit: 'cover', cursor: 'pointer' }}
        />
      ) : (
        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}
        >
          {item.images.map((img, i) => (
            <Box
              key={img.publicId}
              component="img"
              src={img.url}
              alt={item.title}
              onClick={() => {
                setLightboxIndex(i);
                setLightboxOpen(true);
              }}
              sx={{
                width: '100%',
                borderRadius: 2,
                objectFit: 'cover',
                cursor: 'pointer',
                aspectRatio: '4/3',
              }}
            />
          ))}
        </Box>
      )}
      <ImageLightbox
        images={item.images.map((img) => ({ url: img.url, alt: item.title }))}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </Stack>
  );
}
