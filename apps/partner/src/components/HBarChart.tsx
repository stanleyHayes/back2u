import { Box, Stack, Typography } from '@mui/material';

/** Horizontal bar chart for ranked breakdowns (categories, statuses, …). */
export function HBarChart({
  title,
  data,
  color = '#2DD4BF',
}: {
  title: string;
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'background.paper' }}>
      <Typography sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>
      <Stack spacing={1.25}>
        {data.length === 0 && (
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            No data yet.
          </Typography>
        )}
        {data.map((d) => (
          <Box key={d.label}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
              <Typography sx={{ fontSize: 13 }} noWrap>
                {d.label}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{d.value}</Typography>
            </Stack>
            <Box sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${(d.value / max) * 100}%`, bgcolor: color, borderRadius: 999, transition: 'width .3s' }} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
