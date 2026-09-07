import { Alert, Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsoleLoginLayout } from '@back2u/ui-web';
import type { AuthResponse } from '@back2u/shared-types';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

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
    <ConsoleLoginLayout variant="partner" verifying={Boolean(mfaToken)}>
      {mfaToken ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            if (code.length === 6 && !verify.isPending) verify.mutate();
          }}
        >
          <Stack spacing={2.25}>
            {err && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {err}
              </Alert>
            )}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Two-factor authentication is on for this account. Enter the 6-digit code from your
              authenticator app.
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
                bgcolor: '#40614A',
                color: '#F2EFEA',
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
            setErr(null);
            if (!login.isPending) login.mutate();
          }}
        >
          <Stack spacing={2.25}>
            {err && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {err}
              </Alert>
            )}
            <TextField
              label="Email address"
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
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        aria-pressed={showPw}
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
                bgcolor: '#40614A',
                color: '#F2EFEA',
                borderRadius: 999,
                fontWeight: 700,
                py: 1.4,
                boxShadow: '0 14px 28px -16px rgba(139,111,78,.9)',
                '&:hover': { bgcolor: '#6F5940' },
              }}
            >
              {login.isPending ? 'Signing in…' : 'Sign in to partner'}
            </Button>
          </Stack>
        </form>
      )}
    </ConsoleLoginLayout>
  );
}
