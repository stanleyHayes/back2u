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

import { api } from '../lib/api.js';

const PUBLIC_URL = (import.meta.env.VITE_APP_PUBLIC_URL as string | undefined) ?? 'https://back2u.app';

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

export function BulkMintTagsPage() {
  const [quantity, setQuantity] = useState(50);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mint = useMutation({
    mutationFn: () => api.mintTags(quantity),
  });

  const tags = mint.data ?? [];

  const handleMint = () => {
    const valid = Math.max(1, Math.min(500, quantity));
    setQuantity(valid);
    mint.mutate();
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(tagScanUrl(code));
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
      <Typography variant="h4" fontWeight={700}>
        Mint QR Tags
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Quantity"
          type="number"
          inputProps={{ min: 1, max: 500 }}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          sx={{ width: 120 }}
        />
        <Button variant="contained" onClick={handleMint} disabled={mint.isPending}>
          {mint.isPending ? 'Minting…' : 'Mint tags'}
        </Button>
      </Stack>

      {mint.isError && (
        <Alert severity="error">
          {mint.error instanceof Error ? mint.error.message : 'Minting failed'}
        </Alert>
      )}

      {tags.length > 0 && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle1">
              Generated {tags.length} tag{tags.length === 1 ? '' : 's'}
            </Typography>
            <Box flex={1} />
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
