import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@back2u/ui-web';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';

interface PricingTier {
  name: string;
  price: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  highlighted?: boolean;
  disabled?: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: 'Free forever',
    features: [
      'Post lost & found items',
      'AI matching',
      'Anonymous chat',
      'Geo-fenced alerts',
      'Basic verification',
    ],
    ctaLabel: 'Get started',
    ctaHref: `${APP_URL}/register`,
  },
  {
    name: 'Premium',
    price: '₵19 / month',
    features: [
      'Everything in Free',
      'Priority AI matching',
      'Courier service access',
      'Memory vault (unlimited entries)',
      'Custom QR tags (5/month)',
    ],
    ctaLabel: 'Coming soon',
    highlighted: true,
    disabled: true,
  },
  {
    name: 'Institution',
    price: 'Custom',
    features: [
      'White-label portal',
      'Admin dashboard',
      'Analytics & reports',
      'API access',
      'Dedicated support',
    ],
    ctaLabel: 'Contact us',
    ctaHref: '/partner',
  },
];

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'The Free plan is free forever — no credit card required. Premium will include a 14-day trial when it launches.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can downgrade or cancel your subscription at any time with no hidden fees.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer refunds within 7 days of your first Premium payment if you are not satisfied.',
  },
];

export function Pricing() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
            component={Link} to="/"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            size={isMobile ? 'small' : 'medium'}
          >
            Back to home
          </Button>
        </Container>
      </Box>

      {/* Main */}
      <Box component="main" sx={{ flex: 1 }}>
        {/* Title */}
        <Container sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          <Typography
            variant="h1"
            fontSize={{ xs: 32, md: 48 }}
            fontWeight={800}
            gutterBottom
          >
            Simple, transparent pricing
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            maxWidth={640}
            mx="auto"
            fontSize={{ xs: 16, md: 20 }}
          >
            Free for individuals. Premium features for power users and
            institutions.
          </Typography>
        </Container>

        {/* Pricing Cards */}
        <Container sx={{ pb: { xs: 6, md: 10 } }}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }}
            gap={3}
            alignItems="stretch"
          >
            {TIERS.map((tier) => (
              <Card
                key={tier.name}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  border: tier.highlighted
                    ? `2px solid ${theme.palette.primary.main}`
                    : 1,
                  borderColor: tier.highlighted
                    ? theme.palette.primary.main
                    : 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {tier.highlighted && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      px: 2,
                      py: 0.5,
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Most Popular
                  </Box>
                )}
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    p: { xs: 3, md: 4 },
                    '&:last-child': { pb: { xs: 3, md: 4 } },
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    textAlign="center"
                    gutterBottom
                  >
                    {tier.name}
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    textAlign="center"
                    color="primary.main"
                    gutterBottom
                  >
                    {tier.price}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1.5} sx={{ flex: 1, mb: 3 }}>
                    {tier.features.map((feature) => (
                      <Stack
                        key={feature}
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <CheckCircleIcon
                          color="primary"
                          fontSize="small"
                          sx={{ mt: 0.25, flexShrink: 0 }}
                        />
                        <Typography variant="body2">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  {tier.disabled ? (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled
                    >
                      {tier.ctaLabel}
                    </Button>
                  ) : (
                    <Button
                      variant={tier.highlighted ? 'contained' : 'outlined'}
                      color="primary"
                      fullWidth
                      href={tier.ctaHref}
                    >
                      {tier.ctaLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>

        {/* FAQ */}
        <Box sx={{ bgcolor: 'background.default', py: { xs: 6, md: 10 } }}>
          <Container maxWidth="md">
            <Typography
              variant="h2"
              fontSize={{ xs: 24, md: 32 }}
              fontWeight={700}
              textAlign="center"
              gutterBottom
            >
              Frequently asked questions
            </Typography>
            <Stack spacing={3} mt={4}>
              {FAQS.map((faq) => (
                <Box key={faq.q}>
                  <Typography fontWeight={700} gutterBottom>
                    {faq.q}
                  </Typography>
                  <Typography color="text.secondary">{faq.a}</Typography>
                </Box>
              ))}
            </Stack>
          </Container>
        </Box>
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
