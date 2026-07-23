import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { CardGridSkeleton, EmptyState } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../lib/api.js';
import { ShareButton } from '../components/ShareButton.js';
import { PageHeader, SectionCard } from '../components/BrandPage.js';

const INK = '#0B3D38';
const TEAL = '#0F766E';
const CLAY = '#C2410C';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  lost: { bg: 'rgba(194,65,12,0.12)', color: CLAY },
  active: { bg: 'rgba(15,118,110,0.12)', color: TEAL },
};

export function TagsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-tags'], queryFn: () => api.listMyTags() });
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const claim = useMutation({
    mutationFn: () => api.claimTag(code, label || undefined),
    onSuccess: () => {
      setCode('');
      setLabel('');
      qc.invalidateQueries({ queryKey: ['my-tags'] });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : 'Failed'),
  });
  const markLost = useMutation({
    mutationFn: (c: string) => api.markTagLost(c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tags'] }),
  });

  return (
    <Box maxWidth={820} mx="auto">
      <PageHeader
        eyebrow="Protect your stuff"
        title="QR tags"
        subtitle="Stick a Back2u QR sticker on your laptop, keys, or wallet. Anyone who scans it can message you anonymously the moment they find it."
      />

      <Stack spacing={2.5}>
        <SectionCard icon={<QrCode2Icon />} title="Claim a tag" desc="Enter the code printed on your sticker and give it a label.">
          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Tag code" value={code} onChange={(e) => setCode(e.target.value)} sx={{ flex: 1 }} />
            <TextField label='Item label (e.g. "MacBook")' value={label} onChange={(e) => setLabel(e.target.value)} sx={{ flex: 2 }} />
            <Button
              variant="contained"
              onClick={() => claim.mutate()}
              disabled={!code || claim.isPending}
              sx={{ bgcolor: INK, color: '#FBF6EC', borderRadius: 999, fontWeight: 700, px: 3, '&:hover': { bgcolor: '#0a322e' } }}
            >
              {claim.isPending ? 'Claiming…' : 'Claim'}
            </Button>
          </Stack>
          <Button component={Link} to="/shop/tags" sx={{ mt: 1.5, color: TEAL, fontWeight: 700 }}>
            Need stickers? Visit the tag shop →
          </Button>
        </SectionCard>

        {isLoading ? (
          <CardGridSkeleton count={2} minWidth={300} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            dense
            tone="teal"
            icon={<LocalOfferOutlinedIcon />}
            title="No tags claimed yet"
            description="Claim your first QR tag above to protect an item."
            actions={[{ label: 'Buy QR tags', href: '/shop/tags' }]}
          />
        ) : (
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)' }} gap={2}>
            {data.map((t) => {
              const style = STATUS_STYLE[t.status] ?? { bg: 'rgba(11,61,56,0.08)', color: INK };
              return (
                <Box
                  key={t.id}
                  sx={{ p: 2.25, borderRadius: '18px 18px 18px 4px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontWeight: 700, color: INK, fontSize: 17, minWidth: 0 }} noWrap>
                      {t.itemLabel ?? t.code}
                    </Typography>
                    <Chip label={t.status} size="small" sx={{ height: 22, fontWeight: 700, textTransform: 'capitalize', bgcolor: style.bg, color: style.color }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {t.code}
                  </Typography>
                  {t.lastSeenAt && (
                    <Typography variant="caption" color="text.secondary">
                      Last seen {new Date(t.lastSeenAt).toLocaleString()}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} mt={2} alignItems="center">
                    <ShareButton
                      url={`${window.location.origin}/tags/${t.code}`}
                      message={
                        t.itemLabel
                          ? `Found my "${t.itemLabel}"? Scan or open this Back2u tag to let me know.`
                          : 'Found this? Open this Back2u tag to message the owner anonymously.'
                      }
                      title="Back2u QR tag"
                      size="small"
                    />
                    {t.status !== 'lost' && (
                      <Button size="small" color="error" onClick={() => markLost.mutate(t.code)} sx={{ fontWeight: 600 }}>
                        Mark lost
                      </Button>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
