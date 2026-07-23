import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper';

import { api } from '../src/lib/api';

function fmt(amount: number, currency: string) {
  const val = amount / 100;
  const sym = currency === 'GHS' ? '₵' : currency + ' ';
  return `${sym}${val.toLocaleString()}`;
}

export default function ShopScreen() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ['tag-products'],
    queryFn: () => api.listTagProducts(),
  });
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['my-tag-orders'],
    queryFn: () => api.listMyTagOrders(),
  });

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const createOrder = useMutation({
    mutationFn: (items: { productId: string; quantity: number }[]) =>
      api.createTagOrder(items),
    onSuccess: (order) => payOrder.mutate(order.id),
  });

  const payOrder = useMutation({
    mutationFn: (id: string) => api.payTagOrder(id),
    onSuccess: (data) => {
      if ('tags' in data) {
        setPaySuccess(
          `Payment successful! ${data.tags.length} tag${data.tags.length > 1 ? 's' : ''} minted.`
        );
        setQuantities({});
        qc.invalidateQueries({ queryKey: ['my-tag-orders'] });
        qc.invalidateQueries({ queryKey: ['tags'] });
      } else {
        setPaySuccess('Complete the payment in your browser to mint your tags.');
      }
    },
  });

  const cartItems = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const cartTotal = cartItems.reduce((sum, { productId, quantity }) => {
    const p = products?.find((x) => x.id === productId);
    return sum + (p ? p.price * quantity : 0);
  }, 0);

  const anyLoading = createOrder.isPending || payOrder.isPending;
  const err = createOrder.error ?? payOrder.error;

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Text variant="headlineSmall">QR Tag Shop</Text>

      {paySuccess && (
        <Card style={{ backgroundColor: '#ECFDF5' }}>
          <Card.Content>
            <Text style={{ color: '#065F46' }}>{paySuccess}</Text>
          </Card.Content>
        </Card>
      )}

      {err && (
        <Card style={{ backgroundColor: '#FEF2F2' }}>
          <Card.Content>
            <Text style={{ color: '#991B1B' }}>
              {err instanceof Error ? err.message : 'Something went wrong'}
            </Text>
          </Card.Content>
        </Card>
      )}

      <Text variant="titleMedium">Products</Text>
      <FlatList
        data={products ?? []}
        keyExtractor={(p) => p.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item: p }) => {
          const q = quantities[p.id] ?? 0;
          return (
            <Card>
              <Card.Title
                title={p.name}
                subtitle={p.description}
                right={() => (
                  <Text variant="titleMedium" style={{ marginRight: 12 }}>
                    {fmt(p.price, p.currency)}
                  </Text>
                )}
              />
              <Card.Actions>
                <IconButton
                  icon="minus"
                  size={20}
                  onPress={() => setQuantities({ ...quantities, [p.id]: Math.max(0, q - 1) })}
                  disabled={q === 0}
                />
                <Text>{q}</Text>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => setQuantities({ ...quantities, [p.id]: q + 1 })}
                />
              </Card.Actions>
            </Card>
          );
        }}
      />

      {cartItems.length > 0 && (
        <>
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleMedium">Total</Text>
            <Text variant="headlineSmall">{fmt(cartTotal, 'GHS')}</Text>
          </View>
          <Button
            mode="contained"
            onPress={() => createOrder.mutate(cartItems)}
            loading={anyLoading}
            disabled={anyLoading}
          >
            Pay now
          </Button>
        </>
      )}

      <Divider />
      <Text variant="titleMedium">Order history</Text>
      {(orders ?? []).length === 0 ? (
        <Text>No orders yet.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item: o }) => (
            <Card>
              <Card.Title
                title={o.products.map((p) => p.name).join(', ')}
                subtitle={`${fmt(o.total, o.currency)} · ${o.status}`}
              />
            </Card>
          )}
        />
      )}
    </ScrollView>
  );
}
