import 'mapbox-gl/dist/mapbox-gl.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Map as ReactMap, Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import type { MapEvent, MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';
import Supercluster from 'supercluster';

import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const TEAL = '#40614A';
const MARIGOLD = '#8B6F4E';
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
  const dark = useTheme().palette.mode === 'dark';
  const surface = dark ? '#263026' : '#F2EFEA';
  const ink = dark ? '#EAF3ED' : '#263D2D';
  const muted = dark ? '#B1C0B2' : '#59685D';
  const lostColor = dark ? '#F0B28F' : '#A8421D';
  const foundColor = dark ? '#A7CFAC' : '#365E41';
  const inset = dark
    ? 'inset 3px 3px 7px #192119, inset -3px -3px 7px #344034'
    : 'inset 3px 3px 7px #d9d6d1, inset -3px -3px 7px #ffffff';
  const raised = dark
    ? '4px 4px 10px #192119, -3px -3px 8px #344034'
    : '4px 4px 10px #d9d6d1, -3px -3px 8px #ffffff';
  const mapRef = useRef<MapRef>(null);
  const [items, setItems] = useState<ItemPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<ItemKind | ''>('');
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(11);
  const [selectedItem, setSelectedItem] = useState<ItemPreview | null>(null);

  useEffect(() => {
    document.title = 'Live Map — bak2me';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Explore the live map of recent lost and found items across Ghana. See what was reported near you and help reunite people with what they value.',
      );
    }
    return () => {
      document.title = 'bak2me — Reunite people with what they value.';
      const m = document.querySelector('meta[name="description"]');
      if (m) {
        m.setAttribute(
          'content',
          'bak2me — AI-powered lost and found. Post a lost or found item, get matched in seconds, and reunite people with what they value.',
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
    [updateBoundsFromMap],
  );

  const handleMoveEnd = useCallback(
    (evt: ViewStateChangeEvent) => {
      updateBoundsFromMap(evt.target);
    },
    [updateBoundsFromMap],
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
    [cluster],
  );

  const itemsById = useMemo(() => {
    return new Map(items.map((it) => [it.id, it]));
  }, [items]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          position: 'relative',
          '& .mapboxgl-popup-content': {
            bgcolor: surface,
            color: ink,
            p: 0,
            borderRadius: '20px',
            border: '1px solid',
            borderColor: dark ? '#3A483A' : '#FFFFFF',
            boxShadow: '0 12px 32px rgba(0,0,0,.22)',
            overflow: 'hidden',
          },
          '& .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip': { borderTopColor: surface },
          '& .mapboxgl-popup-close-button': {
            color: muted,
            fontSize: 22,
            width: 36,
            height: 36,
            right: 5,
            top: 5,
            borderRadius: '50%',
            zIndex: 1,
            '&:hover': { bgcolor: dark ? '#344034' : '#E3E1DA' },
          },
          '& .mapboxgl-ctrl-group': {
            bgcolor: surface,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,.18)',
          },
          '& .mapboxgl-ctrl-icon': { filter: dark ? 'invert(1)' : 'none' },
          '@media (max-width: 599px)': {
            '& .mapboxgl-popup': {
              top: 'auto',
              bottom: 38,
              left: 12,
              transform: 'none !important',
              width: 'calc(100% - 24px)',
              maxWidth: 'none !important',
            },
            '& .mapboxgl-popup-content': { width: '100%' },
            '& .mapboxgl-popup-tip': { display: 'none' },
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            width: { xs: 'calc(100% - 76px)', sm: 320 },
            bgcolor: surface,
            color: ink,
            borderRadius: '22px',
            p: 2,
            border: '1px solid',
            borderColor: dark ? '#3A483A' : '#FFFFFF',
            boxShadow: '0 8px 28px rgba(0,0,0,.18)',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '13px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: inset,
                color: foundColor,
              }}
            >
              <MapOutlinedIcon />
            </Box>
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 20,
                  fontWeight: 600,
                  color: ink,
                  lineHeight: 1.3,
                }}
              >
                Explore the map
              </Typography>
              <Typography sx={{ fontSize: 12, color: muted, mt: 0.25 }}>
                Lost &amp; found, close to you
              </Typography>
            </Box>
          </Stack>
          <Box
            role="group"
            aria-label="Filter map items"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0.75,
              p: 0.75,
              borderRadius: '14px',
              boxShadow: inset,
            }}
          >
            {(
              [
                { value: '', label: 'All', color: ink },
                { value: 'lost', label: 'Lost', color: lostColor },
                { value: 'found', label: 'Found', color: foundColor },
              ] as const
            ).map((filter) => (
              <ButtonBase
                key={filter.label}
                aria-pressed={kind === filter.value}
                onClick={() => {
                  setKind(filter.value);
                  setSelectedItem(null);
                }}
                sx={{
                  minHeight: 40,
                  borderRadius: '10px',
                  fontSize: 13,
                  fontWeight: 600,
                  gap: 0.75,
                  color: kind === filter.value ? filter.color : muted,
                  bgcolor: surface,
                  boxShadow: kind === filter.value ? raised : 'none',
                  '&:hover': { color: filter.color },
                  '&.Mui-focusVisible': {
                    outline: '2px solid',
                    outlineColor: foundColor,
                    outlineOffset: 2,
                  },
                }}
              >
                {filter.value && (
                  <Box
                    component="span"
                    sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: filter.color }}
                  />
                )}
                {filter.label}
              </ButtonBase>
            ))}
          </Box>
          <Typography role="status" sx={{ color: muted, fontSize: 11, mt: 1.5 }}>
            {loading
              ? 'Loading reports…'
              : error
                ? 'Reports are unavailable'
                : `${items.length} ${kind || 'lost & found'} reports loaded`}
          </Typography>
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
              bgcolor: dark ? 'rgba(28,35,27,.5)' : 'rgba(242,239,234,.5)',
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
              top: 220,
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
        <Box sx={{ width: '100%', height: { xs: '75svh', md: '85vh' }, minHeight: 520 }}>
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
              mapStyle={
                dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'
              }
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
                  maxWidth="290px"
                  offset={28}
                >
                  <Stack
                    spacing={1.5}
                    sx={{ p: 2.5, width: { xs: '100%', sm: 280 }, maxWidth: '100%' }}
                  >
                    <Chip
                      icon={
                        selectedItem.kind === 'lost' ? (
                          <SearchRoundedIcon />
                        ) : (
                          <CheckCircleOutlineRoundedIcon />
                        )
                      }
                      label={selectedItem.kind === 'lost' ? 'Lost item' : 'Found item'}
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        color: selectedItem.kind === 'lost' ? lostColor : foundColor,
                        bgcolor: dark ? '#1D261E' : '#E7E6DF',
                        boxShadow: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        '& .MuiChip-icon': { color: 'inherit', fontSize: 16 },
                      }}
                    />
                    <Typography
                      component="h2"
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: 18,
                        lineHeight: 1.4,
                        fontWeight: 600,
                        color: ink,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {selectedItem.title}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ alignItems: 'flex-start', color: muted }}
                    >
                      <LocationOnIcon sx={{ fontSize: 17, mt: 0.25 }} />
                      <Typography sx={{ fontSize: 12, lineHeight: 1.6, overflowWrap: 'anywhere' }}>
                        {selectedItem.place.name}
                      </Typography>
                    </Stack>
                    <Button
                      href={`${APP_URL}/items/${selectedItem.id}`}
                      endIcon={<ArrowForwardRoundedIcon />}
                      onClick={() => setSelectedItem(null)}
                      sx={{
                        minHeight: 44,
                        mt: 0.5,
                        px: 2,
                        borderRadius: '12px',
                        textTransform: 'none',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        fontWeight: 600,
                        bgcolor: dark ? '#A7C5AC' : '#365E41',
                        color: dark ? '#1B2B1E' : '#FFFFFF',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: dark ? '#BDD7C1' : '#294C33', boxShadow: 'none' },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: foundColor,
                          outlineOffset: 3,
                        },
                      }}
                    >
                      View item in app
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
