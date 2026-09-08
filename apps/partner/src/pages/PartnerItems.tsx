import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  InputAdornment,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import type { ItemDTO, ItemKind, ItemStatus } from '@back2u/shared-types';
import { api } from '../lib/api.js';

const STATUSES = [
  'all',
  'open',
  'matched',
  'claimed',
  'returned',
  'closed',
  'archived',
  'auctioned',
  'donated',
] as const;
const KINDS = ['all', 'lost', 'found'] as const;
const heading = { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-.025em' };

function useSurfaces() {
  const dark = useTheme().palette.mode === 'dark';
  return {
    raised: dark
      ? '7px 7px 18px rgba(0,0,0,.28), -5px -5px 15px rgba(105,128,91,.08)'
      : '7px 7px 18px #dcded5, -5px -5px 15px #ffffff',
    inset: dark
      ? 'inset 3px 3px 8px rgba(0,0,0,.32), inset -3px -3px 8px rgba(105,128,91,.10)'
      : 'inset 3px 3px 8px #dcded5, inset -3px -3px 8px #ffffff',
    green: dark ? '#B0C9A5' : '#42633E',
    amber: dark ? '#DCB88C' : '#926031',
  };
}

function ItemCard({ item }: { item: ItemDTO }) {
  const { raised, inset, green, amber } = useSurfaces();
  const [failedImage, setFailedImage] = useState(false);
  const image = item.images[0];
  return (
    <Box
      component={Link}
      to={`/items/${item.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        p: 1.25,
        bgcolor: 'background.default',
        borderRadius: '24px',
        color: 'text.primary',
        textDecoration: 'none',
        boxShadow: raised,
        '&:hover .item-link-arrow': { transform: 'translateX(3px)' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 },
      }}
    >
      <Box
        sx={{
          aspectRatio: '16/10',
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          boxShadow: inset,
          bgcolor: 'action.hover',
        }}
      >
        {image && !failedImage ? (
          <Box
            component="img"
            src={image.url}
            alt=""
            loading="lazy"
            onError={() => setFailedImage(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Stack spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 36 }} />
            <Typography sx={{ fontSize: 12 }}>No photo available</Typography>
          </Stack>
        )}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            bgcolor: item.kind === 'lost' ? '#FAEBDD' : '#E4EBDD',
            color: item.kind === 'lost' ? '#833E1B' : '#2D4D33',
            px: 1.25,
            py: 0.6,
            borderRadius: '9px',
            fontSize: 11,
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0,0,0,.12)',
          }}
        >
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor' }} />
          {item.kind === 'lost' ? 'Lost item' : 'Found item'}
        </Box>
      </Box>
      <Box sx={{ p: 1.25, pt: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '.07em',
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            {item.category}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: item.status === 'open' ? amber : green,
              textTransform: 'capitalize',
            }}
          >
            {item.status}
          </Typography>
        </Stack>
        <Typography
          component="h2"
          sx={{ ...heading, fontSize: 18, lineHeight: 1.4, overflowWrap: 'anywhere' }}
        >
          {item.title}
        </Typography>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ color: 'text.secondary', alignItems: 'flex-start', mt: 1.25, mb: 2 }}
        >
          <LocationOnOutlinedIcon sx={{ fontSize: 16, mt: 0.15 }} />
          <Typography sx={{ fontSize: 12, lineHeight: 1.5 }}>{item.place.name}</Typography>
        </Stack>
        <Stack
          direction="row"
          sx={{
            mt: 'auto',
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
            {new Date(item.occurredAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: green }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600 }}>View report</Typography>
            <ArrowForwardRoundedIcon
              className="item-link-arrow"
              sx={{
                fontSize: 16,
                transition: 'transform .15s',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export function PartnerItemsPage() {
  const [status, setStatus] = useState<ItemStatus | 'all'>('all');
  const [kind, setKind] = useState<ItemKind | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { raised, inset } = useSurfaces();
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['partner-items', status, kind, search, page],
    queryFn: () =>
      api.listItems({
        status: status === 'all' ? undefined : status,
        kind: kind === 'all' ? undefined : kind,
        search: search || undefined,
        page,
        pageSize: 20,
      }),
  });
  const items = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  const filtered = status !== 'all' || kind !== 'all' || search !== '';
  const resetFilters = () => {
    setStatus('all');
    setKind('all');
    setSearch('');
    setPage(1);
  };
  return (
    <Stack component="main" spacing={3}>
      <Box>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.14em',
            color: 'text.secondary',
            mb: 1,
          }}
        >
          YOUR ITEM DIRECTORY
        </Typography>
        <Typography component="h1" sx={{ ...heading, fontSize: { xs: 30, md: 38 } }}>
          Every item. A way home.
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
          Find a report, follow its progress and help the next return happen.
        </Typography>
      </Box>
      <Box
        sx={{
          bgcolor: 'background.default',
          boxShadow: raised,
          p: { xs: 2, md: 2.5 },
          borderRadius: '24px',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{ alignItems: { lg: 'center' } }}
        >
          <TextField
            label="Search reports"
            placeholder="Search by item name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              '& .MuiOutlinedInput-root': { borderRadius: '14px', minHeight: 48 },
            }}
          />
          <Box
            role="group"
            aria-label="Report type"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              p: 0.75,
              gap: 0.5,
              borderRadius: '15px',
              boxShadow: inset,
              minWidth: { lg: 250 },
            }}
          >
            {KINDS.map((value) => (
              <ButtonBase
                key={value}
                aria-pressed={kind === value}
                onClick={() => {
                  setKind(value);
                  setPage(1);
                }}
                sx={{
                  minHeight: 40,
                  borderRadius: '11px',
                  px: 1.5,
                  fontSize: 13,
                  fontWeight: 600,
                  color: kind === value ? 'text.primary' : 'text.secondary',
                  boxShadow: kind === value ? raised : 'none',
                  bgcolor: 'background.default',
                  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' },
                }}
              >
                {value === 'all' ? 'All items' : value === 'lost' ? 'Lost' : 'Found'}
              </ButtonBase>
            ))}
          </Box>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ItemStatus | 'all');
              setPage(1);
            }}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <TuneRoundedIcon sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: { lg: 190 },
              '& .MuiOutlinedInput-root': { borderRadius: '14px', minHeight: 48 },
            }}
          >
            {STATUSES.map((value) => (
              <MenuItem key={value} value={value}>
                {value === 'all' ? 'All statuses' : value.charAt(0).toUpperCase() + value.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', minHeight: 32, gap: 1 }}
      >
        <Typography role="status" sx={{ fontSize: 13, color: 'text.secondary' }}>
          {isPending
            ? 'Loading reports…'
            : isError && !data
              ? 'Reports unavailable'
              : `${data?.total ?? 0} ${filtered ? 'matching' : 'available'} reports`}
        </Typography>
        {filtered && (
          <Button size="small" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </Stack>
      {isError && (
        <Alert
          severity="error"
          action={
            <Button disabled={isFetching} color="inherit" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          We could not load the reports. Please try again.
        </Alert>
      )}
      {isPending ? (
        <Box
          aria-label="Loading reports"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Box key={i} sx={{ p: 1.5, borderRadius: '24px', boxShadow: raised }}>
              <Skeleton variant="rounded" height={180} />
              <Skeleton height={32} sx={{ mt: 2 }} />
              <Skeleton width="65%" />
            </Box>
          ))}
        </Box>
      ) : data && items.length === 0 ? (
        <Box sx={{ boxShadow: inset, borderRadius: '24px', p: 5, textAlign: 'center' }}>
          <Inventory2OutlinedIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
          <Typography component="h2" sx={{ ...heading, fontSize: 24, mt: 2 }}>
            {filtered ? 'No matching reports' : 'Your directory starts here'}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
            {filtered
              ? 'Try another search or clear the filters to see more items.'
              : 'Reports will appear here when items are available.'}
          </Typography>
          {filtered && (
            <Button onClick={resetFilters} sx={{ mt: 2 }}>
              Clear filters
            </Button>
          )}
        </Box>
      ) : data ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2.5,
            }}
          >
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </Box>
          {totalPages > 1 && (
            <Stack spacing={1.5} sx={{ alignItems: 'center', py: 1 }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                Page {page} of {totalPages}
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                siblingCount={0}
                size="small"
              />
            </Stack>
          )}
        </>
      ) : null}
    </Stack>
  );
}
