import {
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import type { ItemDTO, ItemKind } from '@back2u/shared-types';
import { EmptyState, CardGridSkeleton } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { ItemCard } from '../components/ItemCard.js';

const CAT_TEAL = '#40614A';
const CAT_INK = '#2E3D2F';

type CategoryOption = { value: string; label: string; icon: ReactNode; desc: string };
const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: '',
    label: 'All categories',
    icon: <GridViewOutlinedIcon />,
    desc: 'Browse everything posted',
  },
  {
    value: 'Phone',
    label: 'Phone',
    icon: <SmartphoneOutlinedIcon />,
    desc: 'Smartphones, tablets & accessories',
  },
  {
    value: 'Wallet',
    label: 'Wallet',
    icon: <AccountBalanceWalletOutlinedIcon />,
    desc: 'Wallets, purses & cardholders',
  },
  {
    value: 'Keys',
    label: 'Keys',
    icon: <VpnKeyOutlinedIcon />,
    desc: 'Keychains, fobs & access cards',
  },
  {
    value: 'Bag',
    label: 'Bag',
    icon: <ShoppingBagOutlinedIcon />,
    desc: 'Backpacks, handbags & luggage',
  },
  { value: 'ID', label: 'ID', icon: <BadgeOutlinedIcon />, desc: 'ID cards, passports & licences' },
  {
    value: 'Laptop',
    label: 'Laptop',
    icon: <LaptopMacOutlinedIcon />,
    desc: 'Laptops, chargers & devices',
  },
  {
    value: 'Jewelry',
    label: 'Jewelry',
    icon: <DiamondOutlinedIcon />,
    desc: 'Rings, watches & valuables',
  },
  {
    value: 'Document',
    label: 'Document',
    icon: <DescriptionOutlinedIcon />,
    desc: 'Papers, certificates & files',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: <CategoryOutlinedIcon />,
    desc: 'Anything that doesn’t fit above',
  },
];
const CATEGORY_BY_VALUE: Record<string, CategoryOption> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o]),
);

/** Rich category row: tinted icon tile + title + one-line description. */
function categoryContent(icon: ReactNode, label: string, desc: string) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{ alignItems: 'flex-start', py: 0.25, whiteSpace: 'normal' }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(64,97,74,0.10)',
          color: CAT_TEAL,
          '& svg': { fontSize: 19 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25, color: CAT_INK }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.3 }}>
          {desc}
        </Typography>
      </Box>
    </Stack>
  );
}

const RECENT_SEARCHES_KEY = 'back2u:recent-searches';
const MAX_RECENT = 5;

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
}

function addRecentSearch(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = loadRecentSearches();
  const next = [trimmed, ...existing.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())];
  saveRecentSearches(next);
}

type DateRange = 'today' | 'week' | 'month' | 'all';

function isExpiringSoon(item: ItemDTO): boolean {
  if (!item.expiresAt || item.status !== 'open') return false;
  const msLeft = new Date(item.expiresAt).getTime() - Date.now();
  return msLeft > 0 && msLeft <= 3 * 86_400_000;
}

function isExpired(item: ItemDTO): boolean {
  if (!item.expiresAt || item.status !== 'open') return false;
  return new Date(item.expiresAt).getTime() <= Date.now();
}

function getDateRange(range: DateRange): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  switch (range) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
    }
    case 'week': {
      const start = new Date(now.getTime() - 7 * 86_400_000);
      return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
    }
    case 'month': {
      const start = new Date(now.getTime() - 30 * 86_400_000);
      return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
    }
    default:
      return {};
  }
}

type SearchOption = { type: 'recent' | 'category'; label: string };
type CityOption = { type: 'city'; label: string };

export function FeedPage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [kind, setKind] = useState<ItemKind | ''>('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Persist search term to recent searches when it settles
  const prevDebouncedRef = useRef(debouncedSearch);
  useEffect(() => {
    if (debouncedSearch && debouncedSearch !== prevDebouncedRef.current) {
      addRecentSearch(debouncedSearch);
    }
    prevDebouncedRef.current = debouncedSearch;
  }, [debouncedSearch]);

  const filters = useMemo(() => {
    const f: {
      kind?: ItemKind;
      search?: string;
      category?: string;
      city?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {};
    if (kind) f.kind = kind;
    if (debouncedSearch) f.search = debouncedSearch;
    if (category) f.category = category;
    if (city) f.city = city;
    const dr = getDateRange(dateRange);
    if (dr.dateFrom) f.dateFrom = dr.dateFrom;
    if (dr.dateTo) f.dateTo = dr.dateTo;
    return f;
  }, [kind, debouncedSearch, category, city, dateRange]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['items', filters],
    queryFn: () =>
      api.listItems({
        ...filters,
        pageSize: 24,
      }),
  });

  const { data: bookmarks } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.listBookmarks(),
    enabled: !!user,
  });

  const bookmarkedIds = useMemo(() => new Set(bookmarks?.map((b) => b.itemId) ?? []), [bookmarks]);

  const toggleBookmark = useMutation<unknown, Error, { itemId: string; action: 'add' | 'remove' }>({
    mutationFn: ({ itemId, action }) =>
      action === 'add' ? api.bookmarkItem(itemId) : api.unbookmarkItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const [autocompleteInput, setAutocompleteInput] = useState('');
  const [cityInput, setCityInput] = useState('');

  const debouncedAutocomplete = useDebounce(autocompleteInput, 200);
  const debouncedCity = useDebounce(cityInput, 200);

  const { data: autocompleteData } = useQuery({
    queryKey: ['items-autocomplete', debouncedAutocomplete],
    queryFn: () => api.autocompleteItems(debouncedAutocomplete),
    enabled: debouncedAutocomplete.length > 0,
    staleTime: 60_000,
  });

  const { data: cityAutocompleteData } = useQuery({
    queryKey: ['items-autocomplete-city', debouncedCity],
    queryFn: () => api.autocompleteItems(debouncedCity),
    enabled: debouncedCity.length > 0,
    staleTime: 60_000,
  });

  const searchOptions: SearchOption[] = useMemo(() => {
    const recent = loadRecentSearches().map((label) => ({ type: 'recent' as const, label }));
    const cats = (autocompleteData?.categories ?? []).map((label) => ({
      type: 'category' as const,
      label,
    }));
    // Deduplicate: if a category is also a recent search, prefer the category suggestion
    const seen = new Set<string>();
    const out: SearchOption[] = [];
    for (const opt of cats) {
      if (!seen.has(opt.label.toLowerCase())) {
        seen.add(opt.label.toLowerCase());
        out.push(opt);
      }
    }
    for (const opt of recent) {
      if (!seen.has(opt.label.toLowerCase())) {
        seen.add(opt.label.toLowerCase());
        out.push(opt);
      }
    }
    return out;
  }, [autocompleteData]);

  const cityOptions: CityOption[] = useMemo(() => {
    return (cityAutocompleteData?.cities ?? []).map((label) => ({ type: 'city' as const, label }));
  }, [cityAutocompleteData]);

  const activeChips = useMemo(() => {
    const chips: { label: string; onDelete: () => void }[] = [];
    if (kind)
      chips.push({ label: kind === 'lost' ? 'Lost' : 'Found', onDelete: () => setKind('') });
    if (debouncedSearch)
      chips.push({ label: `Search: ${debouncedSearch}`, onDelete: () => setSearch('') });
    if (category) chips.push({ label: category, onDelete: () => setCategory('') });
    if (city) chips.push({ label: city, onDelete: () => setCity('') });
    if (dateRange !== 'all') {
      const labels: Record<DateRange, string> = {
        today: 'Today',
        week: 'This week',
        month: 'This month',
        all: 'All',
      };
      chips.push({ label: labels[dateRange], onDelete: () => setDateRange('all') });
    }
    return chips;
  }, [kind, debouncedSearch, category, city, dateRange]);

  const clearAll = () => {
    setKind('');
    setSearch('');
    setDebouncedSearch('');
    setCategory('');
    setCity('');
    setDateRange('all');
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="h3" sx={{ flex: 1, fontWeight: 700 }}>
          Lost &amp; found
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ flexWrap: 'wrap' }}
        useFlexGap
      >
        <ButtonGroup size="small" variant="outlined">
          <Button variant={kind === '' ? 'contained' : 'outlined'} onClick={() => setKind('')}>
            All
          </Button>
          <Button
            variant={kind === 'lost' ? 'contained' : 'outlined'}
            onClick={() => setKind('lost')}
          >
            Lost
          </Button>
          <Button
            variant={kind === 'found' ? 'contained' : 'outlined'}
            onClick={() => setKind('found')}
          >
            Found
          </Button>
        </ButtonGroup>

        <Autocomplete
          size="small"
          freeSolo
          options={searchOptions}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          inputValue={search}
          onInputChange={(_e, value) => {
            setSearch(value);
            setAutocompleteInput(value);
          }}
          onChange={(_e, value) => {
            if (!value) return;
            if (typeof value === 'string') {
              setSearch(value);
              setDebouncedSearch(value);
            } else if (value.type === 'category') {
              setCategory(value.label);
              setSearch('');
              setAutocompleteInput('');
            } else {
              setSearch(value.label);
              setDebouncedSearch(value.label);
            }
          }}
          filterOptions={(x) => x}
          sx={{ minWidth: 220 }}
          renderOption={(props, option) => {
            const { key, ...rest } = props as { key: string } & React.HTMLAttributes<HTMLLIElement>;
            return (
              <li key={key} {...rest}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {option.type === 'recent' ? (
                    <HistoryIcon fontSize="small" color="action" />
                  ) : (
                    <CategoryIcon fontSize="small" color="action" />
                  )}
                  <Typography variant="body2">
                    {option.type === 'category' ? `Category: ${option.label}` : option.label}
                  </Typography>
                </Stack>
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} placeholder="Search keywords…" />}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={category}
            displayEmpty
            onChange={(e) => setCategory(e.target.value)}
            MenuProps={{
              slotProps: {
                paper: { sx: { width: 340, borderRadius: 3, p: 0.5, mt: 0.5, maxHeight: 460 } },
              },
            }}
            renderValue={(selected) => {
              const opt = CATEGORY_BY_VALUE[(selected as string) ?? ''] ?? CATEGORY_OPTIONS[0]!;
              return (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', color: CAT_TEAL, '& svg': { fontSize: 18 } }}>
                    {opt.icon}
                  </Box>
                  <span>{opt.label}</span>
                </Stack>
              );
            }}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <MenuItem
                key={o.value || 'all'}
                value={o.value}
                sx={{ alignItems: 'flex-start', borderRadius: 2, mx: 0.5, my: 0.25, py: 1 }}
              >
                {categoryContent(o.icon, o.label, o.desc)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          size="small"
          freeSolo
          options={cityOptions}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          inputValue={city}
          onInputChange={(_e, value) => {
            setCity(value);
            setCityInput(value);
          }}
          onChange={(_e, value) => {
            if (typeof value === 'string') {
              setCity(value);
            } else if (value) {
              setCity(value.label);
            }
          }}
          filterOptions={(x) => x}
          sx={{ minWidth: 160 }}
          renderOption={(props, option) => {
            const { key, ...rest } = props as { key: string } & React.HTMLAttributes<HTMLLIElement>;
            return (
              <li key={key} {...rest}>
                <Typography variant="body2">{option.label}</Typography>
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} placeholder="City" />}
        />

        <ButtonGroup size="small" variant="outlined">
          {(['today', 'week', 'month', 'all'] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={dateRange === r ? 'contained' : 'outlined'}
              onClick={() => setDateRange(r)}
            >
              {r === 'today'
                ? 'Today'
                : r === 'week'
                  ? 'This week'
                  : r === 'month'
                    ? 'This month'
                    : 'All'}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      {activeChips.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          useFlexGap
        >
          <Typography variant="body2" color="text.secondary">
            {data?.total ?? 0} result{data?.total === 1 ? '' : 's'}
          </Typography>
          {activeChips.map((chip, i) => (
            <Chip
              key={i}
              size="small"
              label={chip.label}
              onDelete={chip.onDelete}
              deleteIcon={<CloseIcon />}
            />
          ))}
        </Stack>
      )}

      {isLoading ? (
        <CardGridSkeleton count={6} minWidth={280} />
      ) : isError ? (
        <EmptyState
          icon={<TravelExploreOutlinedIcon />}
          title="Couldn't load items"
          description="Something went wrong while fetching the feed. Check your connection and try again."
          actions={[{ label: 'Try again', onClick: () => refetch() }]}
        />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={<TravelExploreOutlinedIcon />}
          title={activeChips.length > 0 ? 'No items match your filters' : 'Nothing here yet'}
          description={
            activeChips.length > 0
              ? 'Try widening your search — clear a filter or two and look again.'
              : 'Be the first to post a lost or found item to the community.'
          }
          actions={
            activeChips.length > 0
              ? [
                  { label: 'Clear filters', onClick: clearAll },
                  { label: 'Post an item', variant: 'secondary', onClick: () => navigate('/post') },
                ]
              : [
                  {
                    label: 'Post an item',
                    startIcon: <AddIcon />,
                    onClick: () => navigate('/post'),
                  },
                ]
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {data?.items.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              isBookmarked={bookmarkedIds.has(it.id)}
              onToggleBookmark={
                user
                  ? () =>
                      toggleBookmark.mutate({
                        itemId: it.id,
                        action: bookmarkedIds.has(it.id) ? 'remove' : 'add',
                      })
                  : undefined
              }
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
