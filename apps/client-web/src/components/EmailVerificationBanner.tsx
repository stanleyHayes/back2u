import { useState } from 'react';
import { Alert, Button, Collapse, IconButton, Stack, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../lib/auth.store.js';
import { api } from '../lib/api.js';

export function EmailVerificationBanner() {
  const { user, setUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user || dismissed) return null;
  if (user.emailVerified && !success) return null;

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.requestEmailVerification();
      setSent(true);
    } catch {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      await api.confirmEmailVerification(code);
      setSuccess(true);
      if (user) {
        setUser({ ...user, emailVerified: true });
      }
    } catch {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Collapse in={!dismissed}>
      <Alert
        severity={success ? 'success' : 'warning'}
        icon={<EmailIcon />}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {!success && !sent && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleResend}
                disabled={loading}
                color="inherit"
              >
                Resend code
              </Button>
            )}
            {!success && sent && (
              <>
                <TextField
                  size="small"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
                  sx={{ width: 120, bgcolor: 'background.paper', borderRadius: 1 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleVerify}
                  disabled={loading || code.length !== 6}
                >
                  Verify
                </Button>
              </>
            )}
            <IconButton size="small" color="inherit" onClick={() => setDismissed(true)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        {success
          ? 'Your email has been verified successfully.'
          : 'Your email is not verified. Verify now to unlock all features.'}
        {!success && sent && !error && (
          <span style={{ display: 'block', marginTop: 4, fontSize: '0.85rem', opacity: 0.9 }}>
            Check your inbox for the code.
          </span>
        )}
        {!success && error && (
          <span style={{ display: 'block', marginTop: 4, fontSize: '0.85rem' }}>{error}</span>
        )}
      </Alert>
    </Collapse>
  );
}
