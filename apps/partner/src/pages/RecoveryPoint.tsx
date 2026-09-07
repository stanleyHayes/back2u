import { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CustodyReceiptDTO,
  ItemCondition,
  PartnerLocationDTO,
  PartnerStaffRole,
} from '@back2u/shared-types';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { EmptyState, ListSkeleton, PageHeader } from '@back2u/ui-web';

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

export function RecoveryPointPage() {
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
        <PageHeader
          icon={<StorefrontOutlinedIcon />}
          title="Recovery Point"
          description="Take found property into custody and release it to verified owners."
        />
        <Alert severity="warning">Your account is not linked to an institution.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<StorefrontOutlinedIcon />}
        title="Recovery Point"
        description="Take found property into custody, keep the chain of custody intact, and release it only to a verified owner."
      />

      {trust.data ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
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
          </Stack>
          {trust.data.trustStatus === 'suspended' ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              This organisation is suspended and cannot accept deposits or release property. Contact
              Bak2Me support.
            </Alert>
          ) : null}
        </Paper>
      ) : null}

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

      <Dialog open={receipt !== null} onClose={() => setReceipt(null)} maxWidth="xs" fullWidth>
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
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  );
}

function Stat(props: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {props.label}
      </Typography>
      {/* `component="div"`: callers pass a Chip here, and Typography's default
          <p> cannot legally contain one. */}
      <Typography variant="body2" component="div" sx={{ textTransform: 'capitalize' }}>
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
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
        >
          <Typography variant="subtitle1">Counters</Typography>
          <Button size="small" onClick={() => setOpen(true)}>
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
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
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
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
        >
          <Typography variant="subtitle1">Staff</Typography>
          <Button size="small" onClick={() => setOpen(true)}>
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
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="body2">{s.userName ?? s.userId.slice(-6)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {s.userEmail ?? ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip size="small" label={s.role} />
                  <IconButton
                    size="small"
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
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
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1">Take an item into custody</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Record the condition and contents in front of the finder, so what you write down is what
          they saw you write down. They get a receipt code, and the deposit earns them BakPoints.
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          The finder reports the item in the Bak2Me app first. Ask them to read you the item
          reference and their user ID from their profile — both are shown on the item they just
          posted.
        </Alert>
        <Stack spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }} direction="row">
          <TextField
            size="small"
            select
            label="Counter"
            value={props.selectedLocationId}
            onChange={(e) => props.onSelectLocation(e.target.value)}
            sx={{ minWidth: 200 }}
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
            sx={{ minWidth: 240 }}
          />
          <TextField
            size="small"
            label="Finder's user ID"
            value={finderId}
            onChange={(e) => setFinderId(e.target.value)}
            helperText="From their Bak2Me profile"
            sx={{ minWidth: 240 }}
          />
          <TextField
            size="small"
            select
            label="Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as ItemCondition)}
            sx={{ minWidth: 160 }}
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
            sx={{ minWidth: 240 }}
          />
          <TextField
            size="small"
            label="Storage bin"
            value={bin}
            onChange={(e) => setBin(e.target.value)}
            helperText="Internal only"
            sx={{ minWidth: 160 }}
          />
        </Stack>
        <Box sx={{ mt: 2 }}>
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
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1">In custody</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Property currently held at this counter.
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
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Seal</TableCell>
                  <TableCell>Bin</TableCell>
                  <TableCell>Since</TableCell>
                  <TableCell align="right">Release</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {props.records.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="body2">{r.itemTitle ?? r.itemId.slice(-6)}</Typography>
                      <Chip
                        size="small"
                        label={r.status}
                        color={CUSTODY_COLOR[r.status] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell>{r.condition}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {r.sealId}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.storageBin ?? '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setReleasing(r.id)}>
                        Release
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>

      <Dialog open={releasing !== null} onClose={close} maxWidth="xs" fullWidth>
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
