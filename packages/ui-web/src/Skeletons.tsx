import { Box, Skeleton, Stack } from '@mui/material';

/**
 * Branded skeleton placeholders. These replace bare "Loading…" text and
 * spinners across the apps with layout-shaped shimmer that matches the real
 * content, so the page doesn't jump when data arrives. All are theme-aware
 * (MUI Skeleton reads the palette) and use the brand "tag" corner radius.
 */

const TAG = '16px 16px 16px 4px';

export function Shimmer(props: React.ComponentProps<typeof Skeleton>) {
  return <Skeleton animation="wave" {...props} />;
}

/** A single feed/marketplace card placeholder matching ItemCard's silhouette. */
export function ItemCardSkeleton() {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: '24px 24px 24px 6px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Skeleton
        variant="rounded"
        animation="wave"
        height={180}
        sx={{ borderRadius: '18px 18px 18px 4px' }}
      />
      <Box sx={{ px: 0.75, pt: 1.5 }}>
        <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
          <Skeleton variant="rounded" width={64} height={22} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" width={48} height={22} sx={{ borderRadius: 999 }} />
        </Stack>
        <Skeleton variant="text" width="72%" height={26} />
        <Skeleton variant="text" width="44%" height={20} />
      </Box>
      <Stack direction="row" spacing={1} sx={{ px: 0.5, pt: 1.5 }}>
        <Skeleton variant="rounded" width={120} height={32} sx={{ borderRadius: 999 }} />
        <Skeleton variant="rounded" width={70} height={32} sx={{ borderRadius: 999 }} />
      </Stack>
    </Box>
  );
}

/** A responsive grid of card skeletons. */
export function CardGridSkeleton({
  count = 6,
  minWidth = 280,
}: {
  count?: number;
  minWidth?: number;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        gap: { xs: 2, md: 3 },
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </Box>
  );
}

/** Stacked list rows with an avatar + two text lines (threads, notifications, leaderboard). */
export function ListSkeleton({ rows = 5, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <Stack spacing={1.25}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: TAG,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {avatar && (
            <Skeleton
              variant="circular"
              animation="wave"
              width={44}
              height={44}
              sx={{ flexShrink: 0 }}
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={`${50 + ((i * 7) % 30)}%`} height={22} />
            <Skeleton variant="text" width={`${30 + ((i * 11) % 25)}%`} height={18} />
          </Box>
          <Skeleton variant="rounded" width={60} height={26} sx={{ borderRadius: 999 }} />
        </Box>
      ))}
    </Stack>
  );
}

/** Row of summary/stat cards (admin overview, partner analytics). */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
        gap: 2,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Skeleton variant="text" width="55%" height={18} />
          <Skeleton variant="text" width="40%" height={40} />
        </Box>
      ))}
    </Box>
  );
}

/** A table-ish block of rows (admin queues). */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Skeleton
            variant="rounded"
            animation="wave"
            width={48}
            height={48}
            sx={{ borderRadius: 2, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="65%" height={16} />
          </Box>
          <Skeleton variant="rounded" width={84} height={32} sx={{ borderRadius: 999 }} />
        </Box>
      ))}
    </Stack>
  );
}

/** Item detail: a big media block beside a column of text lines. */
export function DetailSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
        gap: { xs: 3, md: 5 },
      }}
    >
      <Skeleton
        variant="rounded"
        animation="wave"
        height={360}
        sx={{ borderRadius: '24px 24px 24px 8px' }}
      />
      <Box>
        <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: 999, mb: 1.5 }} />
        <Skeleton variant="text" width="80%" height={46} />
        <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="95%" height={20} />
        <Skeleton variant="text" width="70%" height={20} />
        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          <Skeleton variant="rounded" width={150} height={44} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" width={120} height={44} sx={{ borderRadius: 999 }} />
        </Stack>
      </Box>
    </Box>
  );
}

/** Chat thread: alternating message bubbles. */
export function ChatSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Stack spacing={1.5} sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, i) => {
        const mine = i % 2 === 1;
        return (
          <Box key={i} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
            <Skeleton
              variant="rounded"
              animation="wave"
              width={`${40 + ((i * 13) % 35)}%`}
              height={44}
              sx={{ borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px' }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}
