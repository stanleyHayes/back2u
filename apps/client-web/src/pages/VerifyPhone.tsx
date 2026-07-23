import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from '../lib/api.js';

export function VerifyPhonePage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const request = useMutation({ mutationFn: () => api.requestPhoneOtp(phone) });
  const verify = useMutation({ mutationFn: () => api.verifyPhoneOtp(phone, code) });

  return (
    <Box maxWidth={420} mx="auto">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Verify your phone</Typography>
        <Stack spacing={2}>
          {request.isSuccess && <Alert severity="info">OTP sent via SMS.</Alert>}
          {verify.isSuccess && <Alert severity="success">Phone verified.</Alert>}
          {verify.isError && <Alert severity="error">Invalid or expired code.</Alert>}
          <TextField label="Phone (with country code)" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." />
          <Button variant="outlined" onClick={() => request.mutate()} disabled={!phone || request.isPending}>
            Send code
          </Button>
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button variant="contained" onClick={() => verify.mutate()} disabled={!code || verify.isPending}>
            Confirm
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
