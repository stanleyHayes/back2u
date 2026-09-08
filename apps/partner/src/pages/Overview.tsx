import { Alert, Box, Button, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import { api } from '../lib/api.js';

const STATUSES = ['open', 'matched', 'claimed', 'returned', 'closed', 'archived'];
const heading = { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-.025em' };

export function Overview() {
  const dark = useTheme().palette.mode === 'dark';
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['partner-items'],
    queryFn: () => api.listItems({ pageSize: 100 }),
  });
  const items = data?.items ?? [];
  const green = dark ? '#B0C9A5' : '#42633E';
  const amber = dark ? '#DCB88C' : '#926031';
  const shadow = dark
    ? '7px 7px 18px rgba(0,0,0,.28), -5px -5px 15px rgba(105,128,91,.08)'
    : '7px 7px 18px #dcded5, -5px -5px 15px #ffffff';
  const inset = dark
    ? 'inset 3px 3px 8px rgba(0,0,0,.32), inset -3px -3px 8px rgba(105,128,91,.10)'
    : 'inset 3px 3px 8px #dcded5, inset -3px -3px 8px #ffffff';
  const panel = {
    bgcolor: 'background.default',
    borderRadius: '24px',
    p: { xs: 2.5, lg: 3 },
    boxShadow: shadow,
    minWidth: 0,
  };
  const focus = { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 };
  const count = (status: string) => items.filter((item) => item.status === status).length;
  const found = items.filter((item) => item.kind === 'found').length;
  const lost = items.length - found;
  const categories = Object.entries(
    items.reduce<Record<string, number>>((counts, item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const recent = [...items]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 4);
  const stats = [
    {
      label: 'Total reports',
      value: data?.total ?? 0,
      note: 'Across available reports',
      icon: Inventory2OutlinedIcon,
      color: green,
    },
    {
      label: 'Open reports',
      value: count('open'),
      note: 'Still looking for a resolution',
      icon: SearchRoundedIcon,
      color: amber,
    },
    {
      label: 'Matched',
      value: count('matched'),
      note: 'A possible connection made',
      icon: HandshakeOutlinedIcon,
      color: green,
    },
    {
      label: 'Returned',
      value: count('returned'),
      note: 'Back with their owners',
      icon: CheckCircleOutlineRoundedIcon,
      color: green,
    },
  ];
  return (
    <Stack component="main" spacing={3.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.14em',
              color: 'text.secondary',
              mb: 1,
            }}
          >
            YOUR RECOVERY DESK
          </Typography>
          <Typography
            component="h1"
            sx={{ ...heading, fontSize: { xs: 30, md: 38 }, lineHeight: 1.2 }}
          >
            Every return starts here.
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
            A clear view of your reports, matches and reunions.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/items"
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            flexShrink: 0,
            alignSelf: { xs: 'flex-start', sm: 'auto' },
            borderRadius: '14px',
            px: 2.5,
            py: 1.25,
          }}
        >
          Manage items
        </Button>
      </Stack>

      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" disabled={isFetching} onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Reports could not be loaded.{' '}
          {data ? 'Showing the last available snapshot.' : 'Try again to see your overview.'}
        </Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {stats.map(({ label, value, note, icon: Icon, color }) => (
          <Box key={label} sx={panel}>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}
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
                  boxShadow: inset,
                  color,
                }}
              >
                <Icon sx={{ fontSize: 21 }} />
              </Box>
            </Stack>
            {isPending ? (
              <Skeleton width={80} height={52} />
            ) : (
              <Typography
                sx={{
                  ...heading,
                  fontSize: 42,
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {data ? value.toLocaleString() : '—'}
              </Typography>
            )}
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>{note}</Typography>
          </Box>
        ))}
      </Box>

      {isPending ? (
        <Box aria-label="Loading report breakdowns" sx={{ ...panel, minHeight: 310 }}>
          <Skeleton width="40%" height={32} />
          <Skeleton variant="rounded" height={200} sx={{ mt: 3 }} />
        </Box>
      ) : data && items.length === 0 ? (
        <Box sx={{ ...panel, textAlign: 'center', py: 5 }}>
          <Inventory2OutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography component="h2" sx={{ ...heading, fontSize: 24 }}>
            A fresh start for your recovery desk
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1 }}>
            Your report breakdowns and recent items will appear here when reports are available.
          </Typography>
        </Box>
      ) : data ? (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            <Typography component="h2" sx={{ ...heading, fontSize: 22 }}>
              Your report snapshot
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Breakdowns based on {items.length} loaded reports
              {data.total > items.length ? ` of ${data.total.toLocaleString()}` : ''}
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr 1fr' },
              gap: 2.5,
            }}
          >
            <Box sx={panel}>
              <Typography component="h3" sx={{ ...heading, fontSize: 18 }}>
                Lost &amp; found
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>
                Two sides of the same reunion.
              </Typography>
              <Stack
                direction="row"
                spacing={2.5}
                sx={{ alignItems: 'center', mt: 3.5, flexWrap: 'wrap', rowGap: 2 }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 132,
                    height: 132,
                    flexShrink: 0,
                    borderRadius: '50%',
                    p: '13px',
                    background: `conic-gradient(${green} 0 ${(found / items.length) * 100}%, ${amber} 0 100%)`,
                    boxShadow: shadow,
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      borderRadius: '50%',
                      bgcolor: 'background.default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: inset,
                    }}
                  >
                    <Typography sx={{ ...heading, fontSize: 30 }}>{items.length}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>reports</Typography>
                  </Box>
                </Box>
                <Stack spacing={2} sx={{ flex: 1, minWidth: 90 }}>
                  {[
                    { label: 'Found', value: found, color: green },
                    { label: 'Lost', value: lost, color: amber },
                  ].map((slice) => (
                    <Box key={slice.label}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <Box
                          sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: slice.color }}
                        />
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {slice.label}
                        </Typography>
                      </Stack>
                      <Typography sx={{ ...heading, fontSize: 24, mt: 0.25 }}>
                        {slice.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Box>
            <Box sx={panel}>
              <Typography component="h3" sx={{ ...heading, fontSize: 18, mb: 2.5 }}>
                Recovery progress
              </Typography>
              <Stack spacing={1.5}>
                {STATUSES.map((status) => (
                  <Box key={status}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.6 }}>
                      <Typography
                        sx={{ textTransform: 'capitalize', fontSize: 12, color: 'text.secondary' }}
                      >
                        {status}
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                        {count(status)}
                      </Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 9, boxShadow: inset }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${(count(status) / items.length) * 100}%`,
                          borderRadius: 9,
                          bgcolor: status === 'open' ? amber : green,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
            <Box sx={panel}>
              <Typography component="h3" sx={{ ...heading, fontSize: 18, mb: 2.5 }}>
                Most reported
              </Typography>
              <Stack spacing={2}>
                {categories.map(([category, value]) => (
                  <Box key={category}>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', mb: 0.75, gap: 1 }}
                    >
                      <Typography
                        sx={{ fontSize: 12, textTransform: 'capitalize', color: 'text.secondary' }}
                      >
                        {category}
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{value}</Typography>
                    </Stack>
                    <Box sx={{ height: 6, boxShadow: inset, borderRadius: 9 }}>
                      <Box
                        sx={{
                          height: '100%',
                          borderRadius: 9,
                          bgcolor: green,
                          width: `${(value / (categories[0]?.[1] || 1)) * 100}%`,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
          <Box sx={panel}>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}
            >
              <Typography component="h2" sx={{ ...heading, fontSize: 20 }}>
                Recent reports
              </Typography>
              <Button
                component={Link}
                to="/items"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ fontSize: 12 }}
              >
                View all
              </Button>
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 1.5,
              }}
            >
              {recent.map((item) => (
                <Box
                  component={Link}
                  to={`/items/${item.id}`}
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: '16px',
                    textDecoration: 'none',
                    color: 'text.primary',
                    boxShadow: inset,
                    minWidth: 0,
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:focus-visible': focus,
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'text.secondary',
                      bgcolor: 'action.hover',
                    }}
                  >
                    {item.images[0] ? (
                      <Box
                        component="img"
                        src={item.images[0].url}
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Inventory2OutlinedIcon />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
                      {item.place.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: item.kind === 'lost' ? amber : green,
                        mt: 0.5,
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.kind} · {item.status}
                    </Typography>
                  </Box>
                  <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Box>
              ))}
            </Box>
          </Box>
        </>
      ) : null}
      <Box>
        <Typography component="h2" sx={{ ...heading, fontSize: 20, mb: 2 }}>
          Keep things moving
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {[
            {
              to: '/recovery-point',
              title: 'Recovery point',
              description: 'Manage your counter and item handovers.',
              icon: StorefrontOutlinedIcon,
            },
            {
              to: '/tags/mint',
              title: 'Create QR tags',
              description: 'Give belongings a way back to their owner.',
              icon: QrCode2RoundedIcon,
            },
            {
              to: '/redeem',
              title: 'Redeem points',
              description: 'Help finders use the points they have earned.',
              icon: RedeemOutlinedIcon,
            },
          ].map(({ to, title, description, icon: Icon }) => (
            <Box
              key={to}
              component={Link}
              to={to}
              sx={{
                ...panel,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' },
                '&:focus-visible': focus,
              }}
            >
              <Icon sx={{ color: green, fontSize: 24, mt: 0.25 }} />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
                <Typography
                  sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6, mt: 0.5 }}
                >
                  {description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
