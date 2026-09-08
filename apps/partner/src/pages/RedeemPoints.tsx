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
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

function RedeemPointsContent() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const institutionId = user?.institutionId;

  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: { code: string; points: number; value: number; currency: string; status: string };
  } | null>(null);

  const {
    data: redemptions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['institution-redemptions', institutionId],
    queryFn: () =>
      institutionId ? api.listInstitutionRedemptions(institutionId) : Promise.resolve([]),
    enabled: !!institutionId,
  });

  const handleConfirm = async () => {
    if (!code.trim()) return;
    setConfirming(true);
    setResult(null);
    try {
      const data = await api.confirmRedemption(code.trim());
      setResult({
        success: true,
        message: `Confirmed ${data.code} — ${data.points} points for ${data.currency} ${(data.value / 100).toFixed(2)}`,
        data: {
          code: data.code,
          points: data.points,
          value: data.value,
          currency: data.currency,
          status: data.status,
        },
      });
      setCode('');
      void qc.invalidateQueries({ queryKey: ['institution-redemptions', institutionId] });
    } catch (e: unknown) {
      setResult({
        success: false,
        message: e instanceof Error ? e.message : 'Failed to confirm code',
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<ConfirmationNumberOutlinedIcon />}
        title="Redeem points"
        description="Enter a customer's voucher code to confirm their point exchange at your institution."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.25fr 1fr' }, gap: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 23 }}>
                Confirm a voucher
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.7 }}>
                Ask the customer for the code shown in their app. Confirmation completes their point
                exchange.
              </Typography>
              <TextField
                label="Voucher code"
                placeholder="e.g. RDM-ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                fullWidth
                disabled={confirming}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirm}
                disabled={confirming || !code.trim() || !institutionId}
                startIcon={confirming ? <CircularProgress size={16} /> : null}
              >
                {confirming ? 'Confirming…' : 'Confirm voucher'}
              </Button>
              {result && (
                <Alert severity={result.success ? 'success' : 'error'}>{result.message}</Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
        <Box sx={{ ...workspacePanel, boxShadow: 'var(--workspace-inset)' }}>
          <ConfirmationNumberOutlinedIcon
            sx={{ fontSize: 38, color: 'var(--workspace-amber)', mb: 2 }}
          />
          <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 22 }}>
            A reward worth returning for.
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.8, mt: 1.5 }}>
            Finder points become real benefits at your counter. Check the voucher with the customer
            before confirming, then provide the agreed reward.
          </Typography>
          <Box sx={{ mt: 3, p: 2, borderRadius: '15px', boxShadow: 'var(--workspace-raised)' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
              Your exchange history stays below
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
              Review codes, points, value and status after confirmation.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 23 }}>
        Recent exchanges
      </Typography>

      {isLoading && <ListSkeleton rows={3} avatar={false} />}

      {error && <Alert severity="error">Failed to load exchange history.</Alert>}

      {!institutionId && (
        <Alert severity="warning">Your account is not linked to an institution.</Alert>
      )}

      {redemptions && redemptions.length === 0 && (
        <EmptyState
          dense
          tone="marigold"
          icon={<ConfirmationNumberOutlinedIcon />}
          title="No exchanges yet"
          description="Confirmed point redemptions will show up here."
        />
      )}

      {redemptions && redemptions.length > 0 && (
        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}
        >
          {redemptions.map((r) => (
            <Card key={r.id} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      {r.code}
                    </Typography>
                    <Chip
                      label={r.status}
                      color={
                        r.status === 'fulfilled'
                          ? 'success'
                          : r.status === 'pending'
                            ? 'warning'
                            : 'default'
                      }
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {r.points} points → {r.currency} {(r.value / 100).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}

export function RedeemPointsPage() {
  return (
    <PartnerWorkspace>
      <RedeemPointsContent />
    </PartnerWorkspace>
  );
}
