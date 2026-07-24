import { useState, FormEvent } from 'react';
import { Box, Button, Container, Stack, TextField, Typography, Alert } from '@mui/material';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';

export function ReferralBanner() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Box
      sx={{
        py: { xs: 5, md: 6 },
        background: `linear-gradient(135deg, #8B6F4E 0%, #D97706 100%)`,
        color: '#fff',
      }}
    >
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 3, md: 4 },
          }}
        >
          {/* Text block */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              Invite a friend, both get 50 points
            </Typography>
            <Typography sx={{ opacity: 0.95, maxWidth: 480 }}>
              The more people on Back2u, the faster lost items get found.
            </Typography>
          </Box>

          {/* Form + actions */}
          <Box sx={{ width: { xs: '100%', md: 'auto' }, minWidth: { md: 360 } }}>
            {submitted ? (
              <Alert
                severity="success"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.95)',
                  color: 'text.primary',
                  borderRadius: 2,
                }}
              >
                Thanks! We'll let you know when referrals go live.
              </Alert>
            ) : (
              <Stack component="form" onSubmit={handleSubmit} spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    type="email"
                    placeholder=" friend's email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.95)',
                        borderRadius: 2,
                        '& fieldset': { border: 'none' },
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    sx={{
                      bgcolor: '#40614A',
                      color: '#fff',
                      borderRadius: 2,
                      px: 3,
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: '#115E59' },
                    }}
                  >
                    Invite
                  </Button>
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Points redeemable at partner institutions.
                  </Typography>
                  <Button
                    href={`${APP_URL}/settings`}
                    size="small"
                    sx={{
                      color: '#fff',
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                      p: 0,
                      minWidth: 0,
                      '&:hover': { bgcolor: 'transparent', opacity: 0.85 },
                    }}
                  >
                    Learn more
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
