import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { api } from '../lib/api.js';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const confirm = useMutation({ mutationFn: () => api.confirmPasswordReset(token, password) });

  return (
    <Box maxWidth={420} mx="auto">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Choose a new password</Typography>
        {confirm.isSuccess ? (
          <Alert severity="success">Password updated. You can now sign in.</Alert>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); confirm.mutate(); }}>
            <Stack spacing={2}>
              {confirm.isError && <Alert severity="error">Reset failed — link may be expired.</Alert>}
              <TextField label="New password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} helperText="At least 8 characters" />
              <TextField
                label="Confirm password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPassword.length > 0 && confirmPassword !== password}
                helperText={confirmPassword.length > 0 && confirmPassword !== password ? 'Passwords do not match' : undefined}
              />
              <Button type="submit" variant="contained" size="large" disabled={!token || password.length < 8 || password !== confirmPassword || confirm.isPending}>
                Update password
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}
