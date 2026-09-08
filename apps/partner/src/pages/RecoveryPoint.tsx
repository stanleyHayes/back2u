import { useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CustodyReceiptDTO,
  ItemCondition,
  PartnerLocationDTO,
  PartnerStaffRole,
} from '@back2u/shared-types';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const CONDITIONS: ItemCondition[] = ['new', 'good', 'fair', 'poor', 'damaged'];
const ROLES: PartnerStaffRole[] = ['agent', 'supervisor', 'manager'];

const TRUST_COLOR: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  active: 'success',
  watchlist: 'info',
  reward_hold: 'warning',
  suspended: 'error',
};

const CUSTODY_COLOR: Record<string, 'default' | 'success' | 'info'> = {
  held: 'info',
  released: 'success',
  transferred: 'default',
  disposed: 'default',
};

const heading = { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-.025em' };

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: 'center', mb: description ? 2.5 : 0, minWidth: 0 }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '14px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: 'primary.main',
          boxShadow: 'var(--recovery-inset)',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" sx={{ ...heading, fontSize: 20 }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1.6, mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function RecoveryHeader() {
  return (
    <Box>
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.14em',
          mb: 1,
        }}
      >
        YOUR RECOVERY POINT
      </Typography>
      <Typography component="h1" sx={{ ...heading, fontSize: { xs: 30, md: 38 }, lineHeight: 1.2 }}>
        A safe place. A way back.
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1, maxWidth: 640 }}>
        Manage your counters, record found property and help verified owners collect their
        belongings.
      </Typography>
    </Box>
  );
}

export function RecoveryPointPage() {
  const dark = useTheme().palette.mode === 'dark';
  const qc = useQueryClient();
  const institutionId = useAuth((s) => s.user)?.institutionId;

  const [locationId, setLocationId] = useState<string>('');
  const [receipt, setReceipt] = useState<CustodyReceiptDTO | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const notify = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });
  const fail = (err: Error) => notify(err.message, 'error');

  const locations = useQuery({
    queryKey: ['partner-locations'],
    queryFn: () => api.listPartnerLocations(),
    enabled: !!institutionId,
  });

  const staff = useQuery({
    queryKey: ['partner-staff'],
    queryFn: () => api.listPartnerStaff(),
    enabled: !!institutionId,
  });

  const trust = useQuery({
    queryKey: ['partner-trust'],
    queryFn: () => api.getMyPartnerTrust(),
    enabled: !!institutionId,
  });

  const activeLocation = locationId || locations.data?.find((l) => l.active)?.id || '';

  const custody = useQuery({
    queryKey: ['partner-custody', activeLocation],
    queryFn: () => api.listCustodyAtLocation(activeLocation, { status: 'held', pageSize: 50 }),
    enabled: !!activeLocation,
  });

  const invalidate = (keys: string[][]) => {
    for (const key of keys) void qc.invalidateQueries({ queryKey: key });
  };

  if (!institutionId) {
    return (
      <Stack spacing={3}>
        <RecoveryHeader />
        <Alert severity="warning">Your account is not linked to an institution.</Alert>
      </Stack>
    );
  }

  return (
    <Stack
      component="main"
      spacing={3}
      sx={{
        '--recovery-inset': dark
          ? 'inset 3px 3px 8px rgba(0,0,0,.32), inset -3px -3px 8px rgba(105,128,91,.10)'
          : 'inset 3px 3px 8px #dcded5, inset -3px -3px 8px #ffffff',
        '--recovery-raised': dark
          ? '7px 7px 18px rgba(0,0,0,.28), -5px -5px 15px rgba(105,128,91,.08)'
          : '7px 7px 18px #dcded5, -5px -5px 15px #ffffff',
        '& .recovery-panel': {
          bgcolor: 'background.default',
          boxShadow: 'var(--recovery-raised)',
          border: 'none',
          borderRadius: '24px',
          minWidth: 0,
          overflow: 'visible',
        },
        '& .recovery-panel > .MuiCardContent-root': { p: { xs: 2.5, md: 3 } },
        '& .recovery-row': {
          boxShadow: 'var(--recovery-inset)',
          p: 1.75,
          borderRadius: '15px',
          minWidth: 0,
          gap: 1.5,
        },
        '& .MuiOutlinedInput-root': { borderRadius: '13px', boxShadow: 'var(--recovery-inset)' },
        '& .MuiChip-root': { boxShadow: 'none', textTransform: 'capitalize', fontSize: 11 },
        '& .MuiTableCell-head': {
          bgcolor: 'action.hover',
          color: 'text.secondary',
          fontSize: 11,
          fontWeight: 600,
        },
        '& .MuiTableCell-body': { py: 2 },
        '& #counter-setup, & #item-intake, & #held-items': { scrollMarginTop: 125 },
      }}
    >
      <RecoveryHeader />
      <Stack
        component="nav"
        aria-label="Recovery point sections"
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        <Button
          href="#counter-setup"
          startIcon={<StorefrontOutlinedIcon />}
          sx={{ borderRadius: '12px', fontSize: 12 }}
        >
          Counters &amp; staff
        </Button>
        <Button
          href="#item-intake"
          startIcon={<MoveToInboxOutlinedIcon />}
          sx={{ borderRadius: '12px', fontSize: 12 }}
        >
          Accept an item
        </Button>
        <Button
          href="#held-items"
          startIcon={<Inventory2OutlinedIcon />}
          sx={{ borderRadius: '12px', fontSize: 12 }}
        >
          Held property
        </Button>
      </Stack>
      {[
        { query: locations, label: 'Counters' },
        { query: staff, label: 'Staff' },
        { query: trust, label: 'Standing' },
        { query: custody, label: 'Held property' },
      ].map(({ query, label }) =>
        query.isError ? (
          <Alert
            key={label}
            severity="error"
            action={
              <Button color="inherit" disabled={query.isFetching} onClick={() => query.refetch()}>
                Retry
              </Button>
            }
          >
            {label} could not be loaded. Please try again.
          </Alert>
        ) : null,
      )}

      {trust.data ? (
        <Paper className="recovery-panel" sx={{ p: { xs: 2.5, md: 3 } }}>
          <SectionHeading
            icon={<VerifiedUserOutlinedIcon />}
            title="Your recovery standing"
            description="Your organisation’s status and custody record."
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                xl: 'repeat(6, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Stat label="Standing">
              <Chip
                size="small"
                label={trust.data.trustStatus.replace('_', ' ')}
                color={TRUST_COLOR[trust.data.trustStatus] ?? 'default'}
              />
            </Stat>
            <Stat label="Tier">{trust.data.tier.replace(/_/g, ' ')}</Stat>
            <Stat label="In custody">{trust.data.openCustody}</Stat>
            <Stat label="Deposits">{trust.data.deposits}</Stat>
            <Stat label="Released">{trust.data.releases}</Stat>
            <Stat label="Return rate">
              {trust.data.depositsToReturnsRatio === null
                ? '—'
                : `${Math.round(trust.data.depositsToReturnsRatio * 100)}%`}
            </Stat>
          </Box>
          {trust.data.trustStatus === 'suspended' ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              This organisation is suspended and cannot accept deposits or release property. Contact
              Bak2Me support.
            </Alert>
          ) : null}
        </Paper>
      ) : null}

      <Box
        id="counter-setup"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        <LocationsCard
          locations={locations.data ?? []}
          loading={locations.isLoading}
          onCreated={() => invalidate([['partner-locations']])}
          onRemoved={() => invalidate([['partner-locations']])}
          notify={notify}
          fail={fail}
        />

        <StaffCard
          staff={staff.data ?? []}
          locations={locations.data ?? []}
          loading={staff.isLoading}
          onChanged={() => invalidate([['partner-staff']])}
          notify={notify}
          fail={fail}
        />
      </Box>

      <IntakeCard
        locations={(locations.data ?? []).filter((l) => l.active)}
        selectedLocationId={activeLocation}
        onSelectLocation={setLocationId}
        onAccepted={(r) => {
          setReceipt(r);
          invalidate([['partner-custody', activeLocation], ['partner-trust']]);
        }}
        fail={fail}
      />

      <ShelfCard
        locationId={activeLocation}
        records={custody.data?.records ?? []}
        loading={custody.isLoading}
        onReleased={() => {
          invalidate([['partner-custody', activeLocation], ['partner-trust']]);
          notify('Item released and the chain of custody updated.');
        }}
        notify={notify}
        fail={fail}
      />

      <Dialog
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              bgcolor: 'background.default',
              '& .MuiDialogTitle-root': { ...heading, fontSize: 22 },
              '& .MuiOutlinedInput-root': { borderRadius: '13px' },
              '& .MuiDialogActions-root': { p: 2.5, gap: 1 },
            },
          },
        }}
        open={receipt !== null}
        onClose={() => setReceipt(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Custody receipt</DialogTitle>
        <DialogContent dividers>
          {receipt ? (
            <Stack spacing={1.5}>
              <Alert severity="success">Item accepted. Give the finder their receipt code.</Alert>
              <Field label="Receipt code" value={receipt.receiptCode} mono />
              <Field label="Seal ID" value={receipt.sealId} mono />
              <Field label="Accepted" value={new Date(receipt.acceptedAt).toLocaleString()} />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceipt(null)}>Done</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? null : 6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  );
}

function Stat(props: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ p: 1.75, borderRadius: '15px', boxShadow: 'var(--recovery-inset)' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {props.label}
      </Typography>
      {/* `component="div"`: callers pass a Chip here, and Typography's default
          <p> cannot legally contain one. */}
      <Typography
        variant="body2"
        component="div"
        sx={{
          ...heading,
          fontSize: 20,
          mt: 0.75,
          textTransform: 'capitalize',
          overflowWrap: 'anywhere',
        }}
      >
        {props.children}
      </Typography>
    </Box>
  );
}

function Field(props: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {props.label}
      </Typography>
      <Typography
        variant="body2"
        sx={props.mono ? { fontFamily: 'monospace', letterSpacing: 1 } : undefined}
      >
        {props.value}
      </Typography>
    </Box>
  );
}

function LocationsCard(props: {
  locations: PartnerLocationDTO[];
  loading: boolean;
  onCreated: () => void;
  onRemoved: () => void;
  notify: (m: string) => void;
  fail: (e: Error) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [storage, setStorage] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.createPartnerLocation({
        name: name.trim(),
        // Coordinates default to the venue's own address until a map picker
        // lands; the counter is identified by name for staff either way.
        place: {
          name: address.trim() || name.trim(),
          point: { type: 'Point', coordinates: [0, 0] },
        },
        storageDescription: storage.trim() || undefined,
      }),
    onSuccess: () => {
      props.onCreated();
      props.notify('Recovery Point added.');
      setOpen(false);
      setName('');
      setAddress('');
      setStorage('');
    },
    onError: props.fail,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deactivatePartnerLocation(id),
    onSuccess: () => {
      props.onRemoved();
      props.notify('Recovery Point closed.');
    },
    onError: props.fail,
  });

  return (
    <Card className="recovery-panel">
      <CardContent>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            mb: 2.5,
          }}
        >
          <SectionHeading icon={<StorefrontOutlinedIcon />} title="Your counters" />
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>
            Add counter
          </Button>
        </Stack>
        {props.loading ? (
          <ListSkeleton />
        ) : props.locations.length === 0 ? (
          <EmptyState
            icon={<StorefrontOutlinedIcon />}
            title="No counters yet"
            description="Add the desk where staff will accept and store found property."
          />
        ) : (
          <Stack spacing={1}>
            {props.locations.map((l) => (
              <Stack
                key={l.id}
                className="recovery-row"
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2">{l.name}</Typography>
                    {l.active ? null : <Chip size="small" label="closed" />}
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {l.storageDescription ?? l.place.name}
                  </Typography>
                </Box>
                {l.active ? (
                  <Tooltip title="Close this counter. Only possible once it holds nothing.">
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Close ${l.name}`}
                        onClick={() => remove.mutate(l.id)}
                        disabled={remove.isPending}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>

      <Dialog
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              bgcolor: 'background.default',
              '& .MuiDialogTitle-root': { ...heading, fontSize: 22 },
              '& .MuiOutlinedInput-root': { borderRadius: '13px' },
              '& .MuiDialogActions-root': { p: 2.5, gap: 1 },
            },
          },
        }}
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add a counter</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              size="small"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              size="small"
              label="Where it is"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="Storage"
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              helperText="Internal only — where items are physically kept."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

function StaffCard(props: {
  staff: {
    id: string;
    userId: string;
    role: string;
    active: boolean;
    userName?: string;
    userEmail?: string;
  }[];
  locations: PartnerLocationDTO[];
  loading: boolean;
  onChanged: () => void;
  notify: (m: string) => void;
  fail: (e: Error) => void;
}) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<PartnerStaffRole>('agent');
  const [locationId, setLocationId] = useState('');

  const add = useMutation({
    mutationFn: () =>
      api.addPartnerStaff({
        userId: userId.trim(),
        role,
        locationId: locationId || undefined,
      }),
    onSuccess: () => {
      props.onChanged();
      props.notify('Staff member added.');
      setOpen(false);
      setUserId('');
    },
    onError: props.fail,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.removePartnerStaff(id),
    onSuccess: () => {
      props.onChanged();
      props.notify('Staff member removed.');
    },
    onError: props.fail,
  });

  const active = props.staff.filter((s) => s.active);

  return (
    <Card className="recovery-panel">
      <CardContent>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            mb: 2.5,
          }}
        >
          <SectionHeading icon={<GroupsOutlinedIcon />} title="Your team" />
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>
            Add staff
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
          Only listed staff can accept or release property, and every custody event records who
          acted.
        </Typography>
        {props.loading ? (
          <ListSkeleton />
        ) : active.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No staff enrolled yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {active.map((s) => (
              <Stack
                key={s.id}
                className="recovery-row"
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  <Typography variant="body2">{s.userName ?? s.userId.slice(-6)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {s.userEmail ?? ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip size="small" label={s.role} />
                  <IconButton
                    size="small"
                    aria-label={`Remove ${s.userName ?? 'staff member'}`}
                    onClick={() => remove.mutate(s.id)}
                    disabled={remove.isPending}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>

      <Dialog
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              bgcolor: 'background.default',
              '& .MuiDialogTitle-root': { ...heading, fontSize: 22 },
              '& .MuiOutlinedInput-root': { borderRadius: '13px' },
              '& .MuiDialogActions-root': { p: 2.5, gap: 1 },
            },
          },
        }}
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add a staff member</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              size="small"
              label="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              helperText="The person must already have a Bak2Me account."
              fullWidth
              autoFocus
            />
            <TextField
              size="small"
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as PartnerStaffRole)}
              fullWidth
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Counter"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              helperText="Leave blank to allow every counter."
              fullWidth
            >
              <MenuItem value="">Any counter</MenuItem>
              {props.locations.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!userId.trim() || add.isPending}
            onClick={() => add.mutate()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

function IntakeCard(props: {
  locations: PartnerLocationDTO[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  onAccepted: (r: CustodyReceiptDTO) => void;
  fail: (e: Error) => void;
}) {
  const [itemId, setItemId] = useState('');
  const [finderId, setFinderId] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [contents, setContents] = useState('');
  const [bin, setBin] = useState('');

  const accept = useMutation({
    mutationFn: () =>
      api.acceptCustody({
        itemId: itemId.trim(),
        locationId: props.selectedLocationId,
        depositedByUserId: finderId.trim(),
        condition,
        declaredContents: contents
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        storageBin: bin.trim() || undefined,
      }),
    onSuccess: (receipt) => {
      props.onAccepted(receipt);
      setItemId('');
      setFinderId('');
      setContents('');
      setBin('');
    },
    onError: props.fail,
  });

  const ready = itemId.trim() && finderId.trim() && props.selectedLocationId;

  return (
    <Card id="item-intake" className="recovery-panel">
      <CardContent>
        <SectionHeading
          icon={<MoveToInboxOutlinedIcon />}
          title="Accept found property"
          description="Record the handover with the finder present."
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Check the condition and contents together. Once accepted, the finder receives a receipt
          code and the item is added to this counter’s custody record.
        </Typography>
        {props.locations.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Add an active counter before accepting property.
          </Alert>
        )}
        <Alert severity="info" sx={{ mb: 2 }}>
          The finder reports the item in the Bak2Me app first. Ask them to read you the item
          reference and their user ID from their profile — both are shown on the item they just
          posted.
        </Alert>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2.5,
            mt: 3,
          }}
        >
          <TextField
            size="small"
            select
            label="Counter"
            value={props.selectedLocationId}
            onChange={(e) => props.onSelectLocation(e.target.value)}
            sx={{ minWidth: 0 }}
          >
            {props.locations.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Item reference"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            helperText="From the finder's posted item"
            sx={{ minWidth: 0 }}
          />
          <TextField
            size="small"
            label="Finder's user ID"
            value={finderId}
            onChange={(e) => setFinderId(e.target.value)}
            helperText="From their Bak2Me profile"
            sx={{ minWidth: 0 }}
          />
          <TextField
            size="small"
            select
            label="Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as ItemCondition)}
            sx={{ minWidth: 0 }}
          >
            {CONDITIONS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Declared contents"
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            helperText="Comma separated"
            sx={{ minWidth: 0 }}
          />
          <TextField
            size="small"
            label="Storage bin"
            value={bin}
            onChange={(e) => setBin(e.target.value)}
            helperText="Internal only"
            sx={{ minWidth: 0 }}
          />
        </Box>
        <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="contained"
            disabled={!ready || accept.isPending}
            onClick={() => accept.mutate()}
          >
            Accept into custody
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function ShelfCard(props: {
  locationId: string;
  records: {
    id: string;
    itemId: string;
    itemTitle?: string;
    condition: string;
    sealId: string;
    storageBin?: string;
    status: string;
    createdAt: string;
  }[];
  loading: boolean;
  onReleased: () => void;
  notify: (m: string) => void;
  fail: (e: Error) => void;
}) {
  const [releasing, setReleasing] = useState<string | null>(null);
  const [claimantId, setClaimantId] = useState('');
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');

  const issue = useMutation({
    mutationFn: (input: { id: string; claimantId: string }) =>
      api.issueReleaseCode(input.id, input.claimantId),
    onSuccess: (r) =>
      props.notify(
        r.sentTo === 'sms'
          ? 'Collection code sent to the owner by SMS.'
          : 'Collection code sent to the owner in the app.',
      ),
    onError: props.fail,
  });

  const release = useMutation({
    mutationFn: (input: { id: string; claimantId: string; releaseCode: string; note?: string }) =>
      api.releaseCustody(input.id, {
        claimantId: input.claimantId,
        releaseCode: input.releaseCode,
        note: input.note,
      }),
    onSuccess: () => {
      props.onReleased();
      close();
    },
    onError: props.fail,
  });

  const close = () => {
    setReleasing(null);
    setClaimantId('');
    setCode('');
    setNote('');
  };

  return (
    <Card id="held-items" className="recovery-panel">
      <CardContent>
        <SectionHeading
          icon={<Inventory2OutlinedIcon />}
          title="Held property"
          description="Items awaiting collection at the selected counter."
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Showing up to 50 held items. Release requires the verified owner’s collection code.
        </Typography>
        {props.loading ? (
          <ListSkeleton />
        ) : !props.locationId ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Add a counter to start accepting property.
          </Typography>
        ) : props.records.length === 0 ? (
          <EmptyState
            icon={<StorefrontOutlinedIcon />}
            title="Nothing held"
            description="Items accepted at this counter will appear here until they are collected."
          />
        ) : (
          <Stack spacing={1.5}>
            {props.records.map((r) => (
              <Box key={r.id} className="recovery-row">
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, overflowWrap: 'anywhere' }}>
                      {r.itemTitle ?? r.itemId.slice(-6)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.75 }}>
                      <Chip
                        size="small"
                        label={r.status}
                        color={CUSTODY_COLOR[r.status] ?? 'default'}
                      />
                      <Typography
                        sx={{ color: 'text.secondary', fontSize: 12, textTransform: 'capitalize' }}
                      >
                        {r.condition} condition
                      </Typography>
                    </Stack>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setReleasing(r.id)}
                    sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
                  >
                    Release to owner
                  </Button>
                </Stack>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                    gap: 1.5,
                    mt: 2,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Field label="Seal" value={r.sealId} mono />
                  <Field label="Storage bin" value={r.storageBin ?? 'Not assigned'} />
                  <Field label="Accepted" value={new Date(r.createdAt).toLocaleDateString()} />
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>

      <Dialog
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              bgcolor: 'background.default',
              '& .MuiDialogTitle-root': { ...heading, fontSize: 22 },
              '& .MuiOutlinedInput-root': { borderRadius: '13px' },
              '& .MuiDialogActions-root': { p: 2.5, gap: 1 },
            },
          },
        }}
        open={releasing !== null}
        onClose={close}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Release to owner</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Alert severity="info">
              The owner must already have proved ownership in the app. Send them a collection code,
              then type back the code they read to you — that is what proves the person at your
              counter is the account we verified.
            </Alert>
            <TextField
              size="small"
              label="Owner's user ID"
              value={claimantId}
              onChange={(e) => setClaimantId(e.target.value)}
              fullWidth
              autoFocus
            />
            <Button
              size="small"
              disabled={!claimantId.trim() || issue.isPending || releasing === null}
              onClick={() =>
                releasing && issue.mutate({ id: releasing, claimantId: claimantId.trim() })
              }
            >
              {issue.isPending ? 'Sending…' : 'Send collection code'}
            </Button>
            <Divider />
            <TextField
              size="small"
              label="Collection code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              helperText="Expires 30 minutes after it is sent. Five wrong tries and you will need a new one."
              fullWidth
            />
            <TextField
              size="small"
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              helperText="e.g. ID checked at the desk"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!claimantId.trim() || !code.trim() || release.isPending || releasing === null}
            onClick={() =>
              releasing &&
              release.mutate({
                id: releasing,
                claimantId: claimantId.trim(),
                releaseCode: code.trim(),
                note: note.trim() || undefined,
              })
            }
          >
            Release item
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
