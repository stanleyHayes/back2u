import 'mapbox-gl/dist/mapbox-gl.css';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Button, ButtonGroup, Chip, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useQuery } from '@tanstack/react-query';
import { Map as ReactMap, Marker, Popup, NavigationControl } from 'react-map-gl';
import type { MapEvent, MapRef, ViewStateChangeEvent } from 'react-map-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import Supercluster from 'supercluster';
import type { BBox } from 'geojson';
import type { ItemDTO, ItemKind } from '@back2u/shared-types';
import { EmptyState } from '@back2u/ui-web';
import { Link } from 'react-router-dom';

import { api } from '../lib/api.js';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

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
  const theme = useTheme();
  const size = 20 + Math.min(count, 50);

  let bg: string;
  if (lostCount > 0 && foundCount === 0) bg = theme.palette.primary.main;
  else if (foundCount > 0 && lostCount === 0) bg = theme.palette.success.main;
  else bg = theme.palette.secondary.main;

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
        boxShadow: theme.shadows[2],
        transition: 'transform 0.15s ease',
        '&:hover': { transform: 'scale(1.1)' },
      }}
    >
      {count}
    </Box>
  );
}

function ItemPin({ kind }: { kind: ItemKind }) {
  const theme = useTheme();
  const color = kind === 'lost' ? theme.palette.primary.main : theme.palette.success.main;

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

export function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [kind, setKind] = useState<ItemKind | ''>('');
  const [bounds, setBounds] = useState<BBox | null>(null);
  const [zoom, setZoom] = useState(11);
  const [selectedItem, setSelectedItem] = useState<ItemDTO | null>(null);

  const { data, isError, refetch } = useQuery({
    queryKey: ['items-map', kind],
    queryFn: () =>
      api.listItems({
        pageSize: 500,
        ...(kind ? { kind } : {}),
      }),
  });

  const cluster = useMemo(() => {
    if (!data?.items) return null;

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

    const points: PointFeature[] = data.items.map((item) => ({
      type: 'Feature',
      properties: { itemId: item.id, kind: item.kind },
      geometry: {
        type: 'Point',
        coordinates: item.place.point.coordinates,
      },
    }));

    sc.load(points);
    return sc;
  }, [data?.items]);

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

  const handleMyLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
        });
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    );
  }, []);

  const itemsById = useMemo(() => {
    if (!data?.items) return new Map<string, ItemDTO>();
    return new Map(data.items.map((it) => [it.id, it]));
  }, [data?.items]);

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Typography variant="h3" fontWeight={700}>
          Lost zones
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<MyLocationIcon />}
          onClick={handleMyLocation}
        >
          My location
        </Button>
      </Stack>

      <Typography color="text.secondary">
        Hotspots show where reports are clustered. Subscribe to a zone to be alerted when something new is reported
        nearby.
      </Typography>

      <ButtonGroup size="small" variant="outlined">
        <Button variant={kind === '' ? 'contained' : 'outlined'} onClick={() => setKind('')}>
          All
        </Button>
        <Button variant={kind === 'lost' ? 'contained' : 'outlined'} onClick={() => setKind('lost')}>
          Lost
        </Button>
        <Button variant={kind === 'found' ? 'contained' : 'outlined'} onClick={() => setKind('found')}>
          Found
        </Button>
      </ButtonGroup>

      <Box
        height={520}
        borderRadius={3}
        overflow="hidden"
        border={1}
        borderColor="divider"
        position="relative"
      >
        {!TOKEN ? (
          <Box p={4}>
            <Typography color="error">VITE_MAPBOX_TOKEN missing.</Typography>
          </Box>
        ) : isError ? (
          <EmptyState
            dense
            icon={<LocationOnIcon />}
            title="Couldn't load items"
            description="Something went wrong while fetching nearby reports. Check your connection and try again."
            actions={[{ label: 'Try again', onClick: () => refetch() }]}
          />
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
                    color={selectedItem.kind === 'lost' ? 'primary' : 'success'}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    to={`/items/${selectedItem.id}`}
                    onClick={() => setSelectedItem(null)}
                  >
                    View details
                  </Button>
                </Stack>
              </Popup>
            )}
          </ReactMap>
        )}
      </Box>
    </Stack>
  );
}
