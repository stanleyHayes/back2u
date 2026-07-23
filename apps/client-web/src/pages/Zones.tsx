import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { EmptyState } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from '../lib/api.js';
import { PageHeader, SectionCard } from '../components/BrandPage.js';

const INK = '#0B3D38';

export function ZonesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['zones'], queryFn: () => api.listZones() });
  const [name, setName] = useState('');
  const [poly, setPoly] = useState(
    '[[-0.21,5.59],[-0.16,5.59],[-0.16,5.62],[-0.21,5.62],[-0.21,5.59]]',
  );

  const create = useMutation({
    mutationFn: () =>
      api.createZone({
        name,
        polygon: { type: 'Polygon', coordinates: [JSON.parse(poly) as [number, number][]] },
      }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['zones'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteZone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <PageHeader
        eyebrow="Geo-fencing"
        title="Zone alerts"
        subtitle="Subscribe to an area on the map — we'll ping you the moment a lost-or-found item is reported inside it."
      />

      <Stack spacing={2.5}>
        <SectionCard
          icon={<AddLocationAltOutlinedIcon />}
          title="Create a zone"
          desc="Draw a polygon on geojson.io and paste the coordinates."
        >
          <Stack spacing={2}>
            <TextField
              label="Zone name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Polygon coordinates JSON [ [lng,lat], … ]"
              multiline
              minRows={3}
              value={poly}
              onChange={(e) => setPoly(e.target.value)}
              helperText="Closed ring (first = last). Use turf.io / geojson.io to draw."
              fullWidth
            />
            <Box>
              <Button
                variant="contained"
                onClick={() => create.mutate()}
                disabled={!name || create.isPending}
                sx={{
                  bgcolor: INK,
                  color: '#FBF6EC',
                  borderRadius: 999,
                  fontWeight: 700,
                  px: 3,
                  '&:hover': { bgcolor: '#0a322e' },
                }}
              >
                {create.isPending ? 'Saving…' : 'Save zone'}
              </Button>
            </Box>
            {create.isError && (
              <Alert severity="error">
                Couldn’t save that zone — check the coordinates are valid JSON.
              </Alert>
            )}
          </Stack>
        </SectionCard>

        {data && data.length === 0 ? (
          <EmptyState
            dense
            tone="teal"
            icon={<SensorsOutlinedIcon />}
            title="No zones yet"
            description="Create your first watch zone above to start receiving geo-fenced alerts."
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' },
              gap: 2,
            }}
          >
            {data?.map((z) => (
              <Box
                key={z.id}
                sx={{
                  p: 2.25,
                  borderRadius: '18px 18px 18px 4px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack
                  direction="row"
                  sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{ fontWeight: 700, color: 'text.primary', fontSize: 17 }}
                      noWrap
                    >
                      {z.name}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ mt: 0.75, flexWrap: 'wrap' }}
                      useFlexGap
                    >
                      {z.channels.map((ch) => (
                        <Chip
                          key={ch}
                          size="small"
                          label={ch}
                          sx={{
                            height: 20,
                            bgcolor: 'rgba(15,118,110,0.12)',
                            color: 'primary.main',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => remove.mutate(z.id)}
                    sx={{ flexShrink: 0, fontWeight: 600 }}
                  >
                    Delete
                  </Button>
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
