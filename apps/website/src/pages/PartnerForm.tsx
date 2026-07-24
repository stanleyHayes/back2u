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
import { BrandLogo } from '@back2u/ui-web';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';

const INK = '#2E3D2F';
const TEAL = '#40614A';
const MARIGOLD = '#8B6F4E';

const STEPS = ['Institution', 'Contact', 'Volume & message'];

const BENEFITS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: 'AI reunites items automatically',
    body: 'Visual, text, geo and time matching flags the owner the moment something is found.',
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
  { icon: <BoltRoundedIcon />, label: '48-hour onboarding' },
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
                Our team will reach out within 48 hours.
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
            {/* Value panel */}
            <Box
              sx={{
                position: { xs: 'relative', md: 'sticky' },
                top: { md: 24 },
                p: { xs: 3, md: 4 },
                borderRadius: '14px 14px 4px 14px',
                color: '#EAF3ED',
                background: 'linear-gradient(155deg, #2E3D2F 0%, #40614A 100%)',
                overflow: 'hidden',
                animation: 'b2uFadeUp .55s cubic-bezier(.2,.7,.2,1) both',
                boxShadow: '0 30px 60px -40px rgba(46,61,47,0.7)',
              }}
            >
              {/* decorative glow */}
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  right: -80,
                  top: -80,
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(139,111,78,0.28), transparent 62%)',
                  pointerEvents: 'none',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Typography
                  sx={{
                    color: '#8FE3D5',
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    fontSize: 12,
                    mb: 0.75,
                  }}
                >
                  For institutions
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Black Ops One", Georgia, serif',
                    fontWeight: 600,
                    fontSize: { xs: 30, md: 36 },
                    lineHeight: 1.05,
                    mb: 1.25,
                  }}
                >
                  Partner with Back2u
                </Typography>
                <Typography
                  sx={{ fontSize: 15.5, color: 'rgba(234,243,237,0.82)', mb: 3, maxWidth: 380 }}
                >
                  Join universities, malls, airports and transit hubs running smart lost &amp;
                  found.
                </Typography>

                <Stack spacing={2.25}>
                  {BENEFITS.map((b) => (
                    <Stack
                      key={b.title}
                      direction="row"
                      spacing={1.75}
                      sx={{ alignItems: 'flex-start' }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          borderRadius: 2,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: 'rgba(250,248,243,0.12)',
                          color: '#FAF8F3',
                          '& svg': { fontSize: 21 },
                        }}
                      >
                        {b.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{b.title}</Typography>
                        <Typography
                          sx={{ fontSize: 13.5, color: 'rgba(234,243,237,0.72)', lineHeight: 1.5 }}
                        >
                          {b.body}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    mt: 3.5,
                    pt: 2.5,
                    borderTop: '1px solid rgba(250,248,243,0.16)',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {TRUST.map((t) => (
                    <Stack
                      key={t.label}
                      direction="row"
                      spacing={0.75}
                      sx={{
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 999,
                        bgcolor: 'rgba(250,248,243,0.10)',
                        '& svg': { fontSize: 17, color: '#F3C969' },
                      }}
                    >
                      {t.icon}
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{t.label}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* Wizard */}
            <Box
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: '4px 14px 14px 14px',
                animation: 'b2uFadeUp .55s cubic-bezier(.2,.7,.2,1) both',
                animationDelay: '90ms',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: '0 30px 60px -48px rgba(46,61,47,0.5)',
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
                      label="Roughly how many items are lost at your venue each month?"
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
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pt: 1.5,
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
                        color: INK,
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
                        bgcolor: INK,
                        color: '#F2EFEA',
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
            © {new Date().getFullYear()} Back2u. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
