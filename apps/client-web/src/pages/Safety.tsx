import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { AiAssistantBar } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { PageHeader, SectionCard } from '../components/BrandPage.js';

const INK = '#0B3D38';
const CLAY = '#C2410C';

const TARGETS = ['user', 'item', 'message', 'listing'] as const;
const REASONS = ['scam', 'harassment', 'spam', 'inappropriate', 'other'] as const;

const inkBtn = {
  bgcolor: INK,
  color: '#FBF6EC',
  borderRadius: 999,
  fontWeight: 700,
  px: 2.5,
  '&:hover': { bgcolor: '#0a322e' },
} as const;

export function SafetyPage() {
  const qc = useQueryClient();
  const { data: blocks } = useQuery({ queryKey: ['blocks'], queryFn: () => api.listBlocks() });
  const [blockId, setBlockId] = useState('');
  const [report, setReport] = useState({
    target: 'user' as (typeof TARGETS)[number],
    targetId: '',
    reason: 'scam' as (typeof REASONS)[number],
    note: '',
  });

  const block = useMutation({
    mutationFn: () => api.blockUser(blockId),
    onSuccess: () => {
      setBlockId('');
      qc.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
  const unblock = useMutation({
    mutationFn: (id: string) => api.unblockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });
  const file = useMutation({ mutationFn: () => api.fileReport(report) });

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto' }}>
      <PageHeader
        eyebrow="Trust & safety"
        title="Safety center"
        subtitle="Block someone, manage who you've blocked, and report anything that breaks the rules. Our team reviews every report."
      />

      <Stack spacing={2.5}>
        <SectionCard
          icon={<BlockIcon />}
          title="Block a user"
          desc="They won't be able to message you or see your contact."
          accent={CLAY}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="User ID"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={() => block.mutate()}
              disabled={!blockId || block.isPending}
              sx={inkBtn}
            >
              {block.isPending ? 'Blocking…' : 'Block'}
            </Button>
          </Stack>
        </SectionCard>

        <SectionCard icon={<GppMaybeOutlinedIcon />} title="Your blocks">
          {!blocks || blocks.length === 0 ? (
            <Typography color="text.secondary">You haven't blocked anyone.</Typography>
          ) : (
            <Stack spacing={1}>
              {blocks.map((b) => (
                <Box
                  key={b.blockedId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.25,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    sx={{ flex: 1, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}
                  >
                    {b.blockedId}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => unblock.mutate(b.blockedId)}
                    sx={{ fontWeight: 600, flexShrink: 0 }}
                  >
                    Unblock
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>

        <SectionCard
          icon={<FlagOutlinedIcon />}
          title="Report content"
          desc="Flag a user, item, message, or listing for review."
          accent={CLAY}
        >
          {file.isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Report filed. Thank you — our team will take a look.
            </Alert>
          )}
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Target"
                value={report.target}
                onChange={(e) =>
                  setReport({ ...report, target: e.target.value as typeof report.target })
                }
                sx={{ flex: 1 }}
              >
                {TARGETS.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Reason"
                value={report.reason}
                onChange={(e) =>
                  setReport({ ...report, reason: e.target.value as typeof report.reason })
                }
                sx={{ flex: 1 }}
              >
                {REASONS.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              label="Target ID"
              value={report.targetId}
              onChange={(e) => setReport({ ...report, targetId: e.target.value })}
              fullWidth
            />
            <Box>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Note (optional)
                </Typography>
                <AiAssistantBar
                  dense
                  tone="clay"
                  value={report.note}
                  onChange={(text) => setReport({ ...report, note: text })}
                  assist={api.aiAssist.bind(api)}
                  actions={['fix_grammar', 'improve_clarity', 'formalize', 'expand']}
                />
              </Stack>
              <TextField
                label="Note (optional)"
                multiline
                minRows={2}
                value={report.note}
                onChange={(e) => setReport({ ...report, note: e.target.value })}
                fullWidth
              />
            </Box>
            <Box>
              <Button
                variant="contained"
                onClick={() => file.mutate()}
                disabled={!report.targetId || file.isPending}
                sx={inkBtn}
              >
                {file.isPending ? 'Filing…' : 'File report'}
              </Button>
            </Box>
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  );
}
