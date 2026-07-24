import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useNavigate } from 'react-router-dom';
import type { ItemDTO } from '@back2u/shared-types';

import { api } from '../lib/api.js';

const INK = '#2E3D2F';
const PAPER = '#F2EFEA';
const MARIGOLD = '#8B6F4E';
const TEAL = '#7E9A82';

type NearItem = ItemDTO & { dist: number };

function haversine(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

// Stable scatter positions for the floating AR tags.
const LANES = [
  { top: '14%', left: '6%' },
  { top: '24%', left: '60%' },
  { top: '44%', left: '12%' },
  { top: '38%', left: '68%' },
  { top: '58%', left: '40%' },
];

export function FoundNearYouPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [items, setItems] = useState<NearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  // 1) Geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported on this device.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => {
        setGeoError(
          'We need your location to surface found items near you. Enable location and reload.',
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  // 2) Fetch found items near the user
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.listItems({
          kind: 'found',
          status: 'open',
          near: { lng: coords.lng, lat: coords.lat, radiusMeters: 5000 },
          pageSize: 24,
        });
        if (cancelled) return;
        const withDist = res.items
          .map((it) => {
            const c = it.place?.point?.coordinates ?? [0, 0];
            return { ...it, dist: haversine(coords.lng, coords.lat, c[0], c[1]) };
          })
          .sort((a, b) => a.dist - b.dist);
        setItems(withDist);
      } catch {
        /* ignore — show empty state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords]);

  // 3) Camera viewfinder (best-effort; falls back to a gradient)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraOn(true);
      } catch {
        setCameraOn(false);
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const nearest = items.slice(0, LANES.length);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontSize: 12,
              mb: 0.5,
            }}
          >
            Augmented reality
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Black Ops One", serif',
              fontWeight: 600,
              fontSize: 32,
              color: 'text.primary',
            }}
          >
            Found near you
          </Typography>
          <Typography color="text.secondary">
            Point your camera around — found items reported within 5&nbsp;km appear as you look.
          </Typography>
        </Box>
        <Chip
          icon={<MyLocationIcon />}
          label={coords ? `${items.length} nearby` : 'Locating…'}
          color={items.length ? 'success' : 'default'}
        />
      </Stack>

      {geoError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {geoError}
        </Alert>
      )}

      {/* Viewfinder */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '64vh', md: '72vh' },
          borderRadius: 5,
          overflow: 'hidden',
          bgcolor: INK,
          backgroundImage: cameraOn
            ? 'none'
            : 'radial-gradient(40rem 30rem at 80% 110%, rgba(139,111,78,0.25), transparent 60%), radial-gradient(36rem 28rem at 10% -10%, rgba(126,154,130,0.28), transparent 60%)',
          boxShadow: '0 30px 70px -45px rgba(46,61,47,.6)',
        }}
      >
        {/* camera feed */}
        <Box
          component="video"
          ref={videoRef}
          muted
          playsInline
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraOn ? 'block' : 'none',
          }}
        />

        {/* camera HUD: corner brackets + reticle */}
        <Box aria-hidden sx={{ position: 'absolute', inset: 18, pointerEvents: 'none' }}>
          {[
            { top: 0, left: 0, bt: 3, bl: 3 },
            { top: 0, right: 0, bt: 3, br: 3 },
            { bottom: 0, left: 0, bb: 3, bl: 3 },
            { bottom: 0, right: 0, bb: 3, br: 3 },
          ].map((c, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: 28,
                height: 28,
                top: c.top,
                bottom: c.bottom,
                left: c.left,
                right: c.right,
                borderTop: c.bt ? `3px solid ${MARIGOLD}` : 'none',
                borderBottom: c.bb ? `3px solid ${MARIGOLD}` : 'none',
                borderLeft: c.bl ? `3px solid ${MARIGOLD}` : 'none',
                borderRight: c.br ? `3px solid ${MARIGOLD}` : 'none',
                borderRadius: 1,
              }}
            />
          ))}
        </Box>

        {/* loading */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: PAPER,
            }}
          >
            <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
              <CircularProgress sx={{ color: MARIGOLD }} />
              <Typography sx={{ color: PAPER }}>Scanning for nearby finds…</Typography>
            </Stack>
          </Box>
        )}

        {/* empty */}
        {!loading && coords && items.length === 0 && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 3 }}>
            <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
              <Typography sx={{ fontFamily: '"Black Ops One", serif', fontSize: 24, color: PAPER }}>
                Nothing found within 5&nbsp;km
              </Typography>
              <Typography sx={{ color: 'rgba(250,248,243,0.7)' }}>
                Lucky you — or check back later as people report finds.
              </Typography>
            </Stack>
          </Box>
        )}

        {/* floating AR tags for the nearest items */}
        {!loading &&
          nearest.map((it, i) => (
            <Box
              key={it.id}
              onClick={() => navigate(`/items/${it.id}`)}
              sx={{
                position: 'absolute',
                top: LANES[i]!.top,
                left: LANES[i]!.left,
                maxWidth: 220,
                cursor: 'pointer',
                animation: 'b2uFloat 5s ease-in-out infinite',
                animationDelay: `${i * 0.6}s`,
                '@keyframes b2uFloat': {
                  '0%,100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-8px)' },
                },
                '&:hover': { zIndex: 5 },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  p: 0.75,
                  pr: 1.5,
                  borderRadius: 999,
                  bgcolor: 'rgba(242,239,234,0.95)',
                  border: `1px solid rgba(46,61,47,0.1)`,
                  boxShadow: '0 14px 30px -18px rgba(46,61,47,.8)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {it.images[0]?.url ? (
                  <Box
                    component="img"
                    src={it.images[0].url}
                    alt={it.title}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: TEAL,
                      flexShrink: 0,
                    }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{ fontWeight: 700, fontSize: 13, color: INK, lineHeight: 1.1 }}
                  >
                    {it.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#3C544F' }}>
                    {fmtDist(it.dist)} away
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
      </Box>

      {/* Bottom carousel of all nearby finds */}
      {items.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>All finds near you</Typography>
          <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
            {items.map((it) => (
              <Box
                key={it.id}
                onClick={() => navigate(`/items/${it.id}`)}
                sx={{
                  flexShrink: 0,
                  width: 180,
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  transition: 'transform .15s',
                  '&:hover': { transform: 'translateY(-3px)' },
                }}
              >
                {it.images[0]?.url && (
                  <Box
                    component="img"
                    src={it.images[0].url}
                    alt={it.title}
                    sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                  />
                )}
                <Box sx={{ p: 1.25 }}>
                  <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>
                    {it.title}
                  </Typography>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography noWrap variant="caption" color="text.secondary">
                      {it.place?.name}
                    </Typography>
                    <Chip label={fmtDist(it.dist)} size="small" sx={{ height: 20, fontSize: 11 }} />
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          sx={{ color: 'text.primary' }}
          onClick={() => navigate('/map')}
        >
          Prefer a map? Open the map view →
        </Button>
      </Box>
    </Box>
  );
}
