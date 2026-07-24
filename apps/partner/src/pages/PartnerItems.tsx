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
import { EmptyState, PageHeader, CardGridSkeleton } from '@back2u/ui-web';
import type { ItemDTO } from '@back2u/shared-types';

import { api } from '../lib/api.js';

const STATUSES = ['all', 'open', 'matched', 'returned', 'closed', 'archived'] as const;
const KINDS = ['all', 'lost', 'found'] as const;

function ItemCard({ item }: { item: ItemDTO }) {
  const image = item.images[0];
  return (
    <Card
      component={Link}
      to={`/items/${item.id}`}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'border-color .15s ease, transform .15s ease',
        '&:hover': { borderColor: 'rgba(168,181,160,0.4)', transform: 'translateY(-2px)' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16/10',
          bgcolor: 'rgba(168,181,160,0.08)',
          display: 'grid',
          placeItems: 'center',
          color: '#A8B5A0',
        }}
      >
        {image ? (
          <Box
            component="img"
            src={image.url}
            alt={item.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Inventory2OutlinedIcon sx={{ fontSize: 44 }} />
        )}
        <Chip
          label={item.kind}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            textTransform: 'capitalize',
            fontWeight: 700,
            bgcolor: item.kind === 'found' ? 'rgba(168,181,160,0.92)' : 'rgba(194,65,12,0.92)',
            color: item.kind === 'found' ? '#1C231B' : '#FFF3E8',
          }}
        />
        <Chip
          label={item.status}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            textTransform: 'capitalize',
            fontWeight: 700,
            bgcolor: 'rgba(10,15,22,0.72)',
            color: '#F3F6FB',
            backdropFilter: 'blur(4px)',
          }}
        />
      </Box>
      <CardContent>
        <Typography
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {item.category} · {item.place.city ?? item.place.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {new Date(item.occurredAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

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
      <PageHeader
        icon={<Inventory2OutlinedIcon />}
        title="Items"
        description="Lost and found items reported at your institution. Filter by status or kind, or search by name."
      />

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
              <ItemCard key={item.id} item={item} />
            ))}
          </Box>
          <Pagination count={totalPages} page={page} onChange={(_e, v) => setPage(v)} />
        </>
      )}
    </Stack>
  );
}
