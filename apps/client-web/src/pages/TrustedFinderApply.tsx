import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AiAssistantBar } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { uploadAvatar } from '../lib/cloudinary-upload.js';

const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const STEPS = ['Photo ID', 'About you'];

export function TrustedFinderApplyPage() {
  const user = useAuth((s) => s.user);
  const [bio, setBio] = useState('');
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const apply = useMutation({
    mutationFn: () => api.applyTrustedFinder({ idPhotoUrl: idPhotoUrl!, bio: bio || undefined }),
    onSuccess: () => {
      setError(null);
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : 'Failed to submit application');
    },
  });

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(file);
      setIdPhotoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const stepValid = (s: number): boolean => {
    if (s === 0) return !!idPhotoUrl;
    return true;
  };

  const stepHint = (s: number): string => {
    if (s === 0) return 'Please upload your ID photo to continue.';
    return '';
  };

  const isLast = activeStep === STEPS.length - 1;

  const handleNext = () => {
    setError(null);
    if (!stepValid(activeStep)) {
      setError(stepHint(activeStep));
      return;
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  if (!user) return null;

  if (user.trustedFinder) {
    return (
      <Stack spacing={3} maxWidth={560}>
        <Typography variant="h4" fontWeight={700}>
          Trusted Finder
        </Typography>
        <Alert severity="success">
          You are already a trusted finder.
        </Alert>
        <Button component={Link} to="/profile" variant="outlined">
          Back to profile
        </Button>
      </Stack>
    );
  }

  return (
    <Box maxWidth={760} mx="auto">
      <Typography
        sx={{
          color: TEAL,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 12,
          mb: 0.5,
        }}
      >
        Trusted finder
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontWeight: 600,
          fontSize: 30,
          color: INK,
          mb: 1,
        }}
      >
        Apply as Trusted Finder
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Submit a photo ID and a short bio. Admins will review your application.
      </Typography>

      {apply.isSuccess ? (
        <Alert severity="success">
          Application submitted successfully. We will review it shortly.
        </Alert>
      ) : (
        <Box
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: '24px 24px 24px 8px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 30px 60px -48px rgba(11,61,56,0.5)',
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {STEPS.map((l) => (
              <Step key={l}>
                <StepLabel>{l}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {activeStep === 0 && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    ID Photo
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading…' : idPhotoUrl ? 'Change photo' : 'Upload ID photo'}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
                  {idPhotoUrl && (
                    <Box mt={1}>
                      <img
                        src={idPhotoUrl}
                        alt="ID preview"
                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                      />
                    </Box>
                  )}
                </Box>
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={2.5}>
                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Short bio (optional)</Typography>
                    <AiAssistantBar
                      dense
                      value={bio}
                      onChange={(text) => setBio(text.slice(0, 800))}
                      assist={api.aiAssist.bind(api)}
                      actions={['create_from_prompt', 'fix_grammar', 'improve_clarity', 'formalize', 'expand']}
                    />
                  </Stack>
                  <TextField
                    label="Short bio (optional)"
                    multiline
                    rows={3}
                    fullWidth
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us why you want to be a trusted finder…"
                    inputProps={{ maxLength: 800 }}
                    helperText={`${bio.length}/800`}
                  />
                </Box>
              </Stack>
            )}

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBackRoundedIcon />}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  visibility: activeStep === 0 ? 'hidden' : 'visible',
                }}
              >
                Back
              </Button>
              <Typography variant="caption" color="text.secondary">
                Step {activeStep + 1} of {STEPS.length}
              </Typography>
              {isLast ? (
                <Button
                  onClick={() => apply.mutate()}
                  variant="contained"
                  disabled={apply.isPending || !stepValid(STEPS.length - 1)}
                  sx={{
                    bgcolor: MARIGOLD,
                    color: INK,
                    borderRadius: 999,
                    px: 3,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#cf9305' },
                  }}
                >
                  {apply.isPending ? 'Submitting…' : 'Submit application'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={!stepValid(activeStep)}
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    bgcolor: INK,
                    color: '#FBF6EC',
                    borderRadius: 999,
                    px: 3,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#0a322e' },
                  }}
                >
                  Continue
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
