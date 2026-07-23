import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { TableChart, Timeline, Download, FilterAltOff } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import type { AuditLogDTO, UserDTO } from '@back2u/shared-types';
import { EmptyState, TableSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

type ViewMode = 'table' | 'timeline';

const BASE_ENTITY_OPTIONS = [
  'Item',
  'User',
  'Match',
  'ChatMessage',
  'MarketplaceListing',
  'Institution',
  'Redemption',
  'Verification',
  'Webhook',
  'Zone',
  'CourierJob',
  'Tag',
  'Bid',
  'Reward',
];

function getActionColor(action: string): 'success' | 'info' | 'error' | 'warning' | 'default' {
  const normalized = action.toLowerCase();
  if (normalized.includes('create')) return 'success';
  if (normalized.includes('update') || normalized.includes('edit') || normalized.includes('patch'))
    return 'info';
  if (normalized.includes('delete') || normalized.includes('remove')) return 'error';
  if (
    normalized.includes('auth') ||
    normalized.includes('login') ||
    normalized.includes('logout') ||
    normalized.includes('token')
  )
    return 'warning';
  return 'default';
}

function getActionDotColor(action: string): string {
  const normalized = action.toLowerCase();
  if (normalized.includes('create')) return '#2e7d32';
  if (normalized.includes('update') || normalized.includes('edit') || normalized.includes('patch'))
    return '#0288d1';
  if (normalized.includes('delete') || normalized.includes('remove')) return '#d32f2f';
  if (
    normalized.includes('auth') ||
    normalized.includes('login') ||
    normalized.includes('logout') ||
    normalized.includes('token')
  )
    return '#ed6c02';
  return '#757575';
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (seconds < 10) return 'Just now';
  if (minutes < 1) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getDateLabel(dateStr: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(dateStr);
  const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (entryDay.getTime() === today.getTime()) return 'Today';
  if (entryDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeCsvCell(val: string): string {
  if (val.includes('"') || val.includes(',') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function AuditLogPage() {
  const [view, setView] = useState<ViewMode>('timeline');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [entityFilter, setEntityFilter] = useState<string>('All');
  const [dateRange, setDateRange] = useState<string>('All');
  const [actorSearch, setActorSearch] = useState('');
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [activeActorId, setActiveActorId] = useState<string | null>(null);

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.listUsers({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const userMap = useMemo(() => {
    const map = new Map<string, UserDTO>();
    users?.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit', actionFilter, entityFilter, activeEntityId, activeActorId],
    queryFn: () =>
      api.listAuditLogs({
        limit: 500,
        action: actionFilter === 'All' ? undefined : actionFilter,
        entity: entityFilter === 'All' ? undefined : entityFilter,
        entityId: activeEntityId ?? undefined,
        actorId: activeActorId ?? undefined,
      }),
  });

  const entityOptions = useMemo(() => {
    const set = new Set(BASE_ENTITY_OPTIONS);
    auditLogs?.forEach((l) => set.add(l.entity));
    return ['All', ...Array.from(set).sort()];
  }, [auditLogs]);

  const filtered = useMemo(() => {
    let result = auditLogs ?? [];

    const now = new Date();
    if (dateRange === 'Today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter((r) => new Date(r.createdAt) >= start);
    } else if (dateRange === 'Last 7 days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((r) => new Date(r.createdAt) >= start);
    } else if (dateRange === 'Last 30 days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((r) => new Date(r.createdAt) >= start);
    }

    if (actorSearch.trim()) {
      const q = actorSearch.trim().toLowerCase();
      result = result.filter((r) => {
        if (r.actorId?.toLowerCase().includes(q)) return true;
        const user = userMap.get(r.actorId ?? '');
        return user?.name?.toLowerCase().includes(q) || user?.email?.toLowerCase().includes(q);
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [auditLogs, dateRange, actorSearch, userMap]);

  const grouped = useMemo(() => {
    const map = new Map<string, AuditLogDTO[]>();
    for (const entry of filtered) {
      const label = getDateLabel(entry.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(entry);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const exportCSV = () => {
    const headers = [
      'Date',
      'Action',
      'Entity',
      'Entity ID',
      'Actor ID',
      'Actor Email',
      'Actor Name',
      'IP',
      'Metadata',
    ];
    const rows = filtered.map((e) => [
      new Date(e.createdAt).toISOString(),
      e.action,
      e.entity,
      e.entityId,
      e.actorId ?? '—',
      userMap.get(e.actorId ?? '')?.email ?? '—',
      userMap.get(e.actorId ?? '')?.name ?? '—',
      e.ip ?? '—',
      JSON.stringify(e.meta ?? {}),
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => escapeCsvCell(String(c))).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    actionFilter !== 'All' ||
    entityFilter !== 'All' ||
    dateRange !== 'All' ||
    actorSearch !== '' ||
    activeEntityId !== null ||
    activeActorId !== null;

  const clearFilters = () => {
    setActionFilter('All');
    setEntityFilter('All');
    setDateRange('All');
    setActorSearch('');
    setActiveEntityId(null);
    setActiveActorId(null);
  };

  const handleEntityClick = (entityId: string) => {
    setActiveEntityId(entityId);
    setEntityFilter('All');
    setView('timeline');
  };

  const handleActorClick = (actorId: string) => {
    setActiveActorId(actorId);
    setActorSearch('');
    setView('timeline');
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Audit log
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_e, v) => v && setView(v)}
            size="small"
          >
            <ToggleButton value="timeline">
              <Timeline fontSize="small" sx={{ mr: 0.5 }} />
              Timeline
            </ToggleButton>
            <ToggleButton value="table">
              <TableChart fontSize="small" sx={{ mr: 0.5 }} />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      {/* Active filter chips */}
      {(activeEntityId || activeActorId) && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {activeEntityId && (
            <Chip
              label={`Entity ID: ${activeEntityId}`}
              onDelete={() => setActiveEntityId(null)}
              color="primary"
              size="small"
            />
          )}
          {activeActorId && (
            <Chip
              label={`Actor ID: ${activeActorId}`}
              onDelete={() => setActiveActorId(null)}
              color="primary"
              size="small"
            />
          )}
        </Stack>
      )}

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={actionFilter}
            label="Action"
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="create">Create</MenuItem>
            <MenuItem value="update">Update</MenuItem>
            <MenuItem value="delete">Delete</MenuItem>
            <MenuItem value="auth">Auth</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Entity type</InputLabel>
          <Select
            value={entityFilter}
            label="Entity type"
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            {entityOptions.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Date range</InputLabel>
          <Select
            value={dateRange}
            label="Date range"
            onChange={(e) => setDateRange(e.target.value)}
          >
            <MenuItem value="All">All time</MenuItem>
            <MenuItem value="Today">Today</MenuItem>
            <MenuItem value="Last 7 days">Last 7 days</MenuItem>
            <MenuItem value="Last 30 days">Last 30 days</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Actor search"
          value={actorSearch}
          onChange={(e) => setActorSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
          placeholder="Name, email or ID"
        />

        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearFilters} size="small" color="error">
              <FilterAltOff fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {!isLoading && (
        <Typography variant="body2" color="text.secondary">
          {`${filtered.length} entries`}
        </Typography>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : view === 'timeline' ? (
        <TimelineView
          grouped={grouped}
          userMap={userMap}
          onEntityClick={handleEntityClick}
          onActorClick={handleActorClick}
        />
      ) : (
        <TableView
          entries={filtered}
          userMap={userMap}
          onEntityClick={handleEntityClick}
          onActorClick={handleActorClick}
        />
      )}
    </Stack>
  );
}

function TimelineView({
  grouped,
  userMap,
  onEntityClick,
  onActorClick,
}: {
  grouped: [string, AuditLogDTO[]][];
  userMap: Map<string, UserDTO>;
  onEntityClick: (id: string) => void;
  onActorClick: (id: string) => void;
}) {
  if (grouped.length === 0) {
    return (
      <EmptyState
        dense
        tone="teal"
        icon={<HistoryOutlinedIcon />}
        title="No audit entries"
        description="Nothing matches your current filters. Try widening the date range or clearing filters."
      />
    );
  }

  return (
    <Stack spacing={4}>
      {grouped.map(([dateLabel, entries]) => (
        <Box key={dateLabel}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, ml: { xs: 0, md: '148px' }, mb: 1, display: 'block' }}
          >
            {dateLabel}
          </Typography>
          <Stack spacing={0}>
            {entries.map((entry, idx) => (
              <TimelineRow
                key={entry.id}
                entry={entry}
                userMap={userMap}
                onEntityClick={onEntityClick}
                onActorClick={onActorClick}
                isLast={idx === entries.length - 1}
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function TimelineRow({
  entry,
  userMap,
  onEntityClick,
  onActorClick,
  isLast,
}: {
  entry: AuditLogDTO;
  userMap: Map<string, UserDTO>;
  onEntityClick: (id: string) => void;
  onActorClick: (id: string) => void;
  isLast: boolean;
}) {
  const actor = entry.actorId ? userMap.get(entry.actorId) : undefined;
  const color = getActionDotColor(entry.action);

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
      {/* Timestamp */}
      <Box
        sx={{
          width: { xs: 80, md: 120 },
          textAlign: 'right',
          pt: 1.5,
          flexShrink: 0,
        }}
      >
        <Tooltip title={new Date(entry.createdAt).toLocaleString()}>
          <Typography variant="caption" color="text.secondary" sx={{ cursor: 'default' }}>
            {formatRelativeTime(entry.createdAt)}
          </Typography>
        </Tooltip>
      </Box>

      {/* Dot + line */}
      <Box
        sx={{
          position: 'relative',
          width: 24,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: color,
            border: 2,
            borderColor: 'background.paper',
            mt: 1.5,
            zIndex: 1,
          }}
        />
        {!isLast && (
          <Box
            sx={{
              position: 'absolute',
              top: 28,
              bottom: -8,
              width: 2,
              bgcolor: 'divider',
            }}
          />
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, pb: 2 }}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}
            >
              <Chip label={entry.action} size="small" color={getActionColor(entry.action)} />
              <Typography variant="body2" color="text.secondary">
                on
              </Typography>
              <Chip
                label={`${entry.entity} / ${entry.entityId}`}
                size="small"
                variant="outlined"
                onClick={() => onEntityClick(entry.entityId)}
                clickable
              />
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Typography variant="body2" color="text.secondary">
                by
              </Typography>
              {actor ? (
                <Chip
                  label={`${actor.name} (${actor.email})`}
                  size="small"
                  variant="outlined"
                  onClick={() => onActorClick(entry.actorId!)}
                  clickable
                />
              ) : (
                <Chip
                  label={entry.actorId ?? 'System'}
                  size="small"
                  variant="outlined"
                  onClick={entry.actorId ? () => onActorClick(entry.actorId!) : undefined}
                  clickable={!!entry.actorId}
                />
              )}
              {entry.ip && (
                <Typography variant="caption" color="text.secondary">
                  · IP {entry.ip}
                </Typography>
              )}
            </Stack>
            {entry.meta && Object.keys(entry.meta).length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="caption"
                  component="pre"
                  color="text.secondary"
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    bgcolor: 'action.hover',
                    p: 1,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                  }}
                >
                  {JSON.stringify(entry.meta, null, 2)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function TableView({
  entries,
  userMap,
  onEntityClick,
  onActorClick,
}: {
  entries: AuditLogDTO[];
  userMap: Map<string, UserDTO>;
  onEntityClick: (id: string) => void;
  onActorClick: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        dense
        tone="teal"
        icon={<HistoryOutlinedIcon />}
        title="No audit entries"
        description="Nothing matches your current filters. Try widening the date range or clearing filters."
      />
    );
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Entity</TableCell>
            <TableCell>Actor</TableCell>
            <TableCell>IP</TableCell>
            <TableCell>Metadata</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => {
            const actor = entry.actorId ? userMap.get(entry.actorId) : undefined;
            return (
              <TableRow key={entry.id} hover>
                <TableCell>
                  <Tooltip title={new Date(entry.createdAt).toLocaleString()}>
                    <span>{formatRelativeTime(entry.createdAt)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip label={entry.action} size="small" color={getActionColor(entry.action)} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2">{entry.entity}</Typography>
                    <Chip
                      label={entry.entityId}
                      size="small"
                      variant="outlined"
                      onClick={() => onEntityClick(entry.entityId)}
                      clickable
                    />
                  </Stack>
                </TableCell>
                <TableCell>
                  {actor ? (
                    <Chip
                      label={actor.name}
                      size="small"
                      variant="outlined"
                      onClick={() => onActorClick(entry.actorId!)}
                      clickable
                    />
                  ) : (
                    <Chip
                      label={entry.actorId ?? 'System'}
                      size="small"
                      variant="outlined"
                      onClick={entry.actorId ? () => onActorClick(entry.actorId!) : undefined}
                      clickable={!!entry.actorId}
                    />
                  )}
                </TableCell>
                <TableCell>{entry.ip ?? '—'}</TableCell>
                <TableCell>
                  {entry.meta ? (
                    <Typography
                      variant="caption"
                      component="span"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {JSON.stringify(entry.meta).slice(0, 60)}
                      {JSON.stringify(entry.meta).length > 60 ? '…' : ''}
                    </Typography>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
