import { Box, Button, Stack, Typography } from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { EmptyState, PageHeader, ListSkeleton } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDTO } from '@back2u/shared-types';

import { api } from '../lib/api.js';

export function PartnerNotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.listNotifications(50),
  });

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ mb: 2.5 }}>
        <PageHeader
          icon={<NotificationsNoneOutlinedIcon />}
          title="Notifications"
          description="Match alerts, courier updates, and bids for your institution, as they happen."
          actions={
            hasUnread ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                sx={{ borderRadius: 999, fontWeight: 600 }}
              >
                Mark all read
              </Button>
            ) : undefined
          }
        />
      </Box>

      {isLoading ? (
        <ListSkeleton rows={5} avatar={false} />
      ) : notifications.length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<NotificationsNoneOutlinedIcon />}
          title="You're all caught up"
          description="Match alerts, courier updates, and bids will show up here as they happen."
        />
      ) : (
        <Stack spacing={1.25}>
          {notifications.map((n: NotificationDTO) => (
            <Box
              key={n.id}
              onClick={() => !n.read && markOne.mutate(n.id)}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: n.read ? 'divider' : 'rgba(168,181,160,0.35)',
                bgcolor: n.read ? 'background.paper' : 'rgba(168,181,160,0.08)',
                cursor: n.read ? 'default' : 'pointer',
                transition: 'background-color .15s',
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: n.read ? 500 : 700 }} noWrap>
                    {n.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>{n.body}</Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: 'text.secondary',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {new Date(n.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
