import { useState } from 'react';
import { Alert, Box, Button, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PartnerWorkspace,
  WorkspaceHeader,
  workspacePanel,
} from '../components/PartnerWorkspace.js';
import { api } from '../lib/api.js';

export function PartnerNotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const { data, isLoading, isError, refetch } = useQuery({
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
  const unread = notifications.filter((n) => !n.read).length;
  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  return (
    <PartnerWorkspace>
      <WorkspaceHeader
        icon={<NotificationsNoneOutlinedIcon />}
        title="Notifications"
        description="Your recovery activity, all in one place. Keep up with matches, deliveries and updates."
        actions={
          <Button
            variant="outlined"
            startIcon={<DoneAllRoundedIcon />}
            disabled={!unread || markAll.isPending || markOne.isPending}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? 'Updating…' : 'Mark all read'}
          </Button>
        }
      />
      <Box sx={{ ...workspacePanel, mt: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}
        >
          <Tabs
            value={filter}
            onChange={(_, value: string) => setFilter(value)}
            aria-label="Notification filter"
            sx={{
              minHeight: 44,
              p: 0.5,
              borderRadius: '14px',
              boxShadow: 'var(--workspace-inset)',
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': { minHeight: 40, borderRadius: '10px', textTransform: 'none' },
              '& .Mui-selected': {
                bgcolor: 'background.default',
                color: 'text.primary',
                boxShadow: 'var(--workspace-raised)',
              },
            }}
          >
            <Tab value="all" label="All activity" />
            <Tab value="unread" label={`Unread${!isLoading && !isError ? ` (${unread})` : ''}`} />
          </Tabs>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            Your latest 50 notifications
          </Typography>
        </Stack>
        {(markAll.isError || markOne.isError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Could not update notifications. Please try again.
          </Alert>
        )}
        {isLoading ? (
          <ListSkeleton rows={5} avatar />
        ) : isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          >
            Could not load notifications.
          </Alert>
        ) : visible.length === 0 ? (
          <EmptyState
            tone="teal"
            icon={<NotificationsNoneOutlinedIcon />}
            title={filter === 'unread' ? "You're all caught up" : 'A little quiet here'}
            description={
              filter === 'unread'
                ? 'You have read all your recent updates.'
                : 'New matches, courier updates and bids will appear here.'
            }
          />
        ) : (
          <Stack spacing={1.5}>
            {visible.map((n) => (
              <Stack
                key={n.id}
                direction="row"
                spacing={{ xs: 1.5, sm: 2 }}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: '18px',
                  boxShadow: 'var(--workspace-inset)',
                  borderLeft: '3px solid',
                  borderColor: n.read ? 'transparent' : 'var(--workspace-green)',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    bgcolor: 'action.selected',
                    color: 'var(--workspace-green)',
                  }}
                >
                  <NotificationsNoneOutlinedIcon sx={{ fontSize: 21 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: 'wrap', alignItems: 'center' }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: 15, overflowWrap: 'anywhere' }}>
                      {n.title}
                    </Typography>
                    {!n.read && (
                      <Chip size="small" label="New" color="success" variant="outlined" />
                    )}
                  </Stack>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: 13,
                      mt: 0.5,
                      lineHeight: 1.7,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {n.body}
                  </Typography>
                  <Stack
                    direction="row"
                    useFlexGap
                    spacing={1.5}
                    sx={{
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 1,
                    }}
                  >
                    <Typography
                      component="time"
                      dateTime={n.createdAt}
                      sx={{ color: 'text.secondary', fontSize: 11 }}
                    >
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Typography>
                    {!n.read && (
                      <Button
                        size="small"
                        disabled={markOne.isPending || markAll.isPending}
                        onClick={() => markOne.mutate(n.id)}
                        aria-label={`Mark ${n.title} as read`}
                      >
                        Mark as read
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </PartnerWorkspace>
  );
}
