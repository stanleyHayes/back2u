import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { EmptyState, CardGridSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const STATUSES = ['all', 'open', 'matched', 'returned', 'closed', 'archived'] as const;
const KINDS = ['all', 'lost', 'found'] as const;

export function PartnerItemsPage() {
  const [status, setStatus] = useState<string>('all');
  const [kind, setKind] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['partner-items', status, kind, search, page],
    queryFn: () =>
      api.listItems({
        status: status === 'all' ? undefined : (status as never),
        kind: kind === 'all' ? undefined : (kind as never),
        search: search || undefined,
        page,
        pageSize: 20,
      }),
  });

  const items = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Items
      </Typography>

      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 240 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <Button
              key={s}
              variant={status === s ? 'contained' : 'outlined'}
              size="small"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {KINDS.map((k) => (
            <Button
              key={k}
              variant={kind === k ? 'contained' : 'outlined'}
              size="small"
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
            >
              {k}
            </Button>
          ))}
        </Box>
      </Stack>

      {isLoading ? (
        <CardGridSkeleton count={6} minWidth={280} />
      ) : items.length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<Inventory2OutlinedIcon />}
          title="No items found"
          description="No items match these filters yet — try clearing them."
        />
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {items.map((item) => (
              <Card
                key={item.id}
                variant="outlined"
                component={Link}
                to={`/items/${item.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <Chip label={item.status} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {item.kind} · {item.category} · {item.place.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {item.description.slice(0, 100)}...
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          <Pagination count={totalPages} page={page} onChange={(_e, v) => setPage(v)} />
        </>
      )}
    </Stack>
  );
}
