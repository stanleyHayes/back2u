import { Box, Stack, Typography } from '@mui/material';

export type DonutSlice = { label: string; value: number; color: string };

/** A conic-gradient donut with a centred total and a legend. */
export function DonutChart({
  title,
  slices,
  centerLabel,
  centerValue,
}: {
  title: string;
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let acc = 0;
  const stops = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (acc / (total || 1)) * 360;
      acc += s.value;
      const end = (acc / (total || 1)) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>
      <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            position: 'relative',
            width: 120,
            height: 120,
            flexShrink: 0,
            borderRadius: '50%',
            background: total > 0 ? `conic-gradient(${stops})` : 'rgba(128,128,128,0.25)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: '23%',
              borderRadius: '50%',
              bgcolor: 'background.paper',
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Black Ops One", Georgia, serif',
                  fontWeight: 600,
                  fontSize: 22,
                  lineHeight: 1,
                }}
              >
                {centerValue ?? total}
              </Typography>
              {centerLabel && (
                <Typography
                  sx={{
                    fontSize: 9.5,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {centerLabel}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          {slices.map((s) => (
            <Stack key={s.label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box
                sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: s.color, flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: 13, flex: 1 }} noWrap>
                {s.label}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{s.value}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
