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
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PinOutlinedIcon from '@mui/icons-material/PinOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { BrandMark, neuShadow } from '@back2u/ui-web';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const DISPLAY = '"Black Ops One", Georgia, serif';
const INK = '#2E3D2F';
const PAPER = '#F2EFEA';
const TEAL = '#40614A';

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
            background: 'radial-gradient(circle, rgba(139,111,78,0.18), transparent 60%)',
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
              border: '1px solid rgba(250,248,243,0.12)',
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
            background: `linear-gradient(150deg, ${TEAL}, #7E9A82)`,
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
        <BrandMark size={32} onDark />
        <Typography
          sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, letterSpacing: '-0.03em' }}
        >
          bak2me
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
        <Typography sx={{ mt: 2, fontSize: 15, color: 'rgba(250,248,243,0.7)', maxWidth: 320 }}>
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
          border: 'none',
          bgcolor: (t) => (t.palette.mode === 'dark' ? '#263026' : PAPER),
          boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <BrandPanel />

        <Box
          sx={{
            p: { xs: 3, md: 5 },
            '& .MuiOutlinedInput-root': {
              bgcolor: (t) => (t.palette.mode === 'dark' ? '#263026' : PAPER),
              borderRadius: '14px',
              boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
              '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary',
              '&::placeholder': {
                color: (t) => (t.palette.mode === 'dark' ? '#B5C3B7' : '#596653'),
                opacity: 1,
              },
            },
            '& .MuiInputLabel-root': {
              color: (t) => (t.palette.mode === 'dark' ? '#B5C3B7' : '#596653'),
              '&.Mui-focused': { color: 'primary.main' },
              '&.Mui-error': { color: 'error.main' },
            },
            '& .MuiInputAdornment-root': {
              color: (t) => (t.palette.mode === 'dark' ? '#B5C3B7' : '#596653'),
            },
            '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: 20 },
            '& .MuiIconButton-root': {
              width: 34,
              height: 34,
              bgcolor: (t) => (t.palette.mode === 'dark' ? '#263026' : PAPER),
              boxShadow: (t) =>
                t.palette.mode === 'dark'
                  ? '3px 3px 6px #101910, -3px -3px 6px #43513D99'
                  : '3px 3px 6px #C6BFB499, -3px -3px 6px #FFFFFFCC',
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 3,
              },
            },
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'primary.main',
            }}
          >
            Sign in
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: { xs: 34, md: 40 },
              letterSpacing: '-0.02em',
              mt: 1,
              color: 'text.primary',
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
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    autoFocus
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PinOutlinedIcon aria-hidden="true" />
                          </InputAdornment>
                        ),
                        endAdornment: code ? (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              aria-label="Clear authentication code"
                              onClick={() => setCode('')}
                              edge="end"
                            >
                              <CloseRoundedIcon />
                            </IconButton>
                          </InputAdornment>
                        ) : undefined,
                      },
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
                placeholder="you@example.com"
                type="email"
                required
                fullWidth
                value={email}
                autoComplete="email"
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineRoundedIcon aria-hidden="true" />
                      </InputAdornment>
                    ),
                    endAdornment: email ? (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          aria-label="Clear email"
                          onClick={() => setEmail('')}
                          edge="end"
                        >
                          <CloseRoundedIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ display: mfaToken ? 'none' : undefined }}
              />
              <TextField
                label="Password"
                placeholder="Enter your password"
                type={showPw ? 'text' : 'password'}
                required
                fullWidth
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                sx={{ display: mfaToken ? 'none' : undefined }}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon aria-hidden="true" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          aria-pressed={showPw}
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
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 4,
                      borderRadius: 1,
                    },
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
                  bgcolor: '#756044',
                  color: '#FFFFFF',
                  borderRadius: 999,
                  fontWeight: 700,
                  py: 1.4,
                  boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
                  '&:active': {
                    boxShadow: 'inset 4px 4px 8px #5B4730, inset -4px -4px 8px #B5946D',
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 4,
                  },
                  '&.Mui-disabled': { boxShadow: 'none' },
                  '&:hover': { bgcolor: '#6F5940' },
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
                color: 'text.primary',
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 4,
                  borderRadius: 1,
                },
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
