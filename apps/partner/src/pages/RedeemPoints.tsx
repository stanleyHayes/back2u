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
import { useQuery } from '@tanstack/react-query';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

export function RedeemPointsPage() {
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
      <Typography variant="h3" sx={{ fontWeight: 700 }}>
        Redeem Points
      </Typography>
      <Typography color="text.secondary">
        Enter a customer&apos;s voucher code to confirm their point exchange at your institution.
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
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
              disabled={confirming || !code.trim()}
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

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
