import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../lib/api.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const reset = useMutation({ mutationFn: () => api.requestPasswordReset(email) });
  return (
    <Box maxWidth={420} mx="auto">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Reset your password</Typography>
        {reset.isSuccess ? (
          <Alert severity="success">If that email exists, a reset link has been sent.</Alert>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              reset.mutate();
            }}
          >
            <Stack spacing={2}>
              <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" variant="contained" size="large" disabled={reset.isPending}>
                {reset.isPending ? 'Sending…' : 'Send reset link'}
              </Button>
              <Typography variant="body2">
                Remembered? <Link to="/login">Sign in</Link>
              </Typography>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}
