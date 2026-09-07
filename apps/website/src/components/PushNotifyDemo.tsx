import { useState, useCallback } from 'react';
import { Box, Button, Container, Paper, Snackbar, Stack, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { alpha } from '@mui/material/styles';
import { neuShadow } from '@back2u/ui-web';

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
      new Notification('bak2me Alert', {
        body: 'iPhone 14 found near Accra Mall — possible match for your lost item',
        icon: '/favicon.ico',
      });
    } else if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // eslint-disable-next-line no-new
        new Notification('bak2me Alert', {
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

          {/* Notification preview */}
          <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            <Paper
              component="article"
              aria-label="Example match notification"
              elevation={0}
              sx={{
                width: '100%',
                maxWidth: 410,
                borderRadius: '22px',
                p: { xs: 2.5, sm: 3 },
                bgcolor: 'background.default',
                border: 'none',
                boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: '11px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'background.default',
                    color: 'primary.main',
                    boxShadow: (t) =>
                      t.palette.mode === 'dark'
                        ? '4px 4px 8px #101910, -4px -4px 8px #43513D88'
                        : '4px 4px 8px #C6BFB499, -4px -4px 8px #FFFFFFCC',
                  }}
                >
                  <NotificationsIcon aria-hidden="true" sx={{ fontSize: 19 }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Black Ops One", serif',
                    fontSize: 16,
                    color: 'text.primary',
                    flex: 1,
                  }}
                >
                  bak2me
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Just now</Typography>
              </Stack>
              <Typography
                sx={{
                  color: 'primary.main',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  mb: 1,
                }}
              >
                Nearby item alert
              </Typography>
              <Typography
                component="h3"
                sx={{
                  fontFamily: 'inherit',
                  fontSize: { xs: 26, sm: 30 },
                  fontWeight: 600,
                  letterSpacing: '-.04em',
                  lineHeight: 1.2,
                }}
              >
                A possible match.
              </Typography>
              <Typography
                sx={{ mt: 1, mb: 2.5, fontSize: 14, lineHeight: 1.65, color: 'text.secondary' }}
              >
                Someone found an item near where you lost yours.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.75,
                  alignItems: 'center',
                  p: 2,
                  borderRadius: '14px',
                  boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 56,
                    flexShrink: 0,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                    color: 'primary.main',
                  }}
                >
                  <PhoneIphoneRoundedIcon aria-hidden="true" sx={{ fontSize: 30 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.1em',
                      color: 'primary.main',
                      mb: 0.5,
                    }}
                  >
                    FOUND
                  </Typography>
                  <Typography
                    sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: 'text.primary' }}
                  >
                    iPhone 14
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.75,
                      color: 'text.secondary',
                    }}
                  >
                    <PlaceOutlinedIcon aria-hidden="true" sx={{ fontSize: 15 }} />
                    <Typography sx={{ fontSize: 12 }}>Near Accra Mall</Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: 2.5,
                  pt: 2,
                  borderTop: '1px solid',
                  borderColor: (t) => alpha(t.palette.text.primary, 0.09),
                }}
              >
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  Zone alerts · Close to what matters
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'text.secondary',
                    bgcolor: (t) => alpha(t.palette.text.primary, 0.05),
                    px: 1,
                    py: 0.4,
                    borderRadius: '6px',
                  }}
                >
                  Demo preview
                </Typography>
              </Box>
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
