import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.set);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await api.register(form);
      setAuth({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      });
      navigate('/');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 460, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create your account
        </Typography>
        <form onSubmit={submit}>
          <Stack spacing={2}>
            {err && <Alert severity="error">{err}</Alert>}
            <TextField
              label="Full name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText="At least 8 characters"
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || form.password.length < 8}
            >
              {loading ? 'Creating…' : 'Create account'}
            </Button>
            <Typography variant="body2">
              Already have an account? <Link to="/login">Sign in</Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
