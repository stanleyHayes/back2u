import { Box, Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { PageShell } from '../components/PageShell';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const INK = '#0B3D38';

export function NotFound() {
  return (
    <PageShell maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: { xs: 4, md: 8 } }}>
        <Typography
          className="b2u-display"
          sx={{
            fontSize: { xs: 96, md: 140 },
            fontWeight: 600,
            lineHeight: 1,
            color: INK,
            letterSpacing: '-0.04em',
          }}
        >
          404
        </Typography>
        <Typography
          component="span"
          className="b2u-eyebrow"
          sx={{ justifyContent: 'center', mt: 1 }}
        >
          Lost, but not found
        </Typography>
        <Typography
          className="b2u-display"
          component="h1"
          sx={{ mt: 2.5, fontSize: { xs: 28, md: 36 }, fontWeight: 600, color: INK }}
        >
          This page wandered off.
        </Typography>
        <Typography sx={{ mt: 1.5, color: 'text.secondary', fontSize: 17 }}>
          The link may be broken or the page may have moved. Let&apos;s get you back on track.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'center', mt: 4 }}
        >
          <Button component={Link} to="/" variant="contained" color="primary" size="large">
            Back home
          </Button>
          <Button
            href={`${APP_URL}/feed`}
            variant="outlined"
            color="inherit"
            size="large"
            sx={{ color: 'text.primary' }}
          >
            Browse items
          </Button>
        </Stack>
      </Box>
    </PageShell>
  );
}
