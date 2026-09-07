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
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import { alpha } from '@mui/material/styles';
import RemoveIcon from '@mui/icons-material/Remove';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { neuShadow } from '@back2u/ui-web';

import { AppStoreBadges } from './components/AppStoreBadges';
import { LandingHero } from './components/LandingHero';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PartnerLogos } from './components/PartnerLogos';
import { PushNotifyDemo } from './components/PushNotifyDemo';
import { QRTagPromo } from './components/QRTagPromo';
import { SuccessStories } from './components/SuccessStories';
import { RewardPartnersSection } from './components/RewardPartnersSection';
import { ReferralBanner } from './components/ReferralBanner';
import { CookieConsent } from './components/CookieConsent';
import { Pricing } from './pages/Pricing';
import { PartnerForm } from './pages/PartnerForm';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Download } from './pages/Download';
import { MapEmbed } from './pages/MapEmbed';
import { NotFound } from './pages/NotFound';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

const INK = '#2E3D2F';
const PAPER = '#F2EFEA';
const FOREST_NEU_SHADOW = '8px 8px 18px #182319, -8px -8px 18px #405443';
const FOREST_NEU_INSET = 'inset 4px 4px 9px #182319, inset -4px -4px 9px #405443';

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
    highlight: 'Matched in 2 hours',
    category: 'AI matching',
    quote:
      'I left my laptop in a taxi. bak2me matched it within 2 hours. The verification flow made me feel safe.',
  },
  {
    name: 'Kofi B.',
    role: 'University Student',
    highlight: 'One scan. Instant relief.',
    category: 'QR tags',
    quote:
      'The QR tag on my backpack saved me twice. Someone scanned it and I got an alert immediately.',
  },
  {
    name: 'Nana O.',
    role: 'Mall Security',
    highlight: 'Returned 4× faster',
    category: 'Partner experience',
    quote: 'We onboarded our mall as a partner. Lost items get returned 4× faster now.',
  },
];

const FAQS = [
  {
    q: 'Is bak2me free to use?',
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
    q: 'Can institutions partner with bak2me?',
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
    els.forEach((e) => {
      const siblings = e.parentElement
        ? Array.from(e.parentElement.children).filter((child) => child.hasAttribute('data-reveal'))
        : [];
      e.style.transitionDelay = `${Math.min(siblings.indexOf(e), 4) * 65}ms`;
      io.observe(e);
    });
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
        bgcolor: 'rgba(250,248,243,0.5)',
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
                  bgcolor: it.kind === 'found' ? '#40614A' : '#C2410C',
                }}
              />
              <Typography
                component="span"
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: it.kind === 'found' ? '#40614A' : '#C2410C',
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
                  bgcolor: 'rgba(46,61,47,.25)',
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
        <LandingHero appUrl={APP_URL} />

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
                'radial-gradient(40rem 30rem at 85% 120%, rgba(139,111,78,0.22), transparent 60%), radial-gradient(36rem 30rem at 5% -20%, rgba(126,154,130,0.18), transparent 60%)',
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
                color: 'rgba(250,248,243,0.65)',
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
                      sm: i === 0 ? 'none' : '1px solid rgba(250,248,243,0.16)',
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
                      color: 'rgba(250,248,243,0.7)',
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
                    component="article"
                    aria-label={it.title}
                    sx={{
                      p: 1.5,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '22px',
                      bgcolor: 'background.default',
                      boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
                    }}
                  >
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '16px',
                        boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          aspectRatio: '16 / 10',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                        }}
                      >
                        {it.images[0]?.url ? (
                          <Box
                            component="img"
                            src={it.images[0].url}
                            alt={`${it.title} at ${it.place.name}`}
                            loading="lazy"
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
                            No photo available
                          </Box>
                        )}
                        <Box
                          component="span"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            px: 1.25,
                            py: 0.6,
                            borderRadius: '8px',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '.1em',
                            textTransform: 'uppercase',
                            color: '#fff',
                            bgcolor: isFound ? '#40614A' : '#A63D17',
                            boxShadow: '0 3px 9px #00000030',
                          }}
                        >
                          {it.kind}
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        px: 1,
                        pt: 2.5,
                        pb: 1,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1.25,
                          justifyContent: 'space-between',
                          mb: 1.75,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            px: 1.25,
                            py: 0.6,
                            borderRadius: '8px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'text.secondary',
                            bgcolor: 'background.default',
                            boxShadow: (t) =>
                              t.palette.mode === 'dark'
                                ? '3px 3px 6px #050905, -3px -3px 6px #4A5D3E66'
                                : '3px 3px 6px #C6BFB499, -3px -3px 6px #FFFFFFE6',
                          }}
                        >
                          {it.category}
                        </Box>
                        <Box
                          component="time"
                          dateTime={it.createdAt}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'text.secondary',
                            fontSize: 11,
                          }}
                        >
                          <ScheduleIcon aria-hidden="true" sx={{ fontSize: 14 }} />
                          {timeAgo(it.createdAt)}
                        </Box>
                      </Box>
                      <Typography
                        component="h3"
                        sx={{
                          fontFamily: 'inherit',
                          fontWeight: 600,
                          fontSize: 19,
                          lineHeight: 1.4,
                          letterSpacing: '-.025em',
                          color: 'text.primary',
                          overflowWrap: 'anywhere',
                          mb: 2.5,
                          flex: 1,
                        }}
                      >
                        {it.title}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.25,
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: (t) => alpha(t.palette.text.primary, 0.09),
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
                          }}
                        >
                          <PlaceOutlinedIcon
                            aria-hidden="true"
                            sx={{ fontSize: 17, color: 'text.secondary' }}
                          />
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: 'text.secondary',
                            overflowWrap: 'anywhere',
                            minWidth: 0,
                          }}
                        >
                          {it.place.name}
                        </Typography>
                      </Box>
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
                      bgcolor: 'background.paper',
                      border: 'none',
                      boxShadow: (t) =>
                        neuShadow(t.palette.mode === 'dark' ? 'dark' : 'light', 'raised'),
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 30,
                      fontWeight: 600,
                      color: i === 1 ? '#C2410C' : '#40614A',
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
            <Kicker>Why bak2me</Kicker>
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
                  '&:hover': { bgcolor: 'rgba(64,97,74,0.04)' },
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
                component="article"
                aria-label={`${tm.name}’s testimonial`}
                data-reveal
                className="b2u-reveal"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: '20px',
                  bgcolor: i === 1 ? INK : 'background.default',
                  color: i === 1 ? PAPER : 'text.primary',
                  boxShadow:
                    i === 1
                      ? '10px 10px 24px rgba(25,35,26,.40), -8px -8px 20px rgba(255,255,255,.35)'
                      : (t) => neuShadow(t.palette.mode, 'raised'),
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      borderRadius: '12px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: i === 1 ? INK : 'background.default',
                      color: i === 1 ? '#C8B394' : 'text.secondary',
                      boxShadow:
                        i === 1
                          ? FOREST_NEU_SHADOW
                          : (t) =>
                              t.palette.mode === 'dark'
                                ? '4px 4px 8px #050905, -4px -4px 8px #4A5D3E66'
                                : '4px 4px 8px #C6BFB4AA, -4px -4px 8px #FFFFFFE6',
                    }}
                  >
                    <FormatQuoteRoundedIcon
                      aria-hidden="true"
                      sx={{ fontSize: 24, transform: 'rotate(180deg)' }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      opacity: 0.75,
                      textAlign: 'right',
                    }}
                  >
                    {tm.category}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 1.75,
                    borderRadius: '12px',
                    mb: 3,
                    boxShadow:
                      i === 1 ? FOREST_NEU_INSET : (t) => neuShadow(t.palette.mode, 'inset'),
                  }}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: 'inherit',
                      fontSize: 21,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      letterSpacing: '-.025em',
                    }}
                  >
                    {tm.highlight}
                  </Typography>
                </Box>
                <Box component="blockquote" sx={{ m: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 16, lineHeight: 1.8 }}>{tm.quote}</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mt: 3,
                    pt: 2.5,
                    borderTop: '1px solid',
                    borderColor:
                      i === 1
                        ? 'rgba(242,239,234,.15)'
                        : (t) => alpha(t.palette.text.primary, 0.09),
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      bgcolor: i === 1 ? INK : 'background.default',
                      color: i === 1 ? PAPER : 'text.primary',
                      boxShadow:
                        i === 1
                          ? FOREST_NEU_SHADOW
                          : (t) =>
                              t.palette.mode === 'dark'
                                ? '3px 3px 6px #050905, -3px -3px 6px #4A5D3E66'
                                : '3px 3px 6px #C6BFB499, -3px -3px 6px #FFFFFFE6',
                    }}
                  >
                    {tm.name.replace(/[^A-Z]/g, '').slice(0, 2)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                      {tm.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, opacity: 0.7, mt: 0.25 }}>{tm.role}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>

        {/* FAQ */}
        <Container
          sx={{
            py: { xs: 7, md: 10 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '.7fr 1.3fr' },
            gap: { xs: 4, md: 7 },
          }}
        >
          <Box data-reveal className="b2u-reveal">
            <Kicker>Questions, answered</Kicker>
            <Typography
              component="h2"
              sx={{
                mt: 2,
                fontSize: { xs: 34, md: 44 },
                letterSpacing: '-.04em',
                lineHeight: 1.15,
                fontWeight: 700,
              }}
            >
              A little clarity.
              <br />A lot less worry.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
              Everything you need to take the first step, from reporting an item to finding its way
              home.
            </Typography>
            <Button href="/pricing" sx={{ mt: 3 }}>
              Explore plans &amp; benefits →
            </Button>
          </Box>
          <Box data-reveal className="b2u-reveal">
            {FAQS.map((faq, i) => (
              <Accordion
                key={faq.q}
                disableGutters
                sx={{
                  mb: 2,
                  border: 0,
                  borderRadius: '18px !important',
                  bgcolor: 'background.default',
                  boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  id={`home-faq-${i}`}
                  aria-controls={`home-faq-answer-${i}`}
                  expandIcon={<FaqIcon />}
                  sx={{
                    px: { xs: 2.5, sm: 3 },
                    minHeight: 78,
                    gap: 2,
                    '& .MuiAccordionSummary-content': { my: 2 },
                  }}
                >
                  <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary' }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  id={`home-faq-answer-${i}`}
                  sx={{ px: { xs: 2.5, sm: 3 }, pb: 3 }}
                >
                  <Typography sx={{ color: 'text.secondary', fontSize: 15, lineHeight: 1.8 }}>
                    {faq.a}
                  </Typography>
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
                borderRadius: '32px',
                boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
                bgcolor: INK,
                color: PAPER,
                px: { xs: 3, md: 10 },
                py: { xs: 5, md: 7 },
                textAlign: 'center',
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(30rem 24rem at 80% 120%, rgba(139,111,78,0.28), transparent 60%), radial-gradient(26rem 22rem at 10% -10%, rgba(126,154,130,0.22), transparent 60%)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Typography
                  component="h2"
                  sx={{
                    fontSize: { xs: 36, md: 60 },
                    lineHeight: 1.1,
                    letterSpacing: '-.045em',
                    fontWeight: 700,
                    maxWidth: 650,
                    mx: 'auto',
                  }}
                >
                  Your next chapter starts with a small step.
                </Typography>
                <Typography
                  sx={{
                    mt: 2.5,
                    fontSize: 18,
                    color: 'rgba(250,248,243,0.78)',
                    maxWidth: 520,
                    mx: 'auto',
                  }}
                >
                  Report what’s missing. Share what you’ve found. Help someone’s story end with a
                  reunion.
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
                    sx={{
                      boxShadow: FOREST_NEU_SHADOW,
                      '&:hover': { boxShadow: FOREST_NEU_SHADOW },
                      '&:active': { boxShadow: FOREST_NEU_INSET },
                    }}
                  >
                    Get started free
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    href={`${APP_URL}/feed`}
                    sx={{
                      color: INK,
                      bgcolor: '#FAF8F3',
                      border: 'none',
                      boxShadow: FOREST_NEU_SHADOW,
                      '&:hover': { bgcolor: '#FFFFFF', boxShadow: FOREST_NEU_SHADOW },
                      '&:active': { boxShadow: FOREST_NEU_INSET },
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
