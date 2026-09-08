import { Alert, Box, Button, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import type { ReactNode } from 'react';
import { api } from '../lib/api.js';

const heading = { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-.025em' };
const STATUS_ORDER = [
  'open',
  'matched',
  'claimed',
  'returned',
  'closed',
  'archived',
  'auctioned',
  'donated',
];
const number = (value: number) => value.toLocaleString();

function EmptyActivity({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', py: 4, px: 1 }}>
      <Box sx={{ color: 'text.secondary', mb: 0.5, '& svg': { fontSize: 32 } }}>{icon}</Box>
      <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{title}</Typography>
      <Typography sx={{ fontSize: 12, lineHeight: 1.7, color: 'text.secondary', maxWidth: 280 }}>
        {description}
      </Typography>
    </Stack>
  );
}

export function PartnerAnalyticsPage() {
  const dark = useTheme().palette.mode === 'dark';
  const {
    data: stats,
    isPending,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({ queryKey: ['partner-stats'], queryFn: () => api.getPartnerStats() });
  const green = dark ? '#B0C9A5' : '#42633E';
  const amber = dark ? '#DCB88C' : '#926031';
  const raised = dark
    ? '7px 7px 18px rgba(0,0,0,.28), -5px -5px 15px rgba(105,128,91,.08)'
    : '7px 7px 18px #dcded5, -5px -5px 15px #ffffff';
  const inset = dark
    ? 'inset 3px 3px 8px rgba(0,0,0,.32), inset -3px -3px 8px rgba(105,128,91,.10)'
    : 'inset 3px 3px 8px #dcded5, inset -3px -3px 8px #ffffff';
  const panel = {
    bgcolor: 'background.default',
    boxShadow: raised,
    borderRadius: '24px',
    p: { xs: 2.5, lg: 3 },
    minWidth: 0,
  };
  const focus = { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 };
  const rate =
    stats && stats.totalItems > 0 ? (stats.returnedItems / stats.totalItems) * 100 : null;
  const statusEntries = stats
    ? [...new Set([...STATUS_ORDER, ...Object.keys(stats.itemsByStatus)])]
        .filter(
          (status) =>
            ['open', 'matched', 'claimed', 'returned'].includes(status) ||
            (stats.itemsByStatus[status] ?? 0) > 0,
        )
        .map((status) => [status, stats.itemsByStatus[status] ?? 0] as const)
    : [];
  const cards = [
    {
      label: 'Total items',
      value: stats?.totalItems,
      note: 'Reported at your institution',
      icon: Inventory2OutlinedIcon,
      color: green,
    },
    {
      label: 'Open items',
      value: stats?.openItems,
      note: 'Still awaiting a resolution',
      icon: SearchRoundedIcon,
      color: amber,
    },
    {
      label: 'Matched',
      value: stats?.matchedItems,
      note: 'Possible connections made',
      icon: HandshakeOutlinedIcon,
      color: green,
    },
    {
      label: 'Returned',
      value: stats?.returnedItems,
      note: 'Reunited with their owners',
      icon: CheckCircleOutlineRoundedIcon,
      color: green,
    },
  ];
  return (
    <Stack component="main" spacing={3.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 11,
              letterSpacing: '.14em',
              fontWeight: 700,
              mb: 1,
            }}
          >
            INSTITUTION ANALYTICS
          </Typography>
          <Typography
            component="h1"
            sx={{ ...heading, fontSize: { xs: 30, md: 38 }, lineHeight: 1.2 }}
          >
            See every return add up.
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
            Recovery, rewards and deliveries at your institution.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => refetch()}
          disabled={isFetching}
          startIcon={<RefreshRoundedIcon />}
          sx={{
            borderRadius: '14px',
            alignSelf: { xs: 'flex-start', sm: 'auto' },
            flexShrink: 0,
            px: 2.5,
            py: 1.25,
          }}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={0.5}
        sx={{ justifyContent: 'space-between' }}
      >
        <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
          All-time totals · Your institution
        </Typography>
        <Typography role="status" sx={{ color: 'text.secondary', fontSize: 12 }}>
          {isFetching
            ? 'Updating analytics…'
            : dataUpdatedAt
              ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Waiting for analytics'}
        </Typography>
      </Stack>
      {isError && (
        <Alert severity="error">
          Analytics could not be updated.{' '}
          {stats ? 'Showing the last available figures.' : 'Use Refresh to try again.'}
        </Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {cards.map(({ label, value, note, icon: Icon, color }) => (
          <Box key={label} sx={panel}>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                {label}
              </Typography>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '14px',
                  display: 'grid',
                  placeItems: 'center',
                  color,
                  boxShadow: inset,
                }}
              >
                <Icon sx={{ fontSize: 21 }} />
              </Box>
            </Stack>
            {isPending ? (
              <Skeleton height={48} width={80} />
            ) : (
              <Typography
                sx={{
                  ...heading,
                  fontSize: 42,
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value === undefined ? '—' : number(value)}
              </Typography>
            )}
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>{note}</Typography>
          </Box>
        ))}
      </Box>
      {isPending ? (
        <Box aria-label="Loading analytics" sx={panel}>
          <Skeleton width="40%" height={30} />
          <Skeleton variant="rounded" height={220} sx={{ mt: 2 }} />
        </Box>
      ) : stats ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(0, 1fr)' },
              gap: 2.5,
            }}
          >
            <Box sx={panel}>
              <Typography component="h2" sx={{ ...heading, fontSize: 21 }}>
                The recovery picture
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.75, mb: 3 }}>
                Where reported items stand right now.
              </Typography>
              {stats.totalItems === 0 ? (
                <EmptyActivity
                  icon={<Inventory2OutlinedIcon />}
                  title="Your first report starts the picture"
                  description="As items are reported and returned, their status breakdown will appear here."
                />
              ) : (
                <Stack spacing={2}>
                  {statusEntries.map(([status, count]) => (
                    <Box key={status}>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}
                      >
                        <Typography
                          sx={{
                            fontSize: 13,
                            textTransform: 'capitalize',
                            color: 'text.secondary',
                          }}
                        >
                          {status}
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {number(count)}{' '}
                          <Box
                            component="span"
                            sx={{ color: 'text.secondary', fontWeight: 400, ml: 1 }}
                          >
                            {Math.round((count / stats.totalItems) * 100)}%
                          </Box>
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 9, borderRadius: 9, boxShadow: inset }}>
                        <Box
                          sx={{
                            height: '100%',
                            borderRadius: 9,
                            width: `${Math.min(100, (count / stats.totalItems) * 100)}%`,
                            bgcolor: status === 'open' ? amber : green,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
            <Box sx={panel}>
              <Typography component="h2" sx={{ ...heading, fontSize: 21 }}>
                Return rate
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.75 }}>
                Returned items as a share of all reported items.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row', lg: 'column', xl: 'row' }}
                spacing={3}
                sx={{ alignItems: 'center', mt: 3 }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 152,
                    height: 152,
                    flexShrink: 0,
                    p: '12px',
                    borderRadius: '50%',
                    background:
                      rate === null
                        ? undefined
                        : `conic-gradient(${green} 0 ${rate}%, transparent ${rate}% 100%)`,
                    boxShadow: inset,
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      borderRadius: '50%',
                      bgcolor: 'background.default',
                      boxShadow: raised,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Typography sx={{ ...heading, fontSize: 34 }}>
                      {rate === null ? '—' : `${rate.toFixed(1)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left', lg: 'center', xl: 'left' } }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                    {rate === null
                      ? 'Ready for your first reunion'
                      : `${rate.toFixed(1)}% returned`}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, lineHeight: 1.7, color: 'text.secondary', mt: 1 }}
                  >
                    {rate === null
                      ? 'A return rate becomes available once your institution has reported items.'
                      : `${number(stats.returnedItems)} of ${number(stats.totalItems)} items have been marked as returned.`}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 2.5,
            }}
          >
            {[
              {
                title: 'Finder rewards',
                icon: RedeemOutlinedIcon,
                color: amber,
                metrics: [
                  { label: 'Redemptions', value: stats.totalRedemptions },
                  { label: 'Points redeemed', value: stats.totalPointsRedeemed },
                ],
                to: '/redeem',
                action: 'Manage redemptions',
              },
              {
                title: 'Courier activity',
                icon: TwoWheelerOutlinedIcon,
                color: green,
                metrics: [
                  { label: 'Total jobs', value: stats.totalCourierJobs },
                  { label: 'Active jobs', value: stats.activeCourierJobs },
                ],
                to: '/courier',
                action: 'View courier jobs',
              },
            ].map(({ title, icon: Icon, color, metrics, to, action }) => (
              <Box key={title} sx={panel}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '14px',
                      display: 'grid',
                      placeItems: 'center',
                      color,
                      boxShadow: inset,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography component="h2" sx={{ ...heading, fontSize: 20 }}>
                    {title}
                  </Typography>
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {metrics.map((metric) => (
                    <Box key={metric.label}>
                      <Typography sx={{ ...heading, fontSize: 30, overflowWrap: 'anywhere' }}>
                        {number(metric.value)}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>
                        {metric.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Button
                  component={Link}
                  to={to}
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{ mt: 2.5, fontSize: 12 }}
                >
                  {action}
                </Button>
              </Box>
            ))}
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
              gap: 2.5,
            }}
          >
            <Box sx={panel}>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}
              >
                <Typography component="h2" sx={{ ...heading, fontSize: 20 }}>
                  Recent reports
                </Typography>
                <Button component={Link} to="/items" size="small">
                  View items
                </Button>
              </Stack>
              {stats.recentItems.length === 0 ? (
                <EmptyActivity
                  icon={<Inventory2OutlinedIcon />}
                  title="No reports yet"
                  description="The latest items reported at your institution will appear here."
                />
              ) : (
                <Stack spacing={1.5}>
                  {stats.recentItems.map((item) => (
                    <Box
                      component={Link}
                      to={`/items/${item.id}`}
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '14px',
                        boxShadow: inset,
                        color: 'text.primary',
                        textDecoration: 'none',
                        '&:hover': { bgcolor: 'action.hover' },
                        '&:focus-visible': focus,
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 11, mt: 0.5 }}>
                          {new Date(item.createdAt).toLocaleDateString()} ·{' '}
                          <Box component="span" sx={{ textTransform: 'capitalize' }}>
                            {item.status}
                          </Box>
                        </Typography>
                      </Box>
                      <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: green }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
            <Box sx={panel}>
              <Typography component="h2" sx={{ ...heading, fontSize: 20, mb: 2 }}>
                Recent redemptions
              </Typography>
              {stats.recentRedemptions.length === 0 ? (
                <EmptyActivity
                  icon={<ReceiptLongOutlinedIcon />}
                  title="Rewards activity will appear here"
                  description="Track recent point exchanges and their progress as finders redeem rewards."
                />
              ) : (
                <Stack spacing={1.5}>
                  {stats.recentRedemptions.map((redemption) => (
                    <Box
                      key={redemption.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '14px',
                        boxShadow: inset,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}
                        >
                          {redemption.code}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: 'text.secondary',
                            mt: 0.5,
                            textTransform: 'capitalize',
                          }}
                        >
                          {redemption.status}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: amber }}>
                        {number(redemption.points)} pts
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </>
      ) : null}
    </Stack>
  );
}
