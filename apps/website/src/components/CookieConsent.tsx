import { useEffect, useState } from 'react';
import { Box, Button, Container, Link, Slide, Stack, Typography } from '@mui/material';

const STORAGE_KEY = 'back2u-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const choice = localStorage.getItem(STORAGE_KEY);
      if (!choice) {
        setVisible(true);
      }
    } catch {
      // localStorage may be unavailable in private mode
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'declined');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <Box
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1300 }}
    >
      <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
        <Box>
          <Container
            maxWidth="md"
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 6,
              borderRadius: { xs: 0, md: 3 },
              borderTop: { xs: 1, md: 0 },
              borderColor: 'divider',
              py: { xs: 2, md: 3 },
              px: { xs: 2, md: 3 },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 3 }}
              sx={{
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  We use cookies to improve your experience and analyze site traffic.
                </Typography>
                <Link
                  href="/privacy"
                  color="primary"
                  underline="hover"
                  sx={{ fontSize: 14, mt: 0.5, display: 'inline-block' }}
                >
                  Privacy Policy
                </Link>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button variant="outlined" size="small" onClick={handleDecline}>
                  Decline
                </Button>
                <Button variant="contained" color="primary" size="small" onClick={handleAccept}>
                  Accept all
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Slide>
    </Box>
  );
}
