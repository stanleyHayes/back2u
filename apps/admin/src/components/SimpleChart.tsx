import { useMemo, useState } from 'react';
import { Box, Paper, Stack, Tooltip, Typography } from '@mui/material';

interface SimpleChartProps {
  data: number[];
  labels: string[];
  color: string;
  title: string;
}

export function SimpleChart({ data, labels, color, title }: SimpleChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const max = useMemo(() => Math.max(...data, 1), [data]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: { xs: 0.25, sm: 0.5 },
          height: 160,
          overflow: 'hidden',
          pb: 1,
        }}
      >
        {data.map((count, i) => {
          const heightPct = (count / max) * 100;
          const isHovered = hoveredIndex === i;
          return (
            <Tooltip
              key={i}
              title={`${labels[i] ?? ''}: ${count}`}
              arrow
              placement="top"
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: 0,
                  flex: 1,
                  height: '100%',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isHovered && (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 10, mb: 0.5, whiteSpace: 'nowrap' }}
                  >
                    {count}
                  </Typography>
                )}
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 20,
                    height: `${Math.max(heightPct, 1)}%`,
                    bgcolor: color,
                    borderRadius: 1,
                    opacity: isHovered ? 0.85 : 1,
                    transition: 'opacity 0.15s',
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {labels[0] ?? ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {labels[labels.length - 1] ?? ''}
        </Typography>
      </Stack>
    </Paper>
  );
}
