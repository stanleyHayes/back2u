import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@back2u/ui-web';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';

const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';

const STEPS = ['Institution', 'Contact', 'Volume & message'];

const INSTITUTION_TYPES = [
  'University',
  'Mall',
  'Airport',
  'Transit',
  'Hotel',
  'Other',
] as const;

const VOLUME_OPTIONS = [
  '<10',
  '10-50',
  '50-200',
  '200+',
] as const;

type InstitutionType = (typeof INSTITUTION_TYPES)[number];
type VolumeOption = (typeof VOLUME_OPTIONS)[number];

interface FormData {
  institutionName: string;
  institutionType: InstitutionType | '';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  estimatedVolume: VolumeOption | '';
  message: string;
}

interface FormErrors {
  institutionName?: string;
  contactName?: string;
  contactEmail?: string;
  city?: string;
}

const initialFormData: FormData = {
  institutionName: '',
  institutionType: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  city: '',
  estimatedVolume: '',
  message: '',
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function PartnerForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const handleChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!formData.institutionName.trim()) {
      nextErrors.institutionName = 'Institution name is required';
    }
    if (!formData.contactName.trim()) {
      nextErrors.contactName = 'Contact name is required';
    }
    if (!formData.contactEmail.trim()) {
      nextErrors.contactEmail = 'Contact email is required';
    } else if (!isValidEmail(formData.contactEmail.trim())) {
      nextErrors.contactEmail = 'Please enter a valid email address';
    }
    if (!formData.city.trim()) {
      nextErrors.city = 'City/Location is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const stepValid = (s: number): boolean => {
    if (s === 0) {
      return !!formData.institutionName.trim() && !!formData.city.trim();
    }
    if (s === 1) {
      return !!formData.contactName.trim() && isValidEmail(formData.contactEmail.trim());
    }
    return true;
  };

  const stepHint = (s: number): string => {
    if (s === 0) {
      return 'Please provide the institution name and city/location.';
    }
    if (s === 1) {
      return 'Please provide a contact name and a valid contact email.';
    }
    return 'Please complete the required fields before continuing.';
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

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/v1/institutions/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.institutionName.trim(),
          type: formData.institutionType || undefined,
          contactName: formData.contactName.trim(),
          contactEmail: formData.contactEmail.trim(),
          contactPhone: formData.contactPhone.trim() || undefined,
          city: formData.city.trim(),
          estimatedVolume: formData.estimatedVolume || undefined,
          message: formData.message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? `Something went wrong (status ${res.status}). Please try again.`);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setFormData(initialFormData);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          component="header"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Container sx={{ py: 2, display: 'flex', alignItems: 'center' }}>
            <BrandLogo />
            <Box flex={1} />
            <Button
              component={Link}
              to="/"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              size="small"
            >
              Back to home
            </Button>
          </Container>
        </Box>

        {/* Success Card */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 8 }}>
          <Card
            variant="outlined"
            sx={{
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              borderRadius: 3,
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ py: 6, px: { xs: 3, md: 5 } }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Thank you!
              </Typography>
              <Typography color="text.secondary" fontSize={16}>
                Our team will reach out within 48 hours.
              </Typography>
              <Button
                component={Link}
                to="/"
                variant="contained"
                color="primary"
                sx={{ mt: 4 }}
              >
                Back to home
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            py: 4,
            bgcolor: 'background.paper',
            textAlign: 'center',
          }}
        >
          <Container>
            <Typography color="text.secondary" fontSize={14}>
              © {new Date().getFullYear()} Back2u. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 10,
        }}
      >
        <Container sx={{ py: 2, display: 'flex', alignItems: 'center' }}>
          <BrandLogo />
          <Box flex={1} />
          <Button
            component={Link}
            to="/"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            Back to home
          </Button>
        </Container>
      </Box>

      {/* Form */}
      <Box component="main" sx={{ flex: 1, py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
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
              For institutions
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontWeight: 600,
                fontSize: { xs: 28, md: 30 },
                color: INK,
                mb: 1,
              }}
            >
              Partner with Back2u
            </Typography>
            <Typography color="text.secondary" fontSize={16} sx={{ mb: 3 }}>
              Join universities, malls, airports, and transit hubs using smart lost &amp; found.
            </Typography>

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
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
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
                    <TextField
                      label="Institution name"
                      required
                      fullWidth
                      value={formData.institutionName}
                      onChange={handleChange('institutionName')}
                      error={!!errors.institutionName}
                      helperText={errors.institutionName}
                      disabled={submitting}
                    />

                    <TextField
                      label="Institution type"
                      select
                      fullWidth
                      value={formData.institutionType}
                      onChange={handleChange('institutionType')}
                      disabled={submitting}
                    >
                      <MenuItem value="">
                        <em>Select a type</em>
                      </MenuItem>
                      {INSTITUTION_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="City / Location"
                      required
                      fullWidth
                      value={formData.city}
                      onChange={handleChange('city')}
                      error={!!errors.city}
                      helperText={errors.city}
                      disabled={submitting}
                    />
                  </Stack>
                )}

                {activeStep === 1 && (
                  <Stack spacing={2.5}>
                    <TextField
                      label="Contact name"
                      required
                      fullWidth
                      value={formData.contactName}
                      onChange={handleChange('contactName')}
                      error={!!errors.contactName}
                      helperText={errors.contactName}
                      disabled={submitting}
                    />

                    <TextField
                      label="Contact email"
                      type="email"
                      required
                      fullWidth
                      value={formData.contactEmail}
                      onChange={handleChange('contactEmail')}
                      error={!!errors.contactEmail}
                      helperText={errors.contactEmail}
                      disabled={submitting}
                    />

                    <TextField
                      label="Contact phone"
                      type="tel"
                      fullWidth
                      value={formData.contactPhone}
                      onChange={handleChange('contactPhone')}
                      disabled={submitting}
                    />
                  </Stack>
                )}

                {activeStep === 2 && (
                  <Stack spacing={2.5}>
                    <TextField
                      label="Estimated monthly lost items"
                      select
                      fullWidth
                      value={formData.estimatedVolume}
                      onChange={handleChange('estimatedVolume')}
                      disabled={submitting}
                    >
                      <MenuItem value="">
                        <em>Select a range</em>
                      </MenuItem>
                      {VOLUME_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Message / Additional info"
                      multiline
                      rows={4}
                      fullWidth
                      value={formData.message}
                      onChange={handleChange('message')}
                      disabled={submitting}
                      placeholder="Tell us more about your needs..."
                    />
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
                    disabled={activeStep === 0 || submitting}
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
                      onClick={() => handleSubmit()}
                      variant="contained"
                      disabled={submitting || !stepValid(STEPS.length - 1)}
                      sx={{
                        bgcolor: MARIGOLD,
                        color: INK,
                        borderRadius: 999,
                        px: 3,
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#cf9305' },
                      }}
                    >
                      {submitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Request partnership'
                      )}
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
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          py: 4,
          bgcolor: 'background.paper',
          textAlign: 'center',
        }}
      >
        <Container>
          <Typography color="text.secondary" fontSize={14}>
            © {new Date().getFullYear()} Back2u. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
