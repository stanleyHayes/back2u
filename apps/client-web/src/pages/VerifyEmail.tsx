import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from '../lib/api.js';

export function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const request = useMutation({ mutationFn: () => api.requestEmailVerification() });
  const confirm = useMutation({ mutationFn: () => api.confirmEmailVerification(code) });

  return (
    <Box maxWidth={420} mx="auto">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Verify your email</Typography>
        <Stack spacing={2}>
          <Button variant="outlined" onClick={() => request.mutate()} disabled={request.isPending}>
            Send verification code
          </Button>
          {request.isSuccess && <Alert severity="info">Code sent. Check your inbox.</Alert>}
          {confirm.isSuccess && <Alert severity="success">Email verified.</Alert>}
          {confirm.isError && <Alert severity="error">Invalid or expired code.</Alert>}
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button variant="contained" onClick={() => confirm.mutate()} disabled={!code || confirm.isPending}>
            Confirm
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
