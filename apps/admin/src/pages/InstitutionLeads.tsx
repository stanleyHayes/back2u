import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InstitutionLeadStatus } from '@back2u/shared-types';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const STATUS_COLOR: Record<InstitutionLeadStatus, 'default' | 'info' | 'success' | 'error'> = {
  new: 'info',
  contacted: 'default',
  approved: 'success',
  rejected: 'error',
};

export function InstitutionLeadsPage() {
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-institution-leads'],
    queryFn: () => api.listInstitutionLeads(),
  });

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: 'contacted' | 'approved' | 'rejected' }) =>
      api.decideInstitutionLead(input.id, input.decision),
  });

  const items = data ?? [];
  const allSelected = items.length > 0 && items.every((l) => selectedIds.has(l.id));
  const someSelected = items.some((l) => selectedIds.has(l.id)) && !allSelected;
  const newCount = items.filter((l) => l.status === 'new').length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const runBulk = async (decision: 'approved' | 'rejected') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: ids.length });
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      setProgress({ current: i + 1, total: ids.length });
      try {
        await decide.mutateAsync({ id: ids[i], decision } as {
          id: string;
          decision: 'approved' | 'rejected';
        });
      } catch {
        failed++;
      }
    }

    setSelectedIds(new Set());
    setProcessing(false);
    await qc.invalidateQueries({ queryKey: ['admin-institution-leads'] });
    setSnackbar({
      open: true,
      message:
        failed > 0 ? `Completed with ${failed} failures.` : `All ${ids.length} leads ${decision}.`,
      severity: failed > 0 ? 'error' : 'success',
    });
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Partnership leads
          </Typography>
          {newCount > 0 && <Chip label={`${newCount} new`} color="info" />}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleSelectAll}
            disabled={items.length === 0 || processing}
          />
          <Typography variant="body2" color="text.secondary">
            Select all
          </Typography>
        </Stack>
      </Stack>

      <Typography color="text.secondary">
        Self-serve “Partner with us” submissions from the marketing site. Triage, reach out, and
        convert approved leads into onboarded institutions.
      </Typography>

      {selectedIds.size > 0 && (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="success"
            disabled={processing}
            onClick={() => runBulk('approved')}
          >
            Approve selected ({selectedIds.size})
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={processing}
            onClick={() => runBulk('rejected')}
          >
            Reject selected ({selectedIds.size})
          </Button>
        </Stack>
      )}

      {processing && (
        <Stack spacing={1}>
          <LinearProgress variant="determinate" value={(progress.current / progress.total) * 100} />
          <Typography variant="caption" color="text.secondary">
            Processing {progress.current} of {progress.total}…
          </Typography>
        </Stack>
      )}

      {isLoading && <ListSkeleton rows={4} avatar={false} />}
      {data && data.length === 0 && (
        <EmptyState
          tone="teal"
          icon={<BusinessOutlinedIcon />}
          title="No leads yet"
          description="Institution sign-up requests from the marketing site will show up here for review."
        />
      )}

      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}
      >
        {items.map((lead) => (
          <Card key={lead.id} variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    disabled={processing}
                  />
                  <Box>
                    <Typography variant="h6">{lead.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lead.type ? `${lead.type} · ` : ''}
                      {lead.city} · {new Date(lead.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
                <Chip label={lead.status} size="small" color={STATUS_COLOR[lead.status]} />
              </Stack>

              <Stack spacing={0.25} sx={{ mt: 1.5, pl: 4 }}>
                <Typography variant="body2">
                  <b>Contact:</b> {lead.contactName}
                </Typography>
                <Typography variant="body2">
                  <b>Email:</b> <a href={`mailto:${lead.contactEmail}`}>{lead.contactEmail}</a>
                </Typography>
                {lead.contactPhone && (
                  <Typography variant="body2">
                    <b>Phone:</b> {lead.contactPhone}
                  </Typography>
                )}
                {lead.estimatedVolume && (
                  <Typography variant="body2">
                    <b>Est. monthly items:</b> {lead.estimatedVolume}
                  </Typography>
                )}
              </Stack>

              {lead.message && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1.5, pl: 4, fontStyle: 'italic' }}
                >
                  “{lead.message}”
                </Typography>
              )}

              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap', pl: 4 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={processing || lead.status === 'contacted'}
                  onClick={() => decide.mutate({ id: lead.id, decision: 'contacted' })}
                >
                  Mark contacted
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={processing || lead.status === 'approved'}
                  onClick={() => decide.mutate({ id: lead.id, decision: 'approved' })}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  color="error"
                  disabled={processing || lead.status === 'rejected'}
                  onClick={() => decide.mutate({ id: lead.id, decision: 'rejected' })}
                >
                  Reject
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
