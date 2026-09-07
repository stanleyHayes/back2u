import { Box, Button, Container, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { useTranslation } from 'react-i18next';
import { AppStoreBadges } from './AppStoreBadges';
import './landing-hero.css';

export function LandingHero({ appUrl }: { appUrl: string }) {
  const { t } = useTranslation();
  return (
    <Container
      className="landing-hero"
      sx={{
        '--hero-paper': (theme) => (theme.palette.mode === 'dark' ? '#26312B' : '#F2EFEA'),
        '--hero-ink': (theme) => theme.palette.text.primary,
        '--hero-shadow': (theme) =>
          theme.palette.mode === 'dark'
            ? '12px 12px 26px #111A14, -8px -8px 22px #35423988'
            : '12px 12px 26px #D4CEC4, -12px -12px 26px #FFFFFF',
        '--hero-inset': (theme) =>
          theme.palette.mode === 'dark'
            ? 'inset 6px 6px 14px #18211C, inset -6px -6px 14px #354039'
            : 'inset 6px 6px 14px #D4CEC4, inset -6px -6px 14px #FFFFFF',
        pt: { xs: 5, md: 9 },
        pb: { xs: 6, md: 9 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
          gap: { xs: 5, md: 5 },
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            className="hero-enter"
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.16em',
              color: 'text.secondary',
              mb: 3,
            }}
          >
            LOST &amp; FOUND. HUMAN CONNECTION.
          </Typography>
          <Typography
            component="h1"
            className="hero-title"
            sx={{
              fontFamily: '"Black Ops One", Georgia, serif',
              fontSize: { xs: 52, sm: 70, md: 82 },
              fontWeight: 700,
              letterSpacing: '-.065em',
              lineHeight: 1.02,
            }}
          >
            {['Lost isn’t', 'the end', 'of the story.'].map((line, i) => (
              <Box component="span" className="hero-line" key={line}>
                <Box component="span" style={{ animationDelay: `${i * 100}ms` }}>
                  {line}
                </Box>
              </Box>
            ))}
          </Typography>
          <Typography
            className="hero-enter hero-copy"
            sx={{ mt: 3, fontSize: 18, lineHeight: 1.75, color: 'text.secondary', maxWidth: 440 }}
          >
            A misplaced bag. A familiar set of keys. Someone out there can help bring it back. Start
            your next chapter with bak2me.
          </Typography>
          <Stack
            className="hero-enter hero-actions"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mt: 4 }}
          >
            <Button
              size="large"
              variant="contained"
              color="secondary"
              endIcon={<ArrowForwardRoundedIcon />}
              href={`${appUrl}/post?kind=lost`}
              sx={{ px: 3, py: 1.6 }}
            >
              {t('cta.postLost')}
            </Button>
            <Button
              size="large"
              variant="outlined"
              color="inherit"
              href={`${appUrl}/post?kind=found`}
              sx={{ px: 3, py: 1.6, color: 'text.primary' }}
            >
              {t('cta.foundSomething')}
            </Button>
          </Stack>
          <Box className="hero-enter hero-stores" sx={{ mt: 3.5 }}>
            <AppStoreBadges />
          </Box>
        </Box>
        <Box
          className="reunion-stage"
          aria-label="Illustration of a lost key being found and returned"
        >
          <div className="reunion-orbit orbit-one" />
          <div className="reunion-orbit orbit-two" />
          <svg className="reunion-path" viewBox="0 0 500 550" fill="none" aria-hidden="true">
            <path d="M100 110C450 40 455 215 250 270S65 445 395 440" pathLength="1" />
          </svg>
          <Box className="reunion-label">EVERY RETURN STARTS WITH SOMEONE.</Box>
          <Box className="reunion-card lost-card">
            <Box className="story-icon">
              <SearchRoundedIcon />
            </Box>
            <Box>
              <Typography className="story-caption">01 / THE SEARCH</Typography>
              <Typography sx={{ fontWeight: 700 }}>A little lost.</Typography>
              <Typography variant="body2" color="text.secondary">
                Keys left behind in Accra
              </Typography>
            </Box>
          </Box>
          <Box className="key-medallion" aria-hidden="true">
            <Box className="key-well">
              <KeyRoundedIcon sx={{ fontSize: { xs: 90, md: 112 }, transform: 'rotate(-35deg)' }} />
            </Box>
          </Box>
          <Box className="place-tag">
            <PlaceOutlinedIcon sx={{ fontSize: 17 }} /> A connection closer than you think
          </Box>
          <Box className="reunion-card return-card">
            <Box className="story-icon">
              <CheckRoundedIcon />
            </Box>
            <Box>
              <Typography className="story-caption">02 / THE REUNION</Typography>
              <Typography sx={{ fontWeight: 700 }}>A lot of relief.</Typography>
              <Typography variant="body2">Back where they belong.</Typography>
            </Box>
          </Box>
          <Typography className="demo-caption">An everyday story. A better ending.</Typography>
        </Box>
      </Box>
    </Container>
  );
}
