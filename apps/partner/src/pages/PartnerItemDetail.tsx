import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { AiAssistantBar } from '@back2u/ui-web';

import { api } from '../lib/api.js';

export function PartnerItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const { data: item, isLoading } = useQuery({
    queryKey: ['partner-item', id],
    queryFn: () => api.getItem(id!),
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.updateItem(id!, { status: status as never }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-item', id] }),
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!item) return <Typography>Item not found.</Typography>;

  return (
    <Stack spacing={3}>
      <Button onClick={() => navigate(-1)}>← Back</Button>

      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        {item.title}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip label={item.kind} />
        <Chip label={item.status} color="primary" />
        <Chip label={item.category} />
        <Chip label={item.place.name} />
      </Stack>

      {item.images[0] && (
        <Box
          component="img"
          src={item.images[0].url}
          alt={item.title}
          sx={{ maxWidth: 400, borderRadius: 2 }}
        />
      )}

      <Typography variant="body1">{item.description}</Typography>

      <Divider />

      <Typography variant="h6">Actions</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {item.status === 'open' && (
          <Button variant="outlined" onClick={() => updateStatus.mutate('closed')}>
            Close item
          </Button>
        )}
        {item.status === 'matched' && (
          <Button variant="outlined" onClick={() => updateStatus.mutate('returned')}>
            Mark returned
          </Button>
        )}
      </Stack>

      {updateStatus.isError && (
        <Alert severity="error">
          {updateStatus.error instanceof Error ? updateStatus.error.message : 'Failed'}
        </Alert>
      )}

      <Divider />

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Internal notes</Typography>
        <AiAssistantBar
          dense
          value={note}
          onChange={setNote}
          assist={api.aiAssist.bind(api)}
          actions={[
            'fix_grammar',
            'improve_clarity',
            'formalize',
            'summarize',
            'create_from_prompt',
            'translate',
          ]}
        />
      </Stack>
      <TextField
        label="Add a note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        multiline
        rows={2}
      />
      <Button variant="contained" disabled>
        Save note (coming soon)
      </Button>
    </Stack>
  );
}
