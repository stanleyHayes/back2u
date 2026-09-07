import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import { Link } from 'react-router-dom';
import { neuShadow } from '@back2u/ui-web';
import { SUBSCRIPTION_PLANS } from '@back2u/shared-types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const PARTNER_URL =
  (import.meta.env.VITE_PARTNER_URL as string | undefined) ?? 'http://localhost:5175';
const icons = {
  free: StorefrontOutlinedIcon,
  pro: ApartmentRoundedIcon,
  enterprise: HubOutlinedIcon,
};
const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);

const FAQS = [
  {
    q: 'What can I do for free?',
    a: 'Create an account, report lost or found items, receive matching suggestions, chat privately, and follow zone alerts. You do not need an institution subscription to use these personal recovery tools.',
  },
  {
    q: 'Are BakPoints money?',
    a: 'No. BakPoints are loyalty points for eligible, verified contributions. They are separate from your Trust Score and from any cash reward offered by an owner. They are not freely convertible to cash.',
  },
  {
    q: 'When can I redeem my points?',
    a: 'Points must clear the applicable verification and review period before redemption. Available partner offers have their own inventory, eligibility and usage limits. Pending or held points are not yet available to spend.',
  },
  {
    q: 'Does a subscription include rewards, tags or delivery?',
    a: 'Owner-funded cash rewards, physical BakTags and courier delivery are separate from the institution subscription price. An optional reward does not automatically increase BakPoints. Check the applicable offer or service terms before proceeding.',
  },
  {
    q: 'How do institution plans work?',
    a: 'Choose a plan for your venue or network and contact our team to arrange onboarding. Existing institution administrators can review their plan in the partner workspace. Confirm service scope and billing terms with the team before starting a paid plan.',
  },
  {
    q: 'Can I join as a Recovery Point or reward partner?',
    a: 'Yes. Community venues, Recovery Points, institutions, transport providers, logistics providers, reward partners and sponsors serve different roles. Tell us how you would like to participate through the partner enquiry form; a partner role is separate from a subscription tier.',
  },
];

export function Pricing() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        '& .MuiButtonBase-root:focus-visible': {
          outline: '3px solid',
          outlineColor: 'primary.main',
          outlineOffset: 4,
        },
      }}
    >
      <Navbar />
      <Box component="main">
        <Container sx={{ pt: { xs: 7, md: 10 }, pb: { xs: 5, md: 7 } }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.14em',
              color: 'primary.main',
              textTransform: 'uppercase',
              mb: 2,
            }}
          >
            Pricing · Ghana’s property recovery network
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 40, md: 68 },
              fontWeight: 600,
              lineHeight: 1.03,
              letterSpacing: '-.055em',
              maxWidth: 800,
            }}
          >
            Finding a way back
            <br />
            starts free.
          </Typography>
          <Typography
            sx={{
              mt: 3,
              maxWidth: 620,
              color: 'text.secondary',
              fontSize: { xs: 16, md: 18 },
              lineHeight: 1.7,
            }}
          >
            Everyday recovery tools for people. Dedicated plans for the places that help bring
            belongings home.
          </Typography>
        </Container>

        <Container sx={{ pb: { xs: 8, md: 11 } }}>
          <Box
            sx={{
              borderRadius: '26px',
              p: { xs: 3, md: 4 },
              mb: { xs: 7, md: 9 },
              bgcolor: 'background.default',
              boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr auto' },
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '12px',
                    color: 'primary.main',
                    boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
                  }}
                >
                  <PersonOutlineRoundedIcon />
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                  FOR INDIVIDUALS
                </Typography>
              </Stack>
              <Typography
                component="h2"
                sx={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.035em' }}
              >
                Your everyday essentials. Free.
              </Typography>
            </Box>
            <Stack spacing={1.25}>
              {[
                'Lost & found reports and matching',
                'Private chat and ownership checks',
                'Zone alerts and eligible BakPoints',
              ].map((feature) => (
                <Stack key={feature} direction="row" spacing={1}>
                  <CheckRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                  <Typography sx={{ fontSize: 14 }}>{feature}</Typography>
                </Stack>
              ))}
            </Stack>
            <Button
              href={`${APP_URL}/register`}
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ borderRadius: '12px', px: 3, py: 1.5, whiteSpace: 'nowrap' }}
            >
              Create an account
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'end',
              gap: 2,
              mb: 4,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'primary.main',
                  letterSpacing: '.12em',
                  mb: 1,
                }}
              >
                FOR VENUES & INSTITUTIONS
              </Typography>
              <Typography
                component="h2"
                sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 600, letterSpacing: '-.04em' }}
              >
                A home for your lost-property desk.
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Monthly plans · Ghana cedis (GHS)
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: { xs: 4, md: 3 },
            }}
          >
            {SUBSCRIPTION_PLANS.map((plan) => {
              const featured = plan.tier === 'pro';
              const Icon = icons[plan.tier];
              // The specification separates BakPoints from cash; do not advertise cash conversion.
              const features = plan.features.filter(
                (feature) => feature !== 'Custom point→cash rates',
              );
              return (
                <Box
                  component="article"
                  aria-label={`${plan.name} institution plan`}
                  key={plan.tier}
                  sx={{
                    p: { xs: 3, lg: 3.5 },
                    borderRadius: '26px',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    bgcolor: featured ? '#2E3D2F' : 'background.default',
                    color: featured ? '#F2EFEA' : 'text.primary',
                    boxShadow: featured
                      ? '12px 12px 25px #15231866, -8px -8px 20px #A8B5A033'
                      : (t) => neuShadow(t.palette.mode, 'raised'),
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
                  >
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: '14px',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: featured
                          ? '5px 5px 10px #1D2A1E, -5px -5px 10px #435545'
                          : (t) => neuShadow(t.palette.mode, 'raised'),
                      }}
                    >
                      <Icon />
                    </Box>
                    <Typography sx={{ fontSize: 10, letterSpacing: '.08em', opacity: 0.8 }}>
                      {featured
                        ? 'FOR GROWING TEAMS'
                        : plan.tier === 'free'
                          ? 'START SMALL'
                          : 'CONNECT YOUR NETWORK'}
                    </Typography>
                  </Stack>
                  <Typography component="h3" sx={{ fontSize: 25, fontWeight: 600 }}>
                    {plan.name}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75, minHeight: 45, mt: 1 }}
                  >
                    {plan.tagline}
                  </Typography>
                  <Box
                    sx={{
                      my: 3,
                      p: 2.25,
                      borderRadius: '15px',
                      boxShadow: featured
                        ? 'inset 5px 5px 10px #1A281C, inset -5px -5px 10px #405443'
                        : (t) => neuShadow(t.palette.mode, 'inset'),
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: 36, lg: 40 },
                        fontWeight: 600,
                        letterSpacing: '-.04em',
                        lineHeight: 1.2,
                      }}
                    >
                      {plan.priceMinor === 0 ? 'Free' : money(plan.priceMinor, plan.currency)}
                    </Typography>
                    <Typography sx={{ mt: 0.75, fontSize: 12, opacity: 0.75 }}>
                      {plan.priceMinor === 0
                        ? 'No monthly subscription fee'
                        : 'per month / institution'}
                    </Typography>
                  </Box>
                  <Stack spacing={1.75} sx={{ flex: 1, mb: 4 }}>
                    {features.map((feature) => (
                      <Stack
                        direction="row"
                        spacing={1}
                        key={feature}
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <CheckRoundedIcon
                          aria-hidden="true"
                          sx={{
                            fontSize: 18,
                            mt: 0.25,
                            flexShrink: 0,
                            color: featured ? '#BCD0B5' : 'primary.main',
                          }}
                        />
                        <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    component={Link}
                    to="/partner"
                    fullWidth
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{
                      borderRadius: '12px',
                      minHeight: 48,
                      color: featured ? '#2E3D2F' : 'text.primary',
                      bgcolor: featured ? '#E5EBE1' : 'background.default',
                      boxShadow: featured
                        ? '5px 5px 12px #18261C88, -4px -4px 10px #4B605044'
                        : (t) => neuShadow(t.palette.mode, 'raised'),
                      '&:hover': { bgcolor: featured ? '#D6E0D0' : 'action.hover' },
                    }}
                  >
                    {plan.tier === 'free' ? 'Start with Starter' : `Discuss ${plan.name}`}
                  </Button>
                </Box>
              );
            })}
          </Box>
          <Typography sx={{ mt: 3.5, color: 'text.secondary', fontSize: 13, lineHeight: 1.7 }}>
            Talk to our team to confirm onboarding, service scope and billing terms. Already a
            partner?{' '}
            <Box
              component="a"
              href={`${PARTNER_URL}/login`}
              sx={{ color: 'primary.main', fontWeight: 600, textUnderlineOffset: 3 }}
            >
              Open your workspace
            </Box>
            .
          </Typography>
        </Container>

        <Container sx={{ pb: { xs: 8, md: 11 } }}>
          <Typography
            component="h2"
            sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 600, letterSpacing: '-.04em', mb: 1 }}
          >
            Know what’s included. Choose what’s extra.
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 4, maxWidth: 650, lineHeight: 1.7 }}>
            Subscriptions, loyalty points and optional recovery costs serve different purposes.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {[
              {
                title: 'BakPoints',
                label: 'EARNED THROUGH VERIFIED CONTRIBUTIONS',
                body: 'Redeem cleared points for eligible partner benefits. Points are not cash, and earning them does not replace ownership or trust checks.',
              },
              {
                title: 'Owner-funded rewards',
                label: 'OPTIONAL · SEPARATE FROM POINTS',
                body: 'An owner can choose to offer a cash reward. The offer and applicable processing terms are separate from subscription fees and BakPoints.',
              },
              {
                title: 'BakTags & delivery',
                label: 'OPTIONAL SERVICES',
                body: 'Physical tags and courier delivery are separate purchases or services. Check current availability, prices and terms when you choose them.',
              },
            ].map((item) => (
              <Box
                key={item.title}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '.07em',
                    color: 'primary.main',
                    mb: 1.5,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography component="h3" sx={{ fontSize: 21, fontWeight: 600, mb: 1.5 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: 'text.secondary' }}>
                  {item.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>

        <Container maxWidth="md" sx={{ pb: { xs: 8, md: 12 } }}>
          <Typography
            component="h2"
            sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 600, letterSpacing: '-.04em', mb: 4 }}
          >
            Before you get started.
          </Typography>
          <Stack spacing={2}>
            {FAQS.map((faq) => (
              <Accordion
                key={faq.q}
                disableGutters
                sx={{
                  bgcolor: 'background.default',
                  borderRadius: '14px !important',
                  boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<AddRoundedIcon />}
                  sx={{
                    px: { xs: 2.5, sm: 3 },
                    minHeight: 72,
                    gap: 2,
                    '& .MuiAccordionSummary-content': { my: 2 },
                    '& .MuiAccordionSummary-expandIconWrapper': { flexShrink: 0 },
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{faq.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2.5, sm: 3 }, pt: 0, pb: 3 }}>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: 14 }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
