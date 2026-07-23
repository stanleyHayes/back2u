import 'mapbox-gl/dist/mapbox-gl.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Map as ReactMap, Marker, Popup, NavigationControl } from 'react-map-gl';
import type { MapEvent, MapRef, ViewStateChangeEvent } from 'react-map-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import Supercluster from 'supercluster';

import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const CLAY = '#C2410C';

type ItemKind = 'lost' | 'found';

interface ItemPreview {
  id: string;
  title: string;
  kind: ItemKind;
  category: string;
  place: {
    name: string;
    point: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
}

interface PointProps {
  itemId: string;
  kind: ItemKind;
}

type ClusterFeature = Supercluster.ClusterFeature<{ lostCount: number; foundCount: number }>;
type PointFeature = Supercluster.PointFeature<PointProps>;

function ClusterMarker({
  count,
  lostCount,
  foundCount,
}: {
  count: number;
  lostCount: number;
  foundCount: number;
}) {
  const size = 20 + Math.min(count, 50);
  let bg: string;
  if (lostCount > 0 && foundCount === 0) bg = CLAY;
  else if (foundCount > 0 && lostCount === 0) bg = TEAL;
  else bg = MARIGOLD;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: bg,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size > 30 ? 14 : 12,
        cursor: 'pointer',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        transition: 'transform 0.15s ease',
        '&:hover': { transform: 'scale(1.1)' },
      }}
    >
      {count}
    </Box>
  );
}

function ItemPin({ kind }: { kind: ItemKind }) {
  const color = kind === 'lost' ? CLAY : TEAL;
  return (
    <Box
      sx={{
        color,
        transition: 'transform 0.15s ease',
        '&:hover': { transform: 'scale(1.2)' },
      }}
    >
      <LocationOnIcon sx={{ fontSize: 28 }} />
    </Box>
  );
}

export function MapEmbed() {
  const mapRef = useRef<MapRef>(null);
  const [items, setItems] = useState<ItemPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<ItemKind | ''>('');
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(11);
  const [selectedItem, setSelectedItem] = useState<ItemPreview | null>(null);

  useEffect(() => {
    document.title = 'Live Map — Back2u';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Explore the live map of recent lost and found items across Ghana. See what was reported near you and help reunite people with what they value.'
      );
    }
    return () => {
      document.title = 'Back2u — Reunite people with what they value.';
      const m = document.querySelector('meta[name="description"]');
      if (m) {
        m.setAttribute(
          'content',
          'Back2u — AI-powered lost and found. Post a lost or found item, get matched in seconds, and reunite people with what they value.'
        );
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_URL}/v1/items`);
        url.searchParams.set('pageSize', '100');
        url.searchParams.set('status', 'open');
        if (kind) url.searchParams.set('kind', kind);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
        const json = (await res.json()) as { data?: { items?: ItemPreview[] } };
        if (cancelled) return;
        setItems(json.data?.items ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const cluster = useMemo(() => {
    if (!items.length) return null;
    const sc = new Supercluster<PointProps, { lostCount: number; foundCount: number }>({
      radius: 40,
      maxZoom: 14,
      map: (props) => ({
        lostCount: props.kind === 'lost' ? 1 : 0,
        foundCount: props.kind === 'found' ? 1 : 0,
      }),
      reduce: (accumulated, props) => {
        accumulated.lostCount += props.lostCount;
        accumulated.foundCount += props.foundCount;
      },
    });

    const points: PointFeature[] = items.map((item) => ({
      type: 'Feature',
      properties: { itemId: item.id, kind: item.kind },
      geometry: {
        type: 'Point',
        coordinates: item.place.point.coordinates,
      },
    }));

    sc.load(points);
    return sc;
  }, [items]);

  const clusters = useMemo(() => {
    if (!cluster || bounds === null) return [];
    return cluster.getClusters(bounds, Math.floor(zoom));
  }, [cluster, bounds, zoom]);

  const updateBoundsFromMap = useCallback((map: MapboxMap) => {
    const b = map.getBounds();
    if (!b) return;
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, []);

  const handleLoad = useCallback(
    (evt: MapEvent) => {
      updateBoundsFromMap(evt.target);
    },
    [updateBoundsFromMap]
  );

  const handleMoveEnd = useCallback(
    (evt: ViewStateChangeEvent) => {
      updateBoundsFromMap(evt.target);
    },
    [updateBoundsFromMap]
  );

  const handleClusterClick = useCallback(
    (clusterId: number, longitude: number, latitude: number) => {
      if (!cluster) return;
      const expansionZoom = cluster.getClusterExpansionZoom(clusterId);
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: expansionZoom,
      });
    },
    [cluster]
  );

  const itemsById = useMemo(() => {
    return new Map(items.map((it) => [it.id, it]));
  }, [items]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1, position: 'relative' }}>
        {/* Filter bar overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 8, md: 16 },
            left: { xs: 8, md: 16 },
            zIndex: 10,
            bgcolor: 'rgba(251,246,236,0.92)',
            backdropFilter: 'blur(8px)',
            borderRadius: 3,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1}>
            <Typography
              className="b2u-display"
              sx={{ fontSize: { xs: 16, md: 20 }, fontWeight: 600, color: INK, px: 0.5 }}
            >
              Live map
            </Typography>
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={kind === '' ? 'contained' : 'outlined'}
                onClick={() => setKind('')}
              >
                All
              </Button>
              <Button
                variant={kind === 'lost' ? 'contained' : 'outlined'}
                onClick={() => setKind('lost')}
              >
                Lost
              </Button>
              <Button
                variant={kind === 'found' ? 'contained' : 'outlined'}
                onClick={() => setKind('found')}
              >
                Found
              </Button>
            </ButtonGroup>
          </Stack>
        </Box>

        {/* Loading overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(251,246,236,0.7)',
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}

        {/* Error overlay */}
        {!loading && error && (
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 80, md: 100 },
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 5,
              width: { xs: '90%', md: 400 },
            }}
          >
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Map */}
        <Box sx={{ width: '100%', height: { xs: '60vh', md: '100vh' } }}>
          {!TOKEN ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
              }}
            >
              <Alert severity="warning" sx={{ borderRadius: 3 }}>
                Mapbox token is missing. Please set VITE_MAPBOX_TOKEN.
              </Alert>
            </Box>
          ) : (
            <ReactMap
              ref={mapRef}
              mapboxAccessToken={TOKEN}
              initialViewState={{ longitude: -0.187, latitude: 5.603, zoom: 11 }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              onLoad={handleLoad}
              onMoveEnd={handleMoveEnd}
            >
              <NavigationControl position="top-right" />

              {clusters.map((feature) => {
                const coords = feature.geometry.coordinates;
                const longitude = coords[0] ?? 0;
                const latitude = coords[1] ?? 0;

                if ('cluster' in feature.properties) {
                  const cf = feature as ClusterFeature;
                  const clusterId = cf.properties.cluster_id;
                  const count = cf.properties.point_count;
                  return (
                    <Marker
                      key={`cluster-${clusterId}`}
                      longitude={longitude}
                      latitude={latitude}
                      onClick={(e) => {
                        e.originalEvent?.stopPropagation();
                        handleClusterClick(clusterId, longitude, latitude);
                      }}
                    >
                      <ClusterMarker
                        count={count}
                        lostCount={cf.properties.lostCount}
                        foundCount={cf.properties.foundCount}
                      />
                    </Marker>
                  );
                }

                const pf = feature as PointFeature;
                const item = itemsById.get(pf.properties.itemId);
                if (!item) return null;

                return (
                  <Marker
                    key={pf.properties.itemId}
                    longitude={longitude}
                    latitude={latitude}
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent?.stopPropagation();
                      setSelectedItem(item);
                    }}
                  >
                    <ItemPin kind={pf.properties.kind} />
                  </Marker>
                );
              })}

              {selectedItem && (
                <Popup
                  longitude={selectedItem.place.point.coordinates[0]}
                  latitude={selectedItem.place.point.coordinates[1]}
                  anchor="bottom"
                  onClose={() => setSelectedItem(null)}
                  closeButton
                >
                  <Stack spacing={1} sx={{ p: 1, minWidth: 180 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {selectedItem.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedItem.kind}
                      sx={{
                        alignSelf: 'flex-start',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontSize: 11,
                        color: selectedItem.kind === 'lost' ? CLAY : '#FFFDF8',
                        bgcolor: selectedItem.kind === 'lost' ? 'rgba(194,65,12,.1)' : TEAL,
                        borderRadius: 999,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {selectedItem.place.name}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      href={`${APP_URL}/items/${selectedItem.id}`}
                      onClick={() => setSelectedItem(null)}
                      sx={{ mt: 0.5 }}
                    >
                      View in app
                    </Button>
                  </Stack>
                </Popup>
              )}
            </ReactMap>
          )}
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
