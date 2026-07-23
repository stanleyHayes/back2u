import { useState, type FormEvent } from 'react';
import { Box, Button, Container, IconButton, InputBase, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import GetAppIcon from '@mui/icons-material/GetApp';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MapIcon from '@mui/icons-material/Map';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';

import { Wordmark } from './Wordmark';
import { AppStoreBadges } from './AppStoreBadges';

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'hello@back2u.app';
const PAPER = '#FBF6EC';
const MARIGOLD = '#E0A106';
const MUTED = 'rgba(255,253,248,0.62)';

type FLink = { label: string; icon: React.ReactNode; to?: string; href?: string };

const COLUMNS: { title: string; links: FLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Browse feed', icon: <RssFeedIcon fontSize="inherit" />, href: `${APP_URL}/feed` },
      { label: 'Live map', icon: <MapIcon fontSize="inherit" />, to: '/map' },
      {
        label: 'Post an item',
        icon: <AddCircleOutlinedIcon fontSize="inherit" />,
        href: `${APP_URL}/post`,
      },
      { label: 'QR tags', icon: <QrCode2Icon fontSize="inherit" />, href: `${APP_URL}/tags` },
      {
        label: 'Marketplace',
        icon: <StorefrontIcon fontSize="inherit" />,
        href: `${APP_URL}/marketplace`,
      },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'For institutions', icon: <ApartmentIcon fontSize="inherit" />, to: '/partner' },
      { label: 'Pricing', icon: <LocalOfferIcon fontSize="inherit" />, to: '/pricing' },
      {
        label: 'Contact',
        icon: <MailOutlinedIcon fontSize="inherit" />,
        href: `mailto:${CONTACT_EMAIL}`,
      },
      {
        label: 'Safety',
        icon: <ShieldOutlinedIcon fontSize="inherit" />,
        href: `${APP_URL}/safety`,
      },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'How it works', icon: <AutoAwesomeIcon fontSize="inherit" />, to: '/' },
      { label: 'Success stories', icon: <FavoriteBorderIcon fontSize="inherit" />, to: '/' },
      { label: 'Download app', icon: <GetAppIcon fontSize="inherit" />, to: '/download' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', icon: <GavelOutlinedIcon fontSize="inherit" />, to: '/terms' },
      { label: 'Privacy Policy', icon: <LockOutlinedIcon fontSize="inherit" />, to: '/privacy' },
    ],
  },
];

const SOCIALS = [
  { label: 'Facebook', icon: <FacebookIcon fontSize="small" />, href: 'https://facebook.com' },
  { label: 'X', icon: <XIcon fontSize="small" />, href: 'https://x.com' },
  { label: 'Instagram', icon: <InstagramIcon fontSize="small" />, href: 'https://instagram.com' },
  { label: 'LinkedIn', icon: <LinkedInIcon fontSize="small" />, href: 'https://linkedin.com' },
  { label: 'YouTube', icon: <YouTubeIcon fontSize="small" />, href: 'https://youtube.com' },
];

function FooterLink({ link }: { link: FLink }) {
  const inner = (
    <Stack
      direction="row"
      spacing={1.1}
      sx={{
        alignItems: 'center',
        color: MUTED,
        fontSize: 15,
        py: 0.5,
        transition: 'color .18s, transform .18s',
        '& svg': { fontSize: 17, color: 'rgba(224,161,6,0.7)' },
        '&:hover': { color: PAPER, transform: 'translateX(2px)' },
      }}
    >
      {link.icon}
      <span>{link.label}</span>
    </Stack>
  );
  return link.to ? (
    <Box component={Link} to={link.to} sx={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Box>
  ) : (
    <Box component="a" href={link.href} sx={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Box>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#072c28',
        color: PAPER,
        borderTop: '1px solid rgba(224,161,6,0.3)',
        pt: { xs: 7, md: 10 },
        pb: 4,
      }}
    >
      <Container>
        {/* Top: brand + newsletter */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
            gap: { xs: 5, md: 6 },
            alignItems: 'start',
          }}
        >
          <Box>
            <Wordmark onDark />
            <Box
              sx={{
                mt: 2.5,
                maxWidth: 420,
                p: 2.5,
                borderRadius: 3,
                border: '1px solid rgba(255,253,248,0.08)',
                bgcolor: 'rgba(255,253,248,0.03)',
              }}
            >
              <Typography sx={{ color: 'rgba(255,253,248,0.72)', fontSize: 16, lineHeight: 1.7 }}>
                West Africa&apos;s smart lost &amp; found. We reunite people with what they value
                through AI matching, branded QR tags, and a community that shows up.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ justifySelf: { md: 'end' }, width: '100%', maxWidth: 460 }}>
            <Typography
              className="b2u-display"
              sx={{ fontSize: 24, fontWeight: 600, color: PAPER }}
            >
              Stay in the loop
            </Typography>
            <Typography sx={{ mt: 1, color: MUTED, fontSize: 14 }}>
              Reunion stories and product news. No spam, unsubscribe anytime.
            </Typography>
            {subscribed ? (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid rgba(224,161,6,0.4)',
                  bgcolor: 'rgba(224,161,6,0.08)',
                  color: PAPER,
                  fontSize: 15,
                }}
              >
                Thanks — you&apos;re on the list. 💚
              </Box>
            ) : (
              <Box
                component="form"
                onSubmit={onSubscribe}
                sx={{
                  mt: 2,
                  display: 'flex',
                  gap: 1,
                  p: 0.75,
                  borderRadius: 3,
                  border: '1px solid rgba(255,253,248,0.14)',
                  bgcolor: 'rgba(255,253,248,0.03)',
                  alignItems: 'center',
                }}
              >
                <InputBase
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="your@email.com"
                  sx={{
                    flex: 1,
                    px: 1.5,
                    color: PAPER,
                    fontSize: 15,
                    '& input::placeholder': { color: 'rgba(255,253,248,0.4)' },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: MARIGOLD,
                    color: '#0B3D38',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2.5,
                    '&:hover': { bgcolor: '#cf9305' },
                  }}
                >
                  Subscribe
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Columns */}
        <Box
          sx={{
            mt: { xs: 6, md: 9 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: { xs: 4, md: 3 },
          }}
        >
          {COLUMNS.map((col) => (
            <Box key={col.title}>
              <Typography
                sx={{
                  color: MARIGOLD,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  mb: 1.5,
                }}
              >
                {col.title}
              </Typography>
              <Stack spacing={0.25}>
                {col.links.map((l) => (
                  <FooterLink key={l.label} link={l} />
                ))}
              </Stack>
            </Box>
          ))}
        </Box>

        {/* App badges */}
        <Box sx={{ mt: { xs: 5, md: 7 } }}>
          <AppStoreBadges tone="dark" />
        </Box>

        {/* Bottom bar */}
        <Box
          sx={{
            mt: { xs: 5, md: 7 },
            pt: 3,
            borderTop: '1px solid rgba(255,253,248,0.1)',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography sx={{ fontSize: 13, color: MUTED, textAlign: { xs: 'center', md: 'left' } }}>
            © {new Date().getFullYear()} Back2u. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
            {SOCIALS.map((s) => (
              <IconButton
                key={s.label}
                component="a"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                sx={{
                  color: MUTED,
                  border: '1px solid rgba(255,253,248,0.14)',
                  borderRadius: 2,
                  width: 38,
                  height: 38,
                  transition: 'all .18s',
                  '&:hover': { color: PAPER, borderColor: MARIGOLD, transform: 'translateY(-2px)' },
                }}
              >
                {s.icon}
              </IconButton>
            ))}
          </Stack>
          <Typography
            className="b2u-display"
            sx={{
              fontStyle: 'italic',
              fontSize: 14,
              color: MUTED,
              textAlign: { xs: 'center', md: 'right' },
            }}
          >
            &ldquo;Lost is just found, waiting.&rdquo;
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
