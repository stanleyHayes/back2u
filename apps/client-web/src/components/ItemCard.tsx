import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { ItemDTO } from '@back2u/shared-types';
import { neuShadow } from '@back2u/ui-web';

import { ShareButton } from './ShareButton.js';
import { ImageLightbox } from './ImageLightbox.js';

const INK = '#2E3D2F';
const TEAL = '#40614A';
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
      component="article"
      aria-label={item.title}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 1.5,
        minWidth: 0,
        borderRadius: '22px',
        bgcolor: (t) => (t.palette.mode === 'dark' ? '#263026' : '#F2EFEA'),
        border: 'none',
        boxShadow: (t) => neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
        '& a:focus-visible, & button:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 3,
        },
      }}
    >
      {/* Image: padded inside the card with its own rounded frame */}
      <Box
        component="button"
        type="button"
        aria-label={`Preview photo of ${item.title}`}
        onClick={() => setLightboxOpen(true)}
        disabled={!item.images.length}
        sx={{
          width: '100%',
          border: 'none',
          bgcolor: 'transparent',
          cursor: item.images.length ? 'pointer' : 'default',
          textDecoration: 'none',
          position: 'relative',
          p: 0.75,
          borderRadius: '16px',
          boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
        }}
      >
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '16 / 10',
            borderRadius: '12px',
            overflow: 'hidden',
            bgcolor: isFound ? 'rgba(64,97,74,0.08)' : 'rgba(194,65,12,0.08)',
          }}
        >
          {item.images[0]?.url ? (
            <Box
              component="img"
              src={item.images[0].url}
              alt={item.title}
              loading="lazy"
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
              color: '#FAF8F3',
              bgcolor: isFound ? TEAL : CLAY,
              boxShadow: '0 6px 14px -8px rgba(46,61,47,.8)',
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
                bgcolor: 'rgba(242,239,234,0.92)',
              }}
            >
              {distance}
            </Box>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 1, pt: 2.5, pb: 2, flex: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ mb: 1, flexWrap: 'wrap' }} useFlexGap>
          <Chip
            size="small"
            label={item.category}
            sx={{
              borderRadius: '8px',
              bgcolor: 'transparent',
              boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
            }}
          />
          {item.classification === 'stolen' && <Chip size="small" label="stolen" color="warning" />}
          {item.status === 'returned' && <Chip size="small" label="Returned" color="success" />}
          {exp && <Chip size="small" label={exp.label} color={exp.color} variant="outlined" />}
        </Stack>
        <Typography
          component={Link}
          to={`/items/${item.id}`}
          sx={{
            display: 'block',
            fontWeight: 700,
            fontSize: 19,
            lineHeight: 1.4,
            overflowWrap: 'anywhere',
            mt: 1.75,
            mb: 1.5,
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {item.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <PlaceOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary', flexShrink: 0 }} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary', overflowWrap: 'anywhere' }}>
            {item.place?.name || 'Location not provided'}
          </Typography>
        </Stack>
      </Box>

      {/* Actions */}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          alignItems: 'center',
          flexWrap: 'wrap',
          mx: 1,
          pt: 2,
          pb: 1,
          borderTop: '1px solid',
          borderColor: (t) => alpha(t.palette.text.primary, 0.1),
        }}
      >
        <Button
          component={Link}
          to={`/items/${item.id}`}
          size="small"
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            bgcolor: 'primary.main',
            color: (t) => t.palette.getContrastText(t.palette.primary.main),
            borderRadius: '10px',
            minHeight: 40,
            fontWeight: 700,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          {isFound ? 'Could be mine' : 'I found this'}
        </Button>
        <Box sx={{ flex: 1 }} />
        {onToggleBookmark && (
          <IconButton
            size="small"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark item'}
            aria-pressed={Boolean(isBookmarked)}
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
