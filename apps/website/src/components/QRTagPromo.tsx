import { Box, Button, Container, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';

const BENEFITS = [
  'No app required to scan',
  'Anonymous contact — your info stays private',
  'Works on backpacks, keys, wallets, luggage',
];

function QRPlaceholder() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: 220, md: 320 },
        height: { xs: 220, md: 320 },
        mx: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Outer frame */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 4,
          border: 3,
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* QR pattern grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(7, 1fr)',
            gap: 0.75,
            width: '70%',
            height: '70%',
          }}
        >
          {Array.from({ length: 49 }).map((_, i) => {
            // Create a pseudo-random QR-like pattern
            const filled =
              // Position detection patterns (corners)
              (i === 0 || i === 1 || i === 2 || i === 7 || i === 8 || i === 9 || i === 14 || i === 15 || i === 16) || // top-left
              (i === 4 || i === 5 || i === 6 || i === 11 || i === 12 || i === 13 || i === 18 || i === 19 || i === 20) || // top-right
              (i === 28 || i === 29 || i === 30 || i === 35 || i === 36 || i === 37 || i === 42 || i === 43 || i === 44) || // bottom-left
              // Random data modules
              [10, 17, 21, 23, 24, 26, 31, 33, 34, 38, 40, 41, 45, 46, 47, 48].includes(i);

            return (
              <Box
                key={i}
                sx={{
                  bgcolor: filled ? 'primary.main' : 'transparent',
                  borderRadius: 0.5,
                }}
              />
            );
          })}
        </Box>

        {/* Scan frame overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 16,
            border: 2,
            borderColor: 'primary.main',
            borderRadius: 2,
            opacity: 0.3,
          }}
        />

        {/* Corner accents */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, width: 24, height: 24, borderTop: 4, borderLeft: 4, borderColor: 'secondary.main' }} />
        <Box sx={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderTop: 4, borderRight: 4, borderColor: 'secondary.main' }} />
        <Box sx={{ position: 'absolute', bottom: 12, left: 12, width: 24, height: 24, borderBottom: 4, borderLeft: 4, borderColor: 'secondary.main' }} />
        <Box sx={{ position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, borderBottom: 4, borderRight: 4, borderColor: 'secondary.main' }} />
      </Box>
    </Box>
  );
}

export function QRTagPromo() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: { xs: 6, md: 8 },
          }}
        >
          {/* Left: QR placeholder */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', width: '100%' }}>
            <QRPlaceholder />
          </Box>

          {/* Right: content */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Typography
              variant="h2"
              fontSize={{ xs: 28, md: 40 }}
              fontWeight={700}
              gutterBottom
            >
              Never lose track again
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={{ xs: 16, md: 18 }}
              sx={{ mb: 4, maxWidth: 480 }}
            >
              Our waterproof QR tags bridge offline and online. Someone scans → you get an instant alert.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
              {BENEFITS.map((benefit) => (
                <Stack key={benefit} direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleIcon color="primary" sx={{ fontSize: 22, flexShrink: 0 }} />
                  <Typography color="text.primary" fontWeight={500}>
                    {benefit}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Button
              variant="contained"
              color="primary"
              size="large"
              href={`${APP_URL}/tags`}
              sx={{ fontWeight: 600 }}
            >
              Get QR tags
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
