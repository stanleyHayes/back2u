import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { back2uTheme } from '@back2u/ui-web';
import type { AuthResponse } from '@back2u/shared-types';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const DISPLAY = '"Black Ops One", Georgia, serif';
const INK = '#2E3D2F';
const PAPER = '#F2EFEA';
const TEAL = '#40614A';
const MARIGOLD = '#8B6F4E';

const STATS = [
  { n: 'Track', l: 'Lost & found' },
  { n: 'Redeem', l: 'Finder points' },
  { n: 'Deliver', l: 'Courier jobs' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.set);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const finishLogin = (res: AuthResponse) => {
    const allowed = res.user.roles.some(
      (r) => r === 'partner_admin' || r === 'admin' || r === 'super_admin' || r === 'courier',
    );
    if (!allowed) {
      setErr('This account does not have partner access.');
      setMfaToken(null);
      setCode('');
      return;
    }
    setAuth({
      user: res.user,
      accessToken: res.tokens.accessToken,
      refreshToken: res.tokens.refreshToken,
    });
    navigate('/');
  };

  const login = useMutation({
    mutationFn: () => api.login({ email, password }),
    onSuccess: (res) => {
      if ('mfaRequired' in res) {
        setErr(null);
        setCode('');
        setMfaToken(res.mfaToken);
        return;
      }
      finishLogin(res);
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : 'Login failed'),
  });

  const verify = useMutation({
    mutationFn: () => api.verifyMfaLogin(mfaToken!, code),
    onSuccess: finishLogin,
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : 'Verification failed'),
  });

  return (
    <ThemeProvider theme={back2uTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
          bgcolor: PAPER,
        }}
      >
        {/* Brand / portal panel */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            p: 7,
            bgcolor: INK,
            color: PAPER,
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(250,248,243,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(250,248,243,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(60% 60% at 70% 40%, #000, transparent)',
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              right: -140,
              bottom: -140,
              width: 420,
              height: 420,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,111,78,0.2), transparent 60%)',
            }}
          />

          <Box
            sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 1.25 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '37% 37% 37% 10%',
                background: `linear-gradient(140deg, ${TEAL}, #7E9A82)`,
                transform: 'rotate(-6deg)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: PAPER }} />
            </Box>
            <Typography
              sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 23, letterSpacing: '-0.03em' }}
            >
              Back2u
            </Typography>
            <Box
              sx={{
                ml: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                border: '1px solid rgba(250,248,243,0.25)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              Partner
            </Box>
          </Box>

          <Box sx={{ position: 'relative' }}>
            <Typography
              sx={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 40,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
              }}
            >
              Your front desk, online.
            </Typography>
            <Typography sx={{ mt: 2, fontSize: 16, color: 'rgba(250,248,243,0.7)', maxWidth: 380 }}>
              Track everything reported at your venue, redeem finder points at your counters,
              dispatch couriers, and manage your plan — all in one place.
            </Typography>
            <Stack direction="row" spacing={4} sx={{ mt: 5 }}>
              {STATS.map((s) => (
                <Box key={s.l}>
                  <Typography
                    sx={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: MARIGOLD }}
                  >
                    {s.n}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(250,248,243,0.6)',
                    }}
                  >
                    {s.l}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Form */}
        <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 3, md: 6 } }}>
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: TEAL, mb: 1 }}>
              <StorefrontOutlinedIcon fontSize="small" />
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Partner access
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: { xs: 32, md: 40 },
                letterSpacing: '-0.02em',
                color: INK,
              }}
            >
              Partner sign-in
            </Typography>
            <Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
              For institution staff &amp; couriers.
            </Typography>

            {mfaToken ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.length === 6) verify.mutate();
                }}
              >
                <Stack spacing={2.25}>
                  {err && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {err}
                    </Alert>
                  )}
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Two-factor authentication is on for this account. Enter the 6-digit code from
                    your authenticator app.
                  </Alert>
                  <TextField
                    label="Authentication code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    autoFocus
                    fullWidth
                    slotProps={{
                      htmlInput: {
                        inputMode: 'numeric',
                        autoComplete: 'one-time-code',
                        style: { letterSpacing: '0.4em', textAlign: 'center', fontSize: 20 },
                      },
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 } }}
                  />
                  <Button
                    type="submit"
                    size="large"
                    disabled={code.length !== 6 || verify.isPending}
                    sx={{
                      bgcolor: MARIGOLD,
                      color: INK,
                      borderRadius: 999,
                      fontWeight: 700,
                      py: 1.4,
                      boxShadow: '0 14px 28px -16px rgba(139,111,78,.9)',
                      '&:hover': { bgcolor: '#6F5940' },
                    }}
                  >
                    {verify.isPending ? 'Verifying…' : 'Verify & sign in'}
                  </Button>
                  <Button
                    onClick={() => {
                      setMfaToken(null);
                      setCode('');
                      setErr(null);
                    }}
                    color="inherit"
                    sx={{ alignSelf: 'center', color: 'text.secondary' }}
                  >
                    Back to password
                  </Button>
                </Stack>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  login.mutate();
                }}
              >
                <Stack spacing={2.25}>
                  {err && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {err}
                    </Alert>
                  )}
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    autoComplete="email"
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 } }}
                  />
                  <TextField
                    label="Password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    autoComplete="current-password"
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 } }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPw((v) => !v)}
                              edge="end"
                              aria-label="Toggle password"
                            >
                              {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    size="large"
                    disabled={login.isPending}
                    sx={{
                      bgcolor: MARIGOLD,
                      color: INK,
                      borderRadius: 999,
                      fontWeight: 700,
                      py: 1.4,
                      boxShadow: '0 14px 28px -16px rgba(139,111,78,.9)',
                      '&:hover': { bgcolor: '#6F5940' },
                    }}
                  >
                    {login.isPending ? 'Signing in…' : 'Sign in'}
                  </Button>
                </Stack>
              </form>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
