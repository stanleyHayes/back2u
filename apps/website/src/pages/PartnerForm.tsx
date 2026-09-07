import { useEffect, useState } from 'react';
import {
  Autocomplete,
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
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BrandLogo, neuShadow } from '@back2u/ui-web';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';

const MARIGOLD = '#8B6F4E';

const STEPS = ['Your venue', 'Contact', 'Your needs'];

const BENEFITS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: 'Turn reports into possible matches',
    body: 'Bring lost and found reports together, then verify ownership before a handover.',
  },
  {
    icon: <QrCode2Icon />,
    title: 'Branded QR tags',
    body: 'Turn every locker, desk and sticker into an instant, anonymous return channel.',
  },
  {
    icon: <SpaceDashboardOutlinedIcon />,
    title: 'A staff dashboard',
    body: 'Track, verify ownership and hand items back — with a full audit trail.',
  },
  {
    icon: <RedeemOutlinedIcon />,
    title: 'Reward finders',
    body: 'Let people redeem finder points at your counters to drive footfall.',
  },
];

const TRUST: { icon: ReactNode; label: string }[] = [
  { icon: <BoltRoundedIcon />, label: 'Guided onboarding' },
  { icon: <PaymentsOutlinedIcon />, label: 'Free to start' },
];

const INSTITUTION_TYPES = ['University', 'Mall', 'Airport', 'Transit', 'Hotel', 'Other'] as const;

const VOLUME_OPTIONS = ['<10', '10-50', '50-200', '200+'] as const;

type InstitutionType = (typeof INSTITUTION_TYPES)[number];
type VolumeOption = (typeof VOLUME_OPTIONS)[number];

interface PlaceHit {
  name: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

interface FormData {
  institutionName: string;
  institutionType: InstitutionType | '';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  lat: number | null;
  lng: number | null;
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
  lat: null,
  lng: null,
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

  // Geocoded venue search: users pick their exact place so we get lat/lng and
  // can put it on the map — far more useful than a free-text city.
  const [placeInput, setPlaceInput] = useState('');
  const [placeOptions, setPlaceOptions] = useState<PlaceHit[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);

  useEffect(() => {
    const q = placeInput.trim();
    if (q.length < 3) {
      setPlaceOptions([]);
      return;
    }
    let cancelled = false;
    setPlaceLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/v1/geo/search?q=${encodeURIComponent(q)}&limit=6`);
        const json = await res.json().catch(() => ({}));
        const hits: PlaceHit[] = (json?.data ?? []).map(
          (p: { name: string; lat: number; lng: number; city?: string; country?: string }) => ({
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            city: p.city,
            country: p.country,
          }),
        );
        if (!cancelled) setPlaceOptions(hits);
      } catch {
        if (!cancelled) setPlaceOptions([]);
      } finally {
        if (!cancelled) setPlaceLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [placeInput]);

  const handleChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          lat: formData.lat ?? undefined,
          lng: formData.lng ?? undefined,
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
            <Box sx={{ flex: 1 }} />
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
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 8,
          }}
        >
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
              <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
                Thank you!
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 16 }}>
                Your enquiry is with our team. We’ll contact you to discuss your venue and next
                steps.
              </Typography>
              <Button component={Link} to="/" variant="contained" color="primary" sx={{ mt: 4 }}>
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
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              © {new Date().getFullYear()} bak2me. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Navbar />
      {/* Form */}
      <Box component="main" sx={{ flex: 1, py: { xs: 5, md: 9 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '0.92fr 1.08fr' },
              gap: { xs: 3, md: 4 },
              alignItems: 'start',
            }}
          >
            <Box
              sx={{ position: { xs: 'relative', md: 'sticky' }, top: { md: 116 }, pr: { md: 3 } }}
            >
              <Typography
                sx={{
                  color: 'primary.main',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  mb: 2,
                }}
              >
                BECOME A PARTNER
              </Typography>
              <Typography
                component="h1"
                sx={{
                  fontFamily: '"Black Ops One", Georgia, serif',
                  fontSize: { xs: 40, md: 56 },
                  fontWeight: 600,
                  letterSpacing: '-.055em',
                  lineHeight: 1.08,
                  mb: 2.5,
                }}
              >
                Your place.
                <br />
                Their way back.
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: 17,
                  lineHeight: 1.75,
                  maxWidth: 420,
                  mb: 4,
                }}
              >
                Give your community a trusted place to turn when something goes missing. Tell us
                about your venue and we’ll help you find the right setup.
              </Typography>
              <Button
                href="#partner-enquiry"
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  display: { xs: 'inline-flex', md: 'none' },
                  mb: 4,
                  minHeight: 46,
                  borderRadius: '12px',
                }}
              >
                Start your enquiry
              </Button>
              <Box
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: '24px',
                  bgcolor: 'background.default',
                  boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
                }}
              >
                <Stack spacing={3}>
                  {BENEFITS.map((benefit) => (
                    <Stack key={benefit.title} direction="row" spacing={2}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          flexShrink: 0,
                          borderRadius: '12px',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'primary.main',
                          bgcolor: 'background.default',
                          boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
                          '& svg': { fontSize: 21 },
                        }}
                      >
                        {benefit.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 0.5 }}>
                          {benefit.title}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.65 }}
                        >
                          {benefit.body}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Stack direction="row" sx={{ mt: 3, gap: 2, flexWrap: 'wrap' }}>
                {TRUST.map((item) => (
                  <Stack
                    key={item.label}
                    direction="row"
                    spacing={0.75}
                    sx={{
                      alignItems: 'center',
                      color: 'text.secondary',
                      '& svg': { fontSize: 16 },
                    }}
                  >
                    {item.icon}
                    <Typography sx={{ fontSize: 12 }}>{item.label}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button
                component={Link}
                to="/pricing"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ mt: 3, color: 'primary.main' }}
              >
                Explore institution plans
              </Button>
            </Box>

            {/* Wizard */}
            <Box
              id="partner-enquiry"
              sx={{
                scrollMarginTop: 110,
                p: { xs: 2.5, sm: 4 },
                borderRadius: '26px',
                bgcolor: 'background.default',
                boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
                minWidth: 0,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: 'background.default',
                  boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
                },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                '& .MuiButton-root': { borderRadius: '12px', minHeight: 44 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'primary.main',
                  letterSpacing: '.1em',
                  mb: 1,
                }}
              >
                PARTNER ENQUIRY
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Black Ops One", Georgia, serif',
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: '-.035em',
                  mb: 1,
                }}
              >
                {
                  [
                    'Tell us about your place.',
                    'Who should we contact?',
                    'Make it work for your team.',
                  ][activeStep]
                }
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6, mb: 3 }}>
                {
                  [
                    'Start with your institution and location.',
                    'Share the details of the person coordinating your partnership.',
                    'Help us understand your volume and any specific needs.',
                  ][activeStep]
                }
              </Typography>
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  mb: 4,
                  '& .MuiStepLabel-label': { fontSize: 11 },
                  '& .MuiStep-root': { px: 0.5 },
                }}
              >
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
                      placeholder="e.g. Osu Community Centre"
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

                    <Autocomplete
                      freeSolo
                      options={placeOptions}
                      loading={placeLoading}
                      filterOptions={(x) => x}
                      disabled={submitting}
                      inputValue={placeInput || formData.city}
                      getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                      onInputChange={(_e, v) => {
                        setPlaceInput(v);
                        setFormData((prev) => ({ ...prev, city: v, lat: null, lng: null }));
                        if (errors.city) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.city;
                            return next;
                          });
                        }
                      }}
                      onChange={(_e, val) => {
                        if (val && typeof val !== 'string') {
                          const label = val.city ? `${val.name}, ${val.city}` : val.name;
                          setPlaceInput(label);
                          setFormData((prev) => ({
                            ...prev,
                            city: label,
                            lat: val.lat,
                            lng: val.lng,
                          }));
                        }
                      }}
                      renderOption={(props, o) => (
                        <Box component="li" {...props} key={`${o.name}-${o.lat}-${o.lng}`}>
                          <PlaceOutlinedIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                          <Box>
                            <Typography sx={{ fontSize: 14 }}>{o.name}</Typography>
                            {(o.city || o.country) && (
                              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                                {[o.city, o.country].filter(Boolean).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Venue location"
                          placeholder="Search for a venue or enter a city"
                          required
                          error={!!errors.city}
                          helperText={
                            errors.city ??
                            (formData.lat != null
                              ? '✓ Pinned — we can place this venue on the map.'
                              : 'Search for your exact venue so we can locate it on the map.')
                          }
                          disabled={submitting}
                          slotProps={{
                            ...params.slotProps,
                            input: {
                              ...params.slotProps.input,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PlaceOutlinedIcon fontSize="small" />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <>
                                  {placeLoading ? <CircularProgress size={18} /> : null}
                                  {params.slotProps.input.endAdornment}
                                </>
                              ),
                            },
                          }}
                        />
                      )}
                    />
                  </Stack>
                )}

                {activeStep === 1 && (
                  <Stack spacing={2.5}>
                    <TextField
                      label="Contact name"
                      placeholder="Your full name"
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
                      placeholder="you@organisation.com"
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
                      placeholder="e.g. +233 24 000 0000"
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
                      label="Monthly item volume"
                      select
                      fullWidth
                      value={formData.estimatedVolume}
                      onChange={handleChange('estimatedVolume')}
                      disabled={submitting}
                      helperText="A rough estimate is fine — it helps us size your dashboard and finder rewards."
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
                      label="Anything else we should know?"
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
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    pt: 2.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
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
                        color: '#F2EFEA',
                        borderRadius: 999,
                        px: 3,
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#6F5940' },
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
                        bgcolor: 'primary.main',
                        color: (t) => t.palette.getContrastText(t.palette.primary.main),
                        borderRadius: 999,
                        px: 3,
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#243024' },
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

      <Footer />
    </Box>
  );
}
