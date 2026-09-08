import {
  PartnerWorkspace,
  WorkspaceHeader as PageHeader,
  workspacePanel,
  workspaceHeading,
} from '../components/PartnerWorkspace.js';
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
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateRewardOfferInput,
  RewardCategory,
  RewardOfferDTO,
  RewardOfferStatus,
  TrustLevel,
} from '@back2u/shared-types';
import {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  TRUST_LEVELS,
  TRUST_LEVEL_LABELS,
} from '@back2u/shared-types';
import LoyaltyOutlinedIcon from '@mui/icons-material/LoyaltyOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const STATUS_COLOR: Record<RewardOfferStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  live: 'success',
  paused: 'warning',
  ended: 'default',
};

/** What each status means for members, so a partner is not guessing. */
const STATUS_HELP: Record<RewardOfferStatus, string> = {
  draft: 'Not visible to members yet.',
  live: 'Members can see and claim this.',
  paused: 'Hidden from members; existing claims still stand.',
  ended: 'Finished. An ended campaign cannot be reopened.',
};

function RewardsCatalogContent() {
  const qc = useQueryClient();
  const institutionId = useAuth((s) => s.user)?.institutionId;
  const [editing, setEditing] = useState<RewardOfferDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const notify = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const offers = useQuery({
    queryKey: ['partner-reward-offers'],
    queryFn: () => api.listMyRewardOffers(),
    enabled: !!institutionId,
  });

  const analytics = useQuery({
    queryKey: ['partner-reward-analytics'],
    queryFn: () => api.getPartnerRewardAnalytics(),
    enabled: !!institutionId,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['partner-reward-offers'] });
    void qc.invalidateQueries({ queryKey: ['partner-reward-analytics'] });
  };

  const setStatus = useMutation({
    mutationFn: (input: { id: string; status: RewardOfferStatus }) =>
      api.updateRewardOffer(input.id, { status: input.status }),
    onSuccess: (_r, input) => {
      refresh();
      notify(
        input.status === 'live'
          ? 'Reward is live — members can claim it now.'
          : `Reward ${input.status}.`,
      );
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  if (!institutionId) {
    return (
      <Stack spacing={3}>
        <PageHeader
          icon={<LoyaltyOutlinedIcon />}
          title="Reward shop"
          description="Offer perks that members buy with the points they earned returning things."
        />
        <Alert severity="warning">Your account is not linked to an institution.</Alert>
      </Stack>
    );
  }

  const list = offers.data ?? [];
  const stats = analytics.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<LoyaltyOutlinedIcon />}
        title="Reward shop"
        description="Perks you fund, bought with the BakPoints members earned returning property. You set the stock, the dates and who qualifies."
      />

      {stats ? (
        <Paper sx={{ ...workspacePanel }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Stat label="Live rewards" value={stats.liveOffers} />
            <Stat label="Waiting to collect" value={stats.totalReserved} />
            <Stat label="Collected" value={stats.totalRedeemed} />
            <Stat label="Points spent with you" value={stats.totalPointsSpent.toLocaleString()} />
          </Box>
        </Paper>
      ) : null}

      {offers.isError && (
        <Alert severity="error" action={<Button onClick={() => offers.refetch()}>Retry</Button>}>
          Rewards could not be loaded.
        </Alert>
      )}
      {analytics.isError && (
        <Alert severity="error" action={<Button onClick={() => analytics.refetch()}>Retry</Button>}>
          Reward activity could not be loaded.
        </Alert>
      )}
      <Card variant="outlined">
        <CardContent>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
          >
            <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 23 }}>
              Your rewards
            </Typography>
            <Button size="small" variant="contained" onClick={() => setCreating(true)}>
              New reward
            </Button>
          </Stack>

          {offers.isLoading ? (
            <ListSkeleton />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<LoyaltyOutlinedIcon />}
              title="No rewards yet"
              description="Add something members can spend their points on — mobile data, a voucher, a discount. You fund it; Bak2Me handles the points."
              actions={[{ label: 'Create your first reward', onClick: () => setCreating(true) }]}
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                gap: 2.5,
              }}
            >
              {list.map((offer) => {
                const activity = stats?.offers.find((entry) => entry.offerId === offer.id);
                return (
                  <Box
                    key={offer.id}
                    sx={{
                      p: 2.5,
                      borderRadius: '20px',
                      boxShadow: 'var(--workspace-inset)',
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}
                    >
                      <Typography
                        sx={{ color: 'var(--workspace-green)', fontSize: 11, fontWeight: 600 }}
                      >
                        {REWARD_CATEGORY_LABELS[offer.category]}
                      </Typography>
                      <Tooltip title={STATUS_HELP[offer.status]}>
                        <Chip
                          label={offer.status}
                          size="small"
                          color={STATUS_COLOR[offer.status]}
                        />
                      </Tooltip>
                    </Stack>
                    <Typography
                      component="h3"
                      sx={{ ...workspaceHeading, fontSize: 22, overflowWrap: 'anywhere' }}
                    >
                      {offer.title}
                    </Typography>
                    <Typography
                      sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.7, mt: 1 }}
                    >
                      {offer.description}
                    </Typography>
                    <Typography
                      sx={{
                        ...workspaceHeading,
                        fontSize: 28,
                        color: 'var(--workspace-amber)',
                        mt: 2,
                      }}
                    >
                      {offer.pointsCost.toLocaleString()}{' '}
                      <Box component="span" sx={{ fontSize: 12 }}>
                        pts
                      </Box>
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>
                      {offer.minTrustLevel
                        ? `${TRUST_LEVEL_LABELS[offer.minTrustLevel]} and above`
                        : 'Open to everyone'}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: 1,
                        mt: 2.5,
                        py: 2,
                        borderTop: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stat
                        label="Stock left"
                        value={
                          offer.remainingInventory === null
                            ? 'Unlimited'
                            : `${offer.remainingInventory} / ${offer.totalInventory}`
                        }
                      />
                      <Stat label="Claimed" value={activity?.reserved ?? '—'} />
                      <Stat label="Collected" value={activity?.redeemed ?? '—'} />
                    </Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 11, mt: 1.5 }}>
                      {STATUS_HELP[offer.status]}
                      {activity?.collectionRate != null
                        ? ` Collection rate: ${Math.round(activity.collectionRate * 100)}%.`
                        : ''}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 2, flexWrap: 'wrap' }}>
                      {(offer.status === 'draft' || offer.status === 'paused') && (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={setStatus.isPending}
                          onClick={() => setStatus.mutate({ id: offer.id, status: 'live' })}
                        >
                          Publish
                        </Button>
                      )}
                      {offer.status === 'live' && (
                        <Button
                          size="small"
                          disabled={setStatus.isPending}
                          onClick={() => setStatus.mutate({ id: offer.id, status: 'paused' })}
                        >
                          Pause
                        </Button>
                      )}
                      {offer.status !== 'ended' && (
                        <Button size="small" onClick={() => setEditing(offer)}>
                          Edit reward
                        </Button>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      <OfferDialog
        open={creating || editing !== null}
        offer={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={(message) => {
          refresh();
          notify(message);
          setCreating(false);
          setEditing(null);
        }}
        onError={(m) => notify(m, 'error')}
      />

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

function Stat(props: { label: string; value: number | string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {props.label}
      </Typography>
      <Typography sx={{ ...workspaceHeading, fontSize: 24, mt: 0.5, overflowWrap: 'anywhere' }}>
        {props.value}
      </Typography>
    </Box>
  );
}

/** Create and edit share a form; only the submit differs. */
function OfferDialog(props: {
  open: boolean;
  offer: RewardOfferDTO | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { offer } = props;
  const [form, setForm] = useState<CreateRewardOfferInput>(blankOffer());
  const [seeded, setSeeded] = useState<string | null>(null);

  // Seed once per dialog opening rather than on every render.
  const key = offer?.id ?? (props.open ? 'new' : null);
  if (key !== seeded) {
    setSeeded(key);
    setForm(offer ? fromOffer(offer) : blankOffer());
  }

  const save = useMutation({
    mutationFn: () => (offer ? api.updateRewardOffer(offer.id, form) : api.createRewardOffer(form)),
    onSuccess: () =>
      props.onSaved(
        offer ? 'Reward updated.' : 'Reward created as a draft — publish it when ready.',
      ),
    onError: (err: Error) => props.onError(err.message),
  });

  const set = <K extends keyof CreateRewardOfferInput>(k: K, v: CreateRewardOfferInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const ready =
    form.title.trim().length >= 2 && form.description.trim().length >= 2 && form.pointsCost > 0;

  return (
    <Dialog
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            bgcolor: 'background.default',
            '& .MuiDialogTitle-root': { ...workspaceHeading, fontSize: 24 },
            '& .MuiOutlinedInput-root': { borderRadius: '13px' },
            '& .MuiDialogActions-root': { p: 2.5 },
          },
        },
      }}
      open={props.open}
      onClose={props.onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{offer ? 'Edit reward' : 'New reward'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            size="small"
            label="Title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            size="small"
            label="What the member gets"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              select
              label="Category"
              value={form.category}
              onChange={(e) => set('category', e.target.value as RewardCategory)}
              sx={{ minWidth: 200, flex: '1 1 200px' }}
            >
              {REWARD_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {REWARD_CATEGORY_LABELS[c]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="number"
              label="Points cost"
              value={form.pointsCost}
              onChange={(e) => set('pointsCost', Number(e.target.value))}
              sx={{ minWidth: 160, flex: '1 1 160px' }}
            />
          </Stack>

          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              type="number"
              label="Stock"
              value={form.totalInventory ?? ''}
              onChange={(e) =>
                set('totalInventory', e.target.value === '' ? null : Number(e.target.value))
              }
              helperText="Leave blank for unlimited"
              sx={{ minWidth: 160, flex: '1 1 160px' }}
            />
            <TextField
              size="small"
              type="number"
              label="Limit per member"
              value={form.perUserLimit ?? ''}
              onChange={(e) =>
                set('perUserLimit', e.target.value === '' ? null : Number(e.target.value))
              }
              helperText="Leave blank for no limit"
              sx={{ minWidth: 160, flex: '1 1 160px' }}
            />
            <TextField
              size="small"
              type="number"
              label="Hours to collect"
              value={form.reservationHours ?? 72}
              onChange={(e) => set('reservationHours', Number(e.target.value))}
              helperText="Points return if not collected"
              sx={{ minWidth: 160, flex: '1 1 160px' }}
            />
          </Stack>

          <TextField
            size="small"
            select
            label="Minimum community level"
            value={form.minTrustLevel ?? ''}
            onChange={(e) =>
              set('minTrustLevel', (e.target.value || undefined) as TrustLevel | undefined)
            }
            helperText="Reserve a perk for members with a proven track record"
            fullWidth
          >
            <MenuItem value="">Open to everyone</MenuItem>
            {TRUST_LEVELS.map((l) => (
              <MenuItem key={l} value={l}>
                {TRUST_LEVEL_LABELS[l]} and above
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              type="datetime-local"
              label="Starts"
              value={form.startsAt ? form.startsAt.slice(0, 16) : ''}
              onChange={(e) =>
                set('startsAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)
              }
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 220, flex: '1 1 220px' }}
            />
            <TextField
              size="small"
              type="datetime-local"
              label="Ends"
              value={form.endsAt ? form.endsAt.slice(0, 16) : ''}
              onChange={(e) =>
                set('endsAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)
              }
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 220, flex: '1 1 220px' }}
            />
          </Stack>

          <TextField
            size="small"
            label="Image URL"
            value={form.imageUrl ?? ''}
            onChange={(e) => set('imageUrl', e.target.value || undefined)}
            fullWidth
          />

          {offer ? null : (
            <Alert severity="info">
              New rewards start as a draft, so you can set the stock and dates before members see
              them.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!ready || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? 'Saving…' : offer ? 'Save changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function blankOffer(): CreateRewardOfferInput {
  return {
    title: '',
    description: '',
    category: 'mobile_data',
    pointsCost: 50,
    reservationHours: 72,
  };
}

function fromOffer(o: RewardOfferDTO): CreateRewardOfferInput {
  return {
    title: o.title,
    description: o.description,
    category: o.category,
    pointsCost: o.pointsCost,
    imageUrl: o.imageUrl,
    totalInventory: o.totalInventory,
    startsAt: o.startsAt,
    endsAt: o.endsAt,
    perUserLimit: o.perUserLimit,
    minTrustLevel: o.minTrustLevel,
    reservationHours: o.reservationHours,
    termsUrl: o.termsUrl,
  };
}

export function RewardsCatalogPage() {
  return (
    <PartnerWorkspace>
      <RewardsCatalogContent />
    </PartnerWorkspace>
  );
}
