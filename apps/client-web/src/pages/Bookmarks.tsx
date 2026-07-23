import { Box, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { EmptyState, CardGridSkeleton } from '@back2u/ui-web';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import { api } from '../lib/api.js';
import { ItemCard } from '../components/ItemCard.js';

export function BookmarksPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.listBookmarks(),
  });

  const toggleBookmark = useMutation({
    mutationFn: (itemId: string) => api.unbookmarkItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const items = bookmarks?.map((b) => b.item).filter(Boolean) ?? [];

  return (
    <Stack spacing={3}>
      <Typography variant="h3" fontWeight={700}>
        Bookmarks
      </Typography>

      {isLoading ? (
        <CardGridSkeleton count={3} minWidth={280} />
      ) : items.length === 0 ? (
        <EmptyState
          tone="marigold"
          icon={<BookmarkBorderIcon />}
          title="No bookmarks yet"
          description="Tap the bookmark on any item to keep an eye on it — they'll all gather here."
          actions={[{ label: 'Browse the feed', onClick: () => navigate('/') }]}
        />
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
          gap={2}
        >
          {items.map((item) =>
            item ? (
              <ItemCard
                key={item.id}
                item={item}
                isBookmarked
                onToggleBookmark={() => toggleBookmark.mutate(item.id)}
              />
            ) : null,
          )}
        </Box>
      )}
    </Stack>
  );
}
