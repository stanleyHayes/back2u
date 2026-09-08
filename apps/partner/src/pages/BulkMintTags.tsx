import {
  PartnerWorkspace,
  WorkspaceHeader as PageHeader,
  workspacePanel,
  workspaceHeading,
} from '../components/PartnerWorkspace.js';
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import { EmptyState } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const PUBLIC_URL =
  (import.meta.env.VITE_APP_PUBLIC_URL as string | undefined) ?? 'https://bak2me.com';

function tagScanUrl(code: string): string {
  return `${PUBLIC_URL}/tags/${encodeURIComponent(code)}`;
}

function downloadCsv(filename: string, rows: Record<string, string>[]) {
  if (rows.length === 0) return;
  const first = rows[0]!;
  const headers = Object.keys(first);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function BulkMintTagsContent() {
  const [quantity, setQuantity] = useState(50);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mint = useMutation({
    mutationFn: (count: number) => api.mintTags(count),
  });

  const tags = mint.data ?? [];

  const handleMint = () => {
    const valid = Number.isFinite(quantity) ? Math.max(1, Math.min(500, Math.floor(quantity))) : 50;
    setQuantity(valid);
    mint.mutate(valid);
  };

  const handleCopy = async (code: string) => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(tagScanUrl(code));
    } catch {
      setCopyError('Could not copy the scan link. Try again or download the CSV.');
      return;
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
  };

  const handleDownloadCsv = () => {
    const rows = tags.map((t) => ({
      code: t.code,
      scan_url: tagScanUrl(t.code),
      status: t.status,
    }));
    downloadCsv('qr-tags.csv', rows);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<QrCode2OutlinedIcon />}
        title="Mint QR tags"
        description="Generate a batch of bak2me QR tags to print and attach to items handed in at your venue."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 3 }}>
        <Box sx={workspacePanel}>
          <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 23 }}>
            Build your tag batch
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 1, mb: 3 }}>
            Choose how many unique tags your counter needs. Each batch supports 1–500 tags.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
            {[25, 50, 100, 250].map((count) => (
              <Button
                key={count}
                aria-pressed={quantity === count}
                onClick={() => setQuantity(count)}
                disabled={mint.isPending}
                variant={quantity === count ? 'contained' : 'text'}
              >
                {count} tags
              </Button>
            ))}
          </Stack>
          <TextField
            label="Quantity"
            type="number"
            slotProps={{ htmlInput: { min: 1, max: 500, step: 1 } }}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={mint.isPending}
            fullWidth
            helperText="Enter a whole number between 1 and 500."
          />
          <Button
            variant="contained"
            onClick={handleMint}
            disabled={mint.isPending}
            startIcon={<QrCode2OutlinedIcon />}
            sx={{ mt: 3, minHeight: 46 }}
          >
            {mint.isPending ? 'Minting…' : 'Mint tags'}
          </Button>
        </Box>
        <Box sx={{ ...workspacePanel, boxShadow: 'var(--workspace-inset)' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '18px',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--workspace-green)',
              boxShadow: 'var(--workspace-raised)',
              mb: 3,
            }}
          >
            <QrCode2OutlinedIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 23 }}>
            Give every item a way back.
          </Typography>
          <Stack spacing={2} sx={{ mt: 2.5 }}>
            {[
              { title: 'Generate', body: 'Create unique tags for the belongings at your venue.' },
              {
                title: 'Export',
                body: 'Download the codes and scan links as a CSV for your print workflow.',
              },
              { title: 'Attach', body: 'Print the tags and attach them to the relevant items.' },
            ].map((step, index) => (
              <Stack key={step.title} direction="row" spacing={1.5}>
                <Typography sx={{ fontSize: 12, color: 'var(--workspace-green)', fontWeight: 700 }}>
                  {index + 1}
                </Typography>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{step.title}</Typography>
                  <Typography
                    sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1.7, mt: 0.4 }}
                  >
                    {step.body}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
      {copyError && (
        <Alert severity="error" onClose={() => setCopyError(null)}>
          {copyError}
        </Alert>
      )}
      {mint.isError && (
        <Alert severity="error">
          {mint.error instanceof Error ? mint.error.message : 'Minting failed'}
        </Alert>
      )}

      {tags.length === 0 && !mint.isPending && (
        <EmptyState
          tone="teal"
          icon={<QrCode2OutlinedIcon />}
          title="No tags minted yet"
          description="Pick a quantity above and mint your first batch — each tag gets a unique scan link you can copy or export as CSV."
        />
      )}

      {tags.length > 0 && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle1">
              Generated {tags.length} tag{tags.length === 1 ? '' : 's'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" onClick={handleDownloadCsv}>
              Download CSV
            </Button>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>{tag.code}</TableCell>
                    <TableCell>{tag.status}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => handleCopy(tag.code)}>
                        {copiedCode === tag.code ? 'Copied!' : 'Copy link'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}
    </Stack>
  );
}

export function BulkMintTagsPage() {
  return (
    <PartnerWorkspace>
      <BulkMintTagsContent />
    </PartnerWorkspace>
  );
}
