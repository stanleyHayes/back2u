import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { EmptyState } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from '../lib/api.js';
import { PageHeader, SectionCard } from '../components/BrandPage.js';

const INK = '#2E3D2F';
const MARIGOLD = '#8B6F4E';

export function VaultPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['vault'], queryFn: () => api.listVault() });
  const [form, setForm] = useState({
    label: '',
    category: 'Phone',
    serialNumber: '',
    imei: '',
    notes: '',
  });

  const create = useMutation({
    mutationFn: () => api.createVaultEntry(form),
    onSuccess: () => {
      setForm({ label: '', category: 'Phone', serialNumber: '', imei: '', notes: '' });
      qc.invalidateQueries({ queryKey: ['vault'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteVaultEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] }),
  });

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <PageHeader
        eyebrow="Pre-registration"
        title="Memory Vault"
        subtitle="Store serial numbers, IMEIs, and receipts now. If an item is ever lost, this proof speeds up verification and recovery."
      />

      <Stack spacing={2.5}>
        <SectionCard
          icon={<Inventory2OutlinedIcon />}
          title="Add an item"
          desc="Encrypted at rest — only you can read these details."
          accent={MARIGOLD}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                sx={{ flex: 2 }}
              />
              <TextField
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Serial number"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="IMEI"
                value={form.imei}
                onChange={(e) => setForm({ ...form, imei: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
            />
            <Box>
              <Button
                variant="contained"
                onClick={() => create.mutate()}
                disabled={!form.label || create.isPending}
                sx={{
                  bgcolor: INK,
                  color: '#F2EFEA',
                  borderRadius: 999,
                  fontWeight: 700,
                  px: 3,
                  '&:hover': { bgcolor: '#243024' },
                }}
              >
                {create.isPending ? 'Saving…' : 'Save to vault'}
              </Button>
            </Box>
          </Stack>
        </SectionCard>

        {data && data.length === 0 ? (
          <EmptyState
            dense
            tone="marigold"
            icon={<ShieldOutlinedIcon />}
            title="Your vault is empty"
            description="Add your valuables above so you're ready if anything goes missing."
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' },
              gap: 2,
            }}
          >
            {data?.map((e) => (
              <Box
                key={e.id}
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
                  spacing={1}
                  sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{ fontWeight: 700, color: 'text.primary', fontSize: 17 }}
                      noWrap
                    >
                      {e.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {e.category}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => remove.mutate(e.id)}
                    sx={{ flexShrink: 0, fontWeight: 600 }}
                  >
                    Delete
                  </Button>
                </Stack>
                <Stack spacing={0.25} sx={{ mt: 1.5 }}>
                  {e.serialNumber && (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      SN: {e.serialNumber}
                    </Typography>
                  )}
                  {e.imei && (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      IMEI: {e.imei}
                    </Typography>
                  )}
                  {e.notes && (
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {e.notes}
                    </Typography>
                  )}
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
