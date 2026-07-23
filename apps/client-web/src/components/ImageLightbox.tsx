import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

export interface LightboxImage {
  url: string;
  alt?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, open, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const imgRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoomed(false);
    }
  }, [open, initialIndex]);

  // Handle loading state when current image changes
  useEffect(() => {
    const img = imgRefs.current.get(currentIndex);
    if (img) {
      setLoading(!img.complete);
    } else {
      setLoading(true);
    }
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goNext, goPrev, onClose]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const touchX = e.changedTouches[0]?.clientX;
    if (touchX == null) return;
    const diff = touchStartX - touchX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStartX(null);
  };

  if (images.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'rgba(0,0,0,0.92)',
            color: '#fff',
            overflow: 'hidden',
            height: '100%',
            maxHeight: '100vh',
          },
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0,0,0,0.85)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            color: '#fff',
            bgcolor: 'rgba(255,255,255,0.15)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Zoom toggle button */}
        <IconButton
          onClick={() => setZoomed((z) => !z)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 56,
            zIndex: 10,
            color: '#fff',
            bgcolor: 'rgba(255,255,255,0.15)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}
        >
          {zoomed ? <ZoomOutIcon /> : <ZoomInIcon />}
        </IconButton>

        {/* Image counter */}
        <Typography
          variant="body2"
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 500,
          }}
        >
          {currentIndex + 1} / {images.length}
        </Typography>

        {/* Main image area */}
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading && (
            <CircularProgress
              sx={{
                position: 'absolute',
                color: 'rgba(255,255,255,0.7)',
                zIndex: 5,
              }}
            />
          )}

          {/* Arrow left */}
          {images.length > 1 && (
            <IconButton
              onClick={goPrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}

          {/* Arrow right */}
          {images.length > 1 && (
            <IconButton
              onClick={goNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          )}

          {/* Images with transform transition */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {images.map((img, i) => {
              const offset = i - currentIndex;
              const isActive = i === currentIndex;
              const isAdjacent = Math.abs(offset) === 1;
              return (
                <Box
                  key={`${img.url}-${i}`}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translateX(${offset * 100}%)`,
                    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isActive || isAdjacent ? 1 : 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  <Box
                    component="img"
                    ref={(el) => {
                      const img = el as HTMLImageElement | null;
                      if (img) imgRefs.current.set(i, img);
                    }}
                    src={img.url}
                    alt={img.alt || ''}
                    draggable={false}
                    onLoad={() => isActive && setLoading(false)}
                    onError={() => isActive && setLoading(false)}
                    onClick={() => isActive && setZoomed((z) => !z)}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      cursor: isActive ? 'pointer' : 'default',
                      transform: isActive && zoomed ? 'scale(1.5)' : 'scale(1)',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              px: 2,
              py: 1.5,
              overflowX: 'auto',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.4)',
            }}
          >
            {images.map((img, i) => (
              <Box
                key={`thumb-${img.url}-${i}`}
                component="img"
                src={img.url}
                alt={img.alt || ''}
                onClick={() => setCurrentIndex(i)}
                sx={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: i === currentIndex ? '2px solid #fff' : '2px solid transparent',
                  opacity: i === currentIndex ? 1 : 0.6,
                  transition: 'opacity 0.2s, border-color 0.2s',
                  '&:hover': { opacity: 1 },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
