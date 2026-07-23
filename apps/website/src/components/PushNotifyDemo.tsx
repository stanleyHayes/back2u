import { useState, useCallback } from 'react';
import { Box, Button, Container, Paper, Snackbar, Stack, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

export function PushNotifyDemo() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleEnableDemoAlert = useCallback(async () => {
    if (!('Notification' in window)) {
      setSnackbarMessage("In the real app, you'd get push notifications here.");
      setSnackbarOpen(true);
      return;
    }

    if (Notification.permission === 'granted') {
      // eslint-disable-next-line no-new
      new Notification('Back2u Alert', {
        body: 'iPhone 14 found near Accra Mall — possible match for your lost item',
        icon: '/favicon.ico',
      });
    } else if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // eslint-disable-next-line no-new
        new Notification('Back2u Alert', {
          body: 'iPhone 14 found near Accra Mall — possible match for your lost item',
          icon: '/favicon.ico',
        });
      } else {
        setSnackbarMessage("In the real app, you'd get push notifications here.");
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage("In the real app, you'd get push notifications here.");
      setSnackbarOpen(true);
    }
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      <Container>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 6,
            alignItems: 'center',
          }}
        >
          {/* Text */}
          <Box>
            <Typography
              variant="h2"
              gutterBottom
              sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 700 }}
            >
              Get alerted before you even ask
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
              Subscribe to zone alerts and we&apos;ll notify you when someone reports a found item
              near where you lost yours.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleEnableDemoAlert}
                startIcon={<NotificationsIcon />}
              >
                Enable demo alert
              </Button>
            </Box>
          </Box>

          {/* Mock notification card */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Paper
              elevation={4}
              sx={{
                width: '100%',
                maxWidth: 360,
                borderRadius: 3,
                p: 2,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <NotificationsIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Back2u Alert
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    iPhone 14 found near Accra Mall — possible match for your lost item
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}
                  >
                    now
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Paper
          elevation={6}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {snackbarMessage}
          </Typography>
        </Paper>
      </Snackbar>
    </Box>
  );
}
