import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CardGridSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const DISPLAY = '"Fraunces", Georgia, serif';
const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';

function majorCurrency(amount: number, currency: string) {
  const val = amount / 100;
  const symbol = currency === 'GHS' ? '₵' : currency + ' ';
  return `${symbol}${val.toLocaleString()}`;
}

export function QrTagShopPage() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ['tag-products'],
    queryFn: () => api.listTagProducts(),
  });
  const { data: orders } = useQuery({
    queryKey: ['my-tag-orders'],
    queryFn: () => api.listMyTagOrders(),
  });

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const createOrder = useMutation({
    mutationFn: (items: { productId: string; quantity: number }[]) => api.createTagOrder(items),
    onSuccess: (order) => {
      payOrder.mutate(order.id);
    },
    onError: () => {},
  });

  const payOrder = useMutation({
    mutationFn: (id: string) => api.payTagOrder(id),
    onSuccess: (data) => {
      // Paystack returns a redirect URL; the mock/instant path returns minted tags.
      if ('authorizationUrl' in data) {
        window.location.assign(data.authorizationUrl);
        return;
      }
      setPaySuccess(`Payment successful! ${data.tags.length} tag${data.tags.length > 1 ? 's' : ''} minted.`);
      setQuantities({});
      qc.invalidateQueries({ queryKey: ['my-tag-orders'] });
      qc.invalidateQueries({ queryKey: ['my-tags'] });
    },
    onError: () => {},
  });

  const cartItems = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const cartTotal =
    cartItems.reduce((sum, { productId, quantity }) => {
      const p = products?.find((x) => x.id === productId);
      return sum + (p ? p.price * quantity : 0);
    }, 0) / 100;

  const anyLoading = createOrder.isPending || payOrder.isPending;
  const err = createOrder.error ?? payOrder.error;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ color: TEAL, mb: 1 }}>
        <ShoppingBagOutlinedIcon fontSize="small" />
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Tag shop
        </Typography>
      </Stack>
      <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: { xs: 34, md: 44 }, color: INK, letterSpacing: '-0.02em' }}>
        Buy QR tags
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Purchase physical QR tag packs to protect your belongings.
      </Typography>

      {paySuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setPaySuccess(null)}>
          {paySuccess}
        </Alert>
      )}
      {err && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {err instanceof Error ? err.message : 'Something went wrong'}
        </Alert>
      )}

      {isLoading && <CardGridSkeleton count={6} minWidth={240} />}

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }} gap={2.5}>
        {products?.map((p) => {
          const qty = quantities[p.id] ?? 0;
          return (
            <Card
              key={p.id}
              variant="outlined"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px 24px 24px 8px',
                transition: 'transform .18s, box-shadow .18s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 26px 46px -30px rgba(11,61,56,.5)' },
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: INK }}>{p.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                  {p.description}
                </Typography>
                <Chip size="small" label={`${p.quantity} tags`} sx={{ bgcolor: 'rgba(15,118,110,0.1)', color: TEAL, width: 'fit-content' }} />
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: INK }}>
                    {majorCurrency(p.price, p.currency)}
                  </Typography>
                </Box>
                <Box flex={1} />
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => setQuantities((q) => ({ ...q, [p.id]: Math.max(0, (q[p.id] ?? 0) - 1) }))}
                    disabled={qty === 0 || anyLoading}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    size="small"
                    value={qty}
                    inputProps={{ readOnly: true, style: { textAlign: 'center' } }}
                    sx={{ width: 56 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setQuantities((q) => ({ ...q, [p.id]: (q[p.id] ?? 0) + 1 }))}
                    disabled={anyLoading}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {cartItems.length > 0 && (
        <Card variant="outlined" sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Checkout
            </Typography>
            <Stack spacing={1.5}>
              {cartItems.map(({ productId, quantity }) => {
                const p = products?.find((x) => x.id === productId);
                if (!p) return null;
                return (
                  <Stack key={productId} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>
                      {p.name} × {quantity}
                    </Typography>
                    <Typography fontWeight={700}>{majorCurrency(p.price * quantity, p.currency)}</Typography>
                  </Stack>
                );
              })}
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>Total</Typography>
              <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: INK }}>
                ₵{cartTotal.toLocaleString()}
              </Typography>
            </Stack>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2, bgcolor: MARIGOLD, color: INK, borderRadius: 999, fontWeight: 700, '&:hover': { bgcolor: '#cf9305' } }}
              disabled={anyLoading}
              onClick={() => createOrder.mutate(cartItems)}
            >
              {anyLoading ? 'Processing…' : 'Pay now'}
            </Button>
          </CardContent>
        </Card>
      )}

      {orders && orders.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Order history
          </Typography>
          <Stack spacing={1.5}>
            {orders.map((o) => (
              <Card key={o.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </Typography>
                    <Chip
                      size="small"
                      label={o.status}
                      color={o.status === 'fulfilled' ? 'success' : o.status === 'paid' ? 'warning' : 'default'}
                    />
                  </Stack>
                  {o.products.map((p) => (
                    <Typography key={p.productId} variant="body2">
                      {p.name} × {p.quantity}
                    </Typography>
                  ))}
                  <Typography fontWeight={700} sx={{ mt: 1 }}>
                    Total: {majorCurrency(o.total, o.currency)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
