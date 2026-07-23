import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const DISPLAY = '"Black Ops One", Georgia, serif';
const INK = '#0B3D38';
const PAPER = '#FBF6EC';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';

function BrandPanel() {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        p: 5,
        bgcolor: INK,
        color: PAPER,
      }}
    >
      {/* radar / pin motif */}
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box
          sx={{
            position: 'absolute',
            right: -120,
            bottom: -120,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(224,161,6,0.18), transparent 60%)',
          }}
        />
        {[260, 190, 120].map((s) => (
          <Box
            key={s}
            sx={{
              position: 'absolute',
              right: 24 + (260 - s) / 2,
              bottom: 24 + (260 - s) / 2,
              width: s,
              height: s,
              borderRadius: '50%',
              border: '1px solid rgba(255,253,248,0.12)',
            }}
          />
        ))}
        <Box
          sx={{
            position: 'absolute',
            right: 130,
            bottom: 130,
            width: 44,
            height: 44,
            borderRadius: '50% 50% 50% 6px',
            background: `linear-gradient(150deg, ${TEAL}, #14B8A6)`,
            transform: 'rotate(-45deg)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: PAPER,
              transform: 'rotate(45deg)',
            }}
          />
        </Box>
      </Box>

      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 1.2 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '37% 37% 37% 10%',
            background: `linear-gradient(140deg, ${TEAL}, #14B8A6)`,
            transform: 'rotate(-6deg)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PAPER }} />
        </Box>
        <Typography
          sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, letterSpacing: '-0.03em' }}
        >
          Back2u
        </Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Typography
          sx={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 34,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
          }}
        >
          Whatever you&apos;ve lost, let&apos;s get it back to you.
        </Typography>
        <Typography sx={{ mt: 2, fontSize: 15, color: 'rgba(255,253,248,0.7)', maxWidth: 320 }}>
          Sign in to track your matches, message finders anonymously, and claim what&apos;s yours.
        </Typography>
        <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
          {[
            { n: '12k+', l: 'Items posted' },
            { n: '3.8k+', l: 'Reunions' },
          ].map((s) => (
            <Box key={s.l}>
              <Typography sx={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600 }}>
                {s.n}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,253,248,0.6)',
                }}
              >
                {s.l}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.set);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = mfaToken
        ? await api.verifyMfaLogin(mfaToken, code)
        : await api.login({ email, password });
      if ('mfaRequired' in res) {
        setMfaToken(res.mfaToken);
        setCode('');
        return;
      }
      setAuth({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      });
      navigate('/');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 2, md: 5 } }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 940,
          borderRadius: 5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 40px 80px -50px rgba(11,61,56,.5)',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <BrandPanel />

        <Box sx={{ p: { xs: 3.5, md: 6 } }}>
          <Typography
            component="span"
            sx={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: TEAL,
            }}
          >
            Sign in
          </Typography>
          <Typography
            sx={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: { xs: 34, md: 40 },
              letterSpacing: '-0.02em',
              mt: 1,
              color: INK,
            }}
          >
            Welcome back
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
            Good to see you again.
          </Typography>

          <form onSubmit={submit}>
            <Stack spacing={2.25}>
              {err && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {err}
                </Alert>
              )}
              {mfaToken && (
                <>
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
                  />
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
                </>
              )}
              <TextField
                label="Email"
                type="email"
                required
                fullWidth
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                sx={{ display: mfaToken ? 'none' : undefined }}
              />
              <TextField
                label="Password"
                type={showPw ? 'text' : 'password'}
                required
                fullWidth
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                sx={{ display: mfaToken ? 'none' : undefined }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPw((v) => !v)}
                          edge="end"
                          aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                          {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box sx={{ textAlign: 'right', display: mfaToken ? 'none' : undefined }}>
                <Box
                  component={Link}
                  to="/forgot-password"
                  sx={{
                    fontSize: 14,
                    color: TEAL,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot password?
                </Box>
              </Box>
              <Button
                type="submit"
                size="large"
                disabled={loading || (mfaToken !== null && code.length !== 6)}
                sx={{
                  bgcolor: MARIGOLD,
                  color: INK,
                  borderRadius: 999,
                  fontWeight: 700,
                  py: 1.4,
                  boxShadow: '0 14px 28px -16px rgba(224,161,6,.9)',
                  '&:hover': { bgcolor: '#cf9305' },
                }}
              >
                {loading ? 'Signing in…' : mfaToken ? 'Verify & sign in' : 'Sign in'}
              </Button>
            </Stack>
          </form>

          <Typography sx={{ mt: 3, color: 'text.secondary', fontSize: 15 }}>
            No account?{' '}
            <Box
              component={Link}
              to="/register"
              sx={{
                color: INK,
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Create one
            </Box>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
