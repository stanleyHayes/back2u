import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';
import {
  ChatBubbleOutlined,
  LocalShippingOutlined,
  LocalOfferOutlined,
  NotificationsNoneOutlined,
  QrCodeOutlined,
  SettingsSuggestOutlined,
  ShoppingBagOutlined,
} from '@mui/icons-material';
import type { NotificationDTO } from '@back2u/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';

const typeConfig: Record<
  NotificationDTO['type'],
  { icon: React.ReactNode; color: string; label: string } | undefined
> = {
  match: { icon: <LocalOfferOutlined />, color: '#0F766E', label: 'Match' },
  message: { icon: <ChatBubbleOutlined />, color: '#2563EB', label: 'Message' },
  courier: { icon: <LocalShippingOutlined />, color: '#D97706', label: 'Courier' },
  marketplace: { icon: <ShoppingBagOutlined />, color: '#7C3AED', label: 'Marketplace' },
  tag: { icon: <QrCodeOutlined />, color: '#059669', label: 'Tag' },
  system: { icon: <SettingsSuggestOutlined />, color: '#6B7280', label: 'System' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationRow({
  n,
  onClick,
}: {
  n: NotificationDTO;
  onClick: (n: NotificationDTO) => void;
}) {
  const cfg = typeConfig[n.type];
  const icon = cfg?.icon ?? <NotificationsNoneOutlined />;
  const color = cfg?.color ?? '#6B7280';
  return (
    <ListItem
      component="div"
      onClick={() => onClick(n)}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        mb: 0.5,
        bgcolor: n.read ? 'transparent' : 'rgba(15,118,110,0.06)',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: `${color}22`, color: color }}>{icon}</Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: n.read ? 400 : 700 }}>
              {n.title}
            </Typography>
            {!n.read && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#0F766E',
                }}
              />
            )}
          </Stack>
        }
        secondary={
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {n.body}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {timeAgo(n.createdAt)}
            </Typography>
          </Stack>
        }
      />
    </ListItem>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.listNotifications(50),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const handleClick = (n: NotificationDTO) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.data && typeof n.data === 'object') {
      const d = n.data as Record<string, unknown>;
      if (d.matchId && typeof d.matchId === 'string') navigate('/matches');
      else if (d.jobId && typeof d.jobId === 'string') navigate(`/courier/${d.jobId}`);
      else if (d.listingId && typeof d.listingId === 'string') navigate('/marketplace');
      else if (d.itemId && typeof d.itemId === 'string') navigate(`/items/${d.itemId}`);
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Notifications
        </Typography>
        <ListSkeleton rows={6} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{(error as Error)?.message ?? 'Failed to load notifications'}</Alert>
    );
  }

  const notifications = data ?? [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Notifications
        </Typography>
        {notifications.some((n) => !n.read) && (
          <Button variant="outlined" size="small" onClick={() => markAllRead.mutate()}>
            Mark all as read
          </Button>
        )}
      </Stack>

      {notifications.length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<NotificationsNoneOutlined />}
          title="You're all caught up"
          description="Matches, messages, and reward updates will show up here as they happen."
        />
      ) : (
        <List disablePadding>
          {notifications.map((n: NotificationDTO) => (
            <NotificationRow key={n.id} n={n} onClick={handleClick} />
          ))}
        </List>
      )}
    </Stack>
  );
}
