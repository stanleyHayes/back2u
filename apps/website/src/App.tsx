import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PartnerLogos } from './components/PartnerLogos';
import { PushNotifyDemo } from './components/PushNotifyDemo';
import { QRTagPromo } from './components/QRTagPromo';
import { SuccessStories } from './components/SuccessStories';
import { RewardPartnersSection } from './components/RewardPartnersSection';
import { ReferralBanner } from './components/ReferralBanner';
import { CookieConsent } from './components/CookieConsent';
import { AppStoreBadges } from './components/AppStoreBadges';
import { Pricing } from './pages/Pricing';
import { PartnerForm } from './pages/PartnerForm';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Download } from './pages/Download';
import { MapEmbed } from './pages/MapEmbed';
import { NotFound } from './pages/NotFound';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';

interface FeatureFlagDTO {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedUserIds: string[];
}

function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlagDTO[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/v1/features`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setFlags(json?.data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return flags;
}

function isFlagEnabled(flags: FeatureFlagDTO[], key: string): boolean {
  const f = flags.find((x) => x.key === key);
  if (!f) return false;
  return f.enabled && f.rolloutPercentage >= 100;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const FEATURES = [
  {
    title: 'AI matching',
    body: 'Visual + text + geo + time correlation. Suggested matches with confidence scores.',
  },
  {
    title: 'Geo-fenced alerts',
    body: 'Get notified when someone reports a found item near where you lost yours.',
  },
  {
    title: 'Proof of ownership',
    body: 'Verification flow with receipt photos and item-specific questions.',
  },
  {
    title: 'Rewards & points',
    body: 'Set a reward, build reputation, redeem points at partner institutions.',
  },
  { title: 'QR tag ecosystem', body: 'Branded keychain stickers that bridge offline and online.' },
  { title: 'Anonymous chat', body: 'Auto-moderated in-app chat — no phone numbers shared.' },
];

const STEPS = [
  {
    step: '01',
    title: 'Snap & Post',
    body: 'Take a photo, describe your item, and drop a pin on the map. It takes 30 seconds.',
  },
  {
    step: '02',
    title: 'AI Matches',
    body: 'Our AI correlates images, text, location, and time to surface the most likely matches.',
  },
  {
    step: '03',
    title: 'Reunite',
    body: 'Verify ownership, chat anonymously, and arrange pickup or courier delivery.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ama K.',
    role: 'Accra',
    quote:
      'I left my laptop in a taxi. Back2u matched it within 2 hours. The verification flow made me feel safe.',
  },
  {
    name: 'Kofi B.',
    role: 'University Student',
    quote:
      'The QR tag on my backpack saved me twice. Someone scanned it and I got an alert immediately.',
  },
  {
    name: 'Nana O.',
    role: 'Mall Security',
    quote: 'We onboarded our mall as a partner. Lost items get returned 4× faster now.',
  },
];

const FAQS = [
  {
    q: 'Is Back2u free to use?',
    a: 'Yes. Posting items, browsing matches, and chatting are free. Rewards and courier services involve optional fees set by users.',
  },
  {
    q: 'How does AI matching work?',
    a: 'We combine visual similarity (perceptual hashing), text embeddings, geospatial proximity, and temporal correlation to rank possible matches.',
  },
  {
    q: 'Is my personal information shared?',
    a: 'Never. Chat is anonymous. Your phone number and email are only visible to you and verified admins.',
  },
  {
    q: 'What are QR tags?',
    a: 'Waterproof stickers with a unique code. When scanned, they show a contact form without revealing your identity.',
  },
  {
    q: 'Can institutions partner with Back2u?',
    a: 'Absolutely. Universities, malls, airports, and transit hubs can onboard to manage lost & found at scale.',
  },
];

const FALLBACK_TICKER = [
  { kind: 'found' as const, title: 'iPhone 14', place: 'Accra Mall' },
  { kind: 'lost' as const, title: 'House keys', place: 'University of Ghana' },
  { kind: 'found' as const, title: 'Blue backpack', place: 'Kotoka Airport' },
  { kind: 'lost' as const, title: 'AirPods Pro', place: 'Osu, Accra' },
  { kind: 'found' as const, title: 'Student ID card', place: 'KNUST Campus' },
  { kind: 'lost' as const, title: 'Brown leather wallet', place: 'Kaneshie Market' },
  { kind: 'found' as const, title: 'Car key fob', place: 'Kumasi City Mall' },
  { kind: 'lost' as const, title: 'Gold bracelet', place: 'Labadi Beach' },
];

interface Stats {
  items: number;
  reunited: number;
  institutions: number;
}

interface ItemPreview {
  id: string;
  title: string;
  kind: 'lost' | 'found';
  category: string;
  place: { name: string };
  images: { url: string }[];
  createdAt: string;
}

function useStats() {
  const [stats, setStats] = useState<Stats>({ items: 12400, reunited: 3850, institutions: 48 });
  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const [itemsRes, leaderboardRes, institutionsRes] = await Promise.all([
          fetch(`${API_URL}/v1/items?pageSize=1`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_URL}/v1/leaderboard?limit=1`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_URL}/v1/institutions`).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (cancelled) return;
        const items = itemsRes?.data?.total ?? stats.items;
        const reunited = (leaderboardRes?.data?.length ?? 0) * 12 + stats.reunited;
        const institutions = institutionsRes?.data?.length ?? stats.institutions;
        setStats({ items, reunited, institutions });
      } catch {
        // keep fallback stats
      }
    }
    fetchStats();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return stats;
}

function useRecentItems() {
  const [items, setItems] = useState<ItemPreview[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      try {
        const res = await fetch(`${API_URL}/v1/items?pageSize=8&status=open`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setItems((json.data?.items ?? []).slice(0, 8));
      } catch {
        // ignore
      }
    }
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, []);
  return items;
}

/** Toggle `.is-in` on `[data-reveal]` elements as they scroll into view. */
function useReveal(dep: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((e) => e.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function HeroRadar() {
  return (
    <Box
      className="b2u-radar"
      aria-hidden
      sx={{ width: { xs: 300, sm: 380, md: 'min(100%, 460px)' }, mx: 'auto', position: 'relative' }}
    >
      {/* concentric rings */}
      {[100, 74, 48].map((p) => (
        <Box
          key={p}
          className="b2u-radar__ring"
          sx={{ inset: `${(100 - p) / 2}%`, opacity: 0.25 + (p / 100) * 0.2 }}
        />
      ))}
      <Box className="b2u-radar__pulse" />
      {/* center pin */}
      <Box
        className="b2u-pin"
        sx={{
          width: { xs: 92, md: 112 },
          height: { xs: 92, md: 112 },
          borderRadius: '50% 50% 50% 8px',
          background: 'linear-gradient(150deg, #0F766E, #14B8A6)',
          transform: 'rotate(-45deg)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 26px 50px -20px rgba(11,61,56,.7)',
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            bgcolor: PAPER,
            transform: 'rotate(45deg)',
          }}
        />
      </Box>
      {/* floating match chips */}
      <Box
        className="b2u-chip-float"
        sx={{
          position: 'absolute',
          top: '8%',
          right: '-4%',
          px: 1.6,
          py: 1,
          borderRadius: 3,
          bgcolor: '#FFFDF8',
          border: '1px solid rgba(11,61,56,.1)',
          boxShadow: '0 18px 36px -22px rgba(11,61,56,.6)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0F766E' }} />
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: INK, lineHeight: 1.1 }}>
            Match found
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#3C544F' }}>98% confidence</Typography>
        </Box>
      </Box>
      <Box
        className="b2u-chip-float delay"
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '-6%',
          px: 1.6,
          py: 1,
          borderRadius: 3,
          bgcolor: INK,
          color: '#FFFDF8',
          boxShadow: '0 18px 36px -22px rgba(11,61,56,.8)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#E0A106' }} />
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Found near Accra Mall</Typography>
      </Box>
    </Box>
  );
}

function Ticker({ items }: { items: ItemPreview[] }) {
  const data =
    items.length > 0
      ? items.map((it) => ({ kind: it.kind, title: it.title, place: it.place.name }))
      : FALLBACK_TICKER;
  const loop = [...data, ...data];
  return (
    <Box
      aria-hidden
      sx={{
        borderBlock: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        bgcolor: 'rgba(255,253,248,0.5)',
      }}
    >
      <Box className="b2u-marquee">
        <Box className="b2u-marquee__track">
          {loop.map((it, i) => (
            <Box
              key={i}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.2,
                px: 2.5,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: it.kind === 'found' ? '#0F766E' : '#C2410C',
                }}
              />
              <Typography
                component="span"
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: it.kind === 'found' ? '#0F766E' : '#C2410C',
                }}
              >
                {it.kind}
              </Typography>
              <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: INK }}>
                {it.title}
              </Typography>
              <Typography component="span" sx={{ fontSize: 14, color: '#3C544F' }}>
                · {it.place}
              </Typography>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'rgba(11,61,56,.25)',
                  ml: 1.5,
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function Kicker({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box component="span" className="b2u-eyebrow" sx={sx}>
      {children}
    </Box>
  );
}

function LandingPage() {
  const { t } = useTranslation();
  const stats = useStats();
  const recentItems = useRecentItems();
  const featureFlags = useFeatureFlags();
  const qrTagPromoEnabled = isFlagEnabled(featureFlags, 'qr_tag_promo');
  useReveal(recentItems.length);

  return (
    <Box>
      <Navbar />

      <Box component="main">
        {/* Hero */}
        <Container sx={{ pt: { xs: 7, md: 12 }, pb: { xs: 6, md: 10 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.12fr 0.88fr' },
              gap: { xs: 6, md: 5 },
              alignItems: 'center',
            }}
          >
            <Box>
              <Box className="b2u-rise b2u-d1">
                <Kicker>Smart lost &amp; found · Ghana &amp; beyond</Kicker>
              </Box>
              <Typography
                className="b2u-display b2u-rise b2u-d2"
                component="h1"
                sx={{
                  mt: 2.5,
                  fontWeight: 600,
                  fontSize: { xs: 44, sm: 58, md: 76 },
                  lineHeight: 1.0,
                  letterSpacing: '-0.03em',
                  color: INK,
                }}
              >
                {t('hero.title')}
              </Typography>
              {/* hand-drawn marigold underline */}
              <svg
                className="b2u-rise b2u-d3"
                aria-hidden
                viewBox="0 0 360 18"
                fill="none"
                style={{ marginTop: 8, width: '100%', maxWidth: 360, display: 'block' }}
              >
                <path
                  d="M3 12C66 5 150 4 210 7c40 2 90 5 147 2"
                  stroke="#E0A106"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </svg>
              <Typography
                className="b2u-rise b2u-d3"
                sx={{
                  mt: 3,
                  fontSize: { xs: 17, md: 19 },
                  color: 'text.secondary',
                  maxWidth: 540,
                  lineHeight: 1.6,
                }}
              >
                {t('hero.subtitle')}
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ mt: 4 }}
                className="b2u-rise b2u-d4"
              >
                <Button
                  size="large"
                  variant="contained"
                  color="secondary"
                  href={`${APP_URL}/post?kind=lost`}
                >
                  {t('cta.postLost')}
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  color="inherit"
                  href={`${APP_URL}/post?kind=found`}
                  sx={{ color: 'text.primary' }}
                >
                  {t('cta.foundSomething')}
                </Button>
              </Stack>
              <Box className="b2u-rise b2u-d5" sx={{ mt: 4 }}>
                <AppStoreBadges />
              </Box>
            </Box>

            <Box className="b2u-rise b2u-d3" sx={{ order: { xs: -1, md: 0 } }}>
              <HeroRadar />
            </Box>
          </Box>
        </Container>

        {/* Live ticker */}
        <Ticker items={recentItems} />

        {/* Stats — ink band */}
        <Box
          component="section"
          aria-labelledby="stats-heading"
          sx={{
            position: 'relative',
            bgcolor: INK,
            color: PAPER,
            py: { xs: 7, md: 9 },
            overflow: 'hidden',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(40rem 30rem at 85% 120%, rgba(224,161,6,0.22), transparent 60%), radial-gradient(36rem 30rem at 5% -20%, rgba(20,184,166,0.18), transparent 60%)',
            }}
          />
          <Container sx={{ position: 'relative' }}>
            <Typography
              id="stats-heading"
              component="h2"
              sx={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,253,248,0.65)',
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              The reunion engine, by the numbers
            </Typography>
            <Box
              data-reveal
              className="b2u-reveal"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: { xs: 4, sm: 2 },
              }}
            >
              {[
                { n: `${stats.items.toLocaleString()}+`, l: 'Items posted' },
                { n: `${stats.reunited.toLocaleString()}+`, l: 'Successful reunions' },
                { n: `${stats.institutions}`, l: 'Partner institutions' },
              ].map((s, i) => (
                <Box
                  key={s.l}
                  sx={{
                    textAlign: { xs: 'center', sm: 'left' },
                    pl: { sm: i === 0 ? 0 : 4 },
                    borderLeft: {
                      xs: 'none',
                      sm: i === 0 ? 'none' : '1px solid rgba(255,253,248,0.16)',
                    },
                  }}
                >
                  <Typography
                    className="b2u-display"
                    sx={{
                      fontSize: { xs: 52, md: 68 },
                      fontWeight: 600,
                      lineHeight: 1,
                      color: PAPER,
                    }}
                  >
                    {s.n}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 14,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,253,248,0.7)',
                    }}
                  >
                    {s.l}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Partner logos (inherits theme) */}
        <PartnerLogos />

        {/* Recent activity */}
        {recentItems.length > 0 && (
          <Container sx={{ py: { xs: 8, md: 12 } }}>
            <Box data-reveal className="b2u-reveal" sx={{ mb: 5 }}>
              <Kicker>Live right now</Kicker>
              <Typography
                className="b2u-display"
                component="h2"
                sx={{ mt: 2, fontSize: { xs: 30, md: 44 }, fontWeight: 600 }}
              >
                Real items, posted minutes ago
              </Typography>
            </Box>
            <Box
              data-reveal
              className="b2u-reveal"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' },
                gap: 2.5,
              }}
            >
              {recentItems.slice(0, 6).map((it) => {
                const isFound = it.kind === 'found';
                return (
                  <Box
                    key={it.id}
                    sx={{
                      p: 1.25,
                      // brand "tag" card — one sharp corner like the pin logo
                      borderRadius: '24px 24px 24px 6px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      transition: 'transform .2s, box-shadow .2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 26px 46px -30px rgba(11,61,56,.5)',
                      },
                    }}
                  >
                    {/* Inset image with its own rounded frame */}
                    <Box
                      sx={{
                        position: 'relative',
                        height: 184,
                        borderRadius: '18px 18px 18px 4px',
                        overflow: 'hidden',
                        bgcolor: isFound ? 'rgba(15,118,110,0.08)' : 'rgba(194,65,12,0.08)',
                      }}
                    >
                      {it.images[0]?.url ? (
                        <Box
                          component="img"
                          src={it.images[0].url}
                          alt={`${it.kind.toUpperCase()}: ${it.title} at ${it.place.name}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: 'grid',
                            placeItems: 'center',
                            height: '100%',
                            color: 'text.secondary',
                            fontSize: 14,
                          }}
                        >
                          No photo
                        </Box>
                      )}
                      {/* kind badge */}
                      <Box
                        component="span"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          px: 1.2,
                          py: 0.4,
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#FFFDF8',
                          bgcolor: isFound ? '#0F766E' : '#C2410C',
                          boxShadow: '0 6px 14px -8px rgba(11,61,56,.8)',
                        }}
                      >
                        {it.kind}
                      </Box>
                      {/* posted-time chip */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.4,
                          px: 1,
                          py: 0.35,
                          borderRadius: 999,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: INK,
                          bgcolor: 'rgba(251,246,236,0.92)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <ScheduleIcon sx={{ fontSize: 13 }} />
                        {timeAgo(it.createdAt)}
                      </Box>
                    </Box>

                    <Box sx={{ px: 0.75, pt: 1.5, pb: 0.5 }}>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          px: 1.2,
                          py: 0.3,
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'text.secondary',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {it.category}
                      </Box>
                      <Typography noWrap sx={{ mt: 1, fontWeight: 700, fontSize: 18, color: INK }}>
                        {it.title}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25 }}>
                        <PlaceOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {it.place.name}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ mt: 5 }}>
              <Button
                variant="outlined"
                color="inherit"
                href={`${APP_URL}/feed`}
                sx={{ color: 'text.primary' }}
              >
                Browse all items →
              </Button>
            </Box>
          </Container>
        )}

        {/* How it works */}
        <Box sx={{ py: { xs: 8, md: 13 } }}>
          <Container>
            <Box
              data-reveal
              className="b2u-reveal"
              sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}
            >
              <Kicker sx={{ justifyContent: 'center' }}>How it works</Kicker>
              <Typography
                className="b2u-display"
                component="h2"
                sx={{ mt: 2, fontSize: { xs: 32, md: 50 }, fontWeight: 600 }}
              >
                From lost to found in three steps
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: { xs: 5, md: 4 },
              }}
            >
              {/* connecting line on desktop */}
              <Box
                aria-hidden
                sx={{
                  display: { xs: 'none', md: 'block' },
                  position: 'absolute',
                  top: 38,
                  left: '16%',
                  right: '16%',
                  height: '1px',
                  bgcolor: 'divider',
                }}
              />
              {STEPS.map((s, i) => (
                <Box
                  key={s.step}
                  data-reveal
                  className="b2u-reveal"
                  sx={{ position: 'relative', textAlign: { xs: 'left', md: 'center' } }}
                >
                  <Box
                    className="b2u-display"
                    sx={{
                      width: 76,
                      height: 76,
                      mx: { md: 'auto' },
                      borderRadius: '50%',
                      bgcolor: 'background.default',
                      border: '1.5px solid',
                      borderColor: 'divider',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 30,
                      fontWeight: 600,
                      color: i === 1 ? '#C2410C' : '#0F766E',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {s.step}
                  </Box>
                  <Typography
                    className="b2u-display"
                    sx={{ mt: 2.5, fontSize: 24, fontWeight: 600, color: INK }}
                  >
                    {s.title}
                  </Typography>
                  <Typography
                    sx={{ mt: 1, color: 'text.secondary', maxWidth: 320, mx: { md: 'auto' } }}
                  >
                    {s.body}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        {/* QR + push demos (inherit theme) */}
        {qrTagPromoEnabled && <QRTagPromo />}
        <PushNotifyDemo />

        {/* Features — editorial grid */}
        <Container sx={{ py: { xs: 8, md: 13 } }}>
          <Box data-reveal className="b2u-reveal" sx={{ maxWidth: 620, mb: { xs: 5, md: 7 } }}>
            <Kicker>Why Back2u</Kicker>
            <Typography
              className="b2u-display"
              component="h2"
              sx={{ mt: 2, fontSize: { xs: 32, md: 50 }, fontWeight: 600 }}
            >
              Built for real-world chaos
            </Typography>
            <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 18 }}>
              From busy taxi ranks to crowded campuses — every feature earns its place.
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' },
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {FEATURES.map((f, i) => (
              <Box
                key={f.title}
                data-reveal
                className="b2u-reveal"
                sx={{
                  p: { xs: 3, md: 4 },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  borderRight: { md: (i + 1) % 3 === 0 ? 'none' : '1px solid' },
                  borderRightColor: { md: 'divider' },
                  transition: 'background .2s',
                  '&:hover': { bgcolor: 'rgba(15,118,110,0.04)' },
                }}
              >
                <Typography
                  className="b2u-display"
                  sx={{ fontSize: 15, fontWeight: 600, color: '#C2410C', letterSpacing: '0.05em' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                <Typography
                  className="b2u-display"
                  sx={{ mt: 1.5, fontSize: 22, fontWeight: 600, color: INK }}
                >
                  {f.title}
                </Typography>
                <Typography sx={{ mt: 1, color: 'text.secondary' }}>{f.body}</Typography>
              </Box>
            ))}
          </Box>
        </Container>

        {/* Reward partners that opted in to accept points */}
        <RewardPartnersSection />

        {/* Success stories + referral (inherit theme) */}
        <SuccessStories />
        <ReferralBanner />

        {/* Testimonials — pull quotes */}
        <Container sx={{ py: { xs: 8, md: 13 } }}>
          <Box
            data-reveal
            className="b2u-reveal"
            sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}
          >
            <Kicker sx={{ justifyContent: 'center' }}>Loved by finders &amp; owners</Kicker>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {TESTIMONIALS.map((tm, i) => (
              <Box
                key={tm.name}
                data-reveal
                className="b2u-reveal"
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3.5,
                  borderRadius: 2,
                  bgcolor: i === 1 ? INK : 'background.paper',
                  color: i === 1 ? PAPER : 'text.primary',
                  border: '1px solid',
                  borderColor: i === 1 ? 'transparent' : 'divider',
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    fontSize: 40,
                    lineHeight: 1,
                    fontWeight: 700,
                    color: '#E0A106',
                    mb: 1.5,
                  }}
                >
                  &ldquo;
                </Box>
                <Typography sx={{ fontSize: 17, lineHeight: 1.55, flex: 1 }}>{tm.quote}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      bgcolor: i === 1 ? 'rgba(224,161,6,0.2)' : 'rgba(11,61,56,0.08)',
                      color: i === 1 ? '#E0A106' : INK,
                    }}
                  >
                    {tm.name.replace(/[^A-Z]/g, '').slice(0, 2)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
                      {tm.name}
                    </Typography>
                    <Typography sx={{ fontSize: 13, opacity: 0.7 }}>{tm.role}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>

        {/* FAQ */}
        <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
          <Box data-reveal className="b2u-reveal" sx={{ mb: 4 }}>
            <Kicker>Questions</Kicker>
            <Typography
              className="b2u-display"
              component="h2"
              sx={{ mt: 2, fontSize: { xs: 30, md: 44 }, fontWeight: 600 }}
            >
              Good to know
            </Typography>
          </Box>
          <Box data-reveal className="b2u-reveal">
            {FAQS.map((faq) => (
              <Accordion key={faq.q} disableGutters>
                <AccordionSummary expandIcon={<FaqIcon />}>
                  <Typography
                    className="b2u-display"
                    sx={{ fontSize: 19, fontWeight: 600, color: INK }}
                  >
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ color: 'text.secondary', fontSize: 16 }}>{faq.a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>

        {/* CTA — ink band */}
        <Box sx={{ px: 2, pb: { xs: 6, md: 10 } }}>
          <Container disableGutters maxWidth="lg">
            <Box
              data-reveal
              className="b2u-reveal"
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: { xs: 2, md: 3 },
                bgcolor: INK,
                color: PAPER,
                px: { xs: 3, md: 10 },
                py: { xs: 7, md: 11 },
                textAlign: 'center',
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(30rem 24rem at 80% 120%, rgba(224,161,6,0.28), transparent 60%), radial-gradient(26rem 22rem at 10% -10%, rgba(20,184,166,0.22), transparent 60%)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Typography
                  className="b2u-display"
                  component="h2"
                  sx={{ fontSize: { xs: 34, md: 56 }, fontWeight: 600, maxWidth: 760, mx: 'auto' }}
                >
                  Whatever you&apos;ve lost, let&apos;s get it back to you.
                </Typography>
                <Typography
                  sx={{
                    mt: 2.5,
                    fontSize: 18,
                    color: 'rgba(255,253,248,0.78)',
                    maxWidth: 520,
                    mx: 'auto',
                  }}
                >
                  Join thousands across Ghana who trust Back2u to reunite them with what matters.
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ justifyContent: 'center', mt: 4 }}
                >
                  <Button
                    size="large"
                    variant="contained"
                    color="secondary"
                    href={`${APP_URL}/register`}
                  >
                    Get started free
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    href={`${APP_URL}/feed`}
                    sx={{
                      color: PAPER,
                      borderColor: 'rgba(255,253,248,0.4)',
                      '&:hover': { borderColor: PAPER, bgcolor: 'rgba(255,253,248,0.08)' },
                    }}
                  >
                    Browse items
                  </Button>
                </Stack>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <AppStoreBadges tone="dark" />
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}

function FaqIcon() {
  return (
    <Box sx={{ position: 'relative', width: 22, height: 22, color: 'text.secondary' }}>
      <AddIcon
        sx={{
          position: 'absolute',
          inset: 0,
          fontSize: 22,
          opacity: 1,
          '.Mui-expanded &': { opacity: 0 },
        }}
      />
      <RemoveIcon
        sx={{
          position: 'absolute',
          inset: 0,
          fontSize: 22,
          opacity: 0,
          '.Mui-expanded &': { opacity: 1 },
        }}
      />
    </Box>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/partner" element={<PartnerForm />} />
        <Route path="/download" element={<Download />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/map" element={<MapEmbed />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
}
