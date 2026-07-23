import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { ItemDTO } from '@back2u/shared-types';

import { ShareButton } from './ShareButton.js';
import { ImageLightbox } from './ImageLightbox.js';

const INK = '#0B3D38';
const TEAL = '#0F766E';
const CLAY = '#C2410C';

function expiryChip(item: ItemDTO): { label: string; color: 'error' | 'warning' } | null {
  if (item.status !== 'open' || !item.expiresAt) return null;
  const ms = new Date(item.expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: 'Expired', color: 'error' };
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 3) return { label: `${days}d left`, color: 'warning' };
  return null;
}

/** Redesigned lost/found item card: inset padded image, custom shape, richer actions. */
export function ItemCard({
  item,
  distance,
  isBookmarked,
  onToggleBookmark,
}: {
  item: ItemDTO;
  distance?: string;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isFound = item.kind === 'found';
  const exp = expiryChip(item);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 1.25,
        // custom brand "tag" shape — one sharp corner like the pin logo
        borderRadius: '24px 24px 24px 6px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform .18s cubic-bezier(.2,.7,.2,1), box-shadow .18s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 26px 46px -30px rgba(11,61,56,.55)',
        },
      }}
    >
      {/* Image: padded inside the card with its own rounded frame */}
      <Box
        component={Link}
        to={`/items/${item.id}`}
        sx={{ display: 'block', textDecoration: 'none', position: 'relative' }}
      >
        <Box
          sx={{
            position: 'relative',
            height: 180,
            borderRadius: '18px 18px 18px 4px',
            overflow: 'hidden',
            bgcolor: isFound ? 'rgba(15,118,110,0.08)' : 'rgba(194,65,12,0.08)',
          }}
        >
          {item.images[0]?.url ? (
            <Box
              component="img"
              src={item.images[0].url}
              alt={item.title}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                cursor: 'pointer',
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                height: '100%',
                color: 'text.secondary',
                fontSize: 14,
              }}
            >
              No photo
            </Box>
          )}

          {/* kind badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              px: 1.2,
              py: 0.4,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FFFDF8',
              bgcolor: isFound ? TEAL : CLAY,
              boxShadow: '0 6px 14px -8px rgba(11,61,56,.8)',
            }}
          >
            {item.kind}
          </Box>

          {distance && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                px: 1,
                py: 0.3,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: INK,
                bgcolor: 'rgba(251,246,236,0.92)',
              }}
            >
              {distance}
            </Box>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 0.75, pt: 1.5, pb: 0.5, flex: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ mb: 1, flexWrap: 'wrap' }} useFlexGap>
          <Chip size="small" label={item.category} variant="outlined" />
          {item.classification === 'stolen' && <Chip size="small" label="stolen" color="warning" />}
          {item.status === 'returned' && <Chip size="small" label="Returned" color="success" />}
          {exp && <Chip size="small" label={exp.label} color={exp.color} variant="outlined" />}
        </Stack>
        <Typography
          component={Link}
          to={`/items/${item.id}`}
          noWrap
          sx={{
            display: 'block',
            fontWeight: 700,
            fontSize: 18,
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {item.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {item.place?.name}
        </Typography>
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 0.5, pt: 1 }}>
        <Button
          component={Link}
          to={`/items/${item.id}`}
          size="small"
          variant="contained"
          sx={{
            bgcolor: INK,
            color: '#FBF6EC',
            borderRadius: 999,
            fontWeight: 700,
            '&:hover': { bgcolor: '#0a322e' },
          }}
        >
          {isFound ? 'Could be mine' : 'I found this'}
        </Button>
        <Button
          component={Link}
          to={`/items/${item.id}`}
          size="small"
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Details
        </Button>
        <Box sx={{ flex: 1 }} />
        {onToggleBookmark && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark();
            }}
            sx={{ color: isBookmarked ? 'warning.main' : 'text.secondary' }}
          >
            {isBookmarked ? (
              <BookmarkIcon fontSize="small" />
            ) : (
              <BookmarkBorderIcon fontSize="small" />
            )}
          </IconButton>
        )}
        <ShareButton itemId={item.id} />
      </Stack>
      <ImageLightbox
        images={item.images.map((img) => ({ url: img.url, alt: item.title }))}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Box>
  );
}
