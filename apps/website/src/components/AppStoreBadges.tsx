import { Box, Stack } from '@mui/material';

// Until real store listings exist, badges point at the website's own /download page.
const APP_STORE_URL = (import.meta.env.VITE_APP_STORE_URL as string | undefined) ?? '/download';
const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL as string | undefined) ?? '/download';

function Badge({
  href,
  eyebrow,
  label,
  icon,
}: {
  href: string;
  eyebrow: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Box
      component="a"
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2,
        py: 1.1,
        borderRadius: 2.5,
        bgcolor: '#0B3D38',
        color: '#FFFDF8',
        textDecoration: 'none',
        border: '1px solid rgba(255,253,248,0.16)',
        transition: 'transform .18s cubic-bezier(.2,.7,.2,1), box-shadow .18s ease',
        boxShadow: '0 10px 24px -16px rgba(11,61,56,.8)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 16px 30px -16px rgba(11,61,56,.9)',
        },
      }}
    >
      <Box sx={{ display: 'grid', placeItems: 'center', width: 26, height: 26, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ lineHeight: 1.1, textAlign: 'left' }}>
        <Box
          sx={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}
        >
          {eyebrow}
        </Box>
        <Box sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 16, fontWeight: 700 }}>
          {label}
        </Box>
      </Box>
    </Box>
  );
}

const AppleMark = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.36 1.43c.04 1.06-.36 2.09-1.05 2.86-.71.8-1.86 1.42-2.98 1.33-.13-1.04.38-2.13 1.02-2.82.72-.78 1.96-1.36 3.01-1.37zM20.5 17.2c-.55 1.27-.82 1.83-1.53 2.95-.99 1.56-2.39 3.51-4.12 3.52-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.01-3.05-1.77-4.04-3.33C-.07 16.95-.36 11.9 1.36 9.2 2.58 7.29 4.5 6.17 6.31 6.17c1.84 0 3 1.01 4.52 1.01 1.48 0 2.38-1.01 4.51-1.01 1.61 0 3.32.88 4.54 2.39-3.99 2.18-3.34 7.88.62 8.64z" />
  </svg>
);

const PlayMark = (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3.6 2.3c-.3.2-.5.6-.5 1.1v17.2c0 .5.2.9.5 1.1l.1.1L13 12.1v-.2L3.7 2.2l-.1.1z"
      fill="#14B8A6"
    />
    <path
      d="M16.3 15.4 13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.6 0 2.3l-3.9 2.2-.1.1z"
      fill="#E0A106"
    />
    <path d="M16.4 15.3 13 12 3.6 21.7c.4.4 1 .4 1.6.1l11.2-6.5z" fill="#F3C969" />
    <path d="M16.4 8.7 5.2 2.2c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z" fill="#0F766E" />
  </svg>
);

export function AppStoreBadges({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      useFlexGap
      sx={{ flexWrap: 'wrap', opacity: tone === 'dark' ? 1 : 0.98 }}
    >
      <Badge href={APP_STORE_URL} eyebrow="Download on the" label="App Store" icon={AppleMark} />
      <Badge href={PLAY_STORE_URL} eyebrow="Get it on" label="Google Play" icon={PlayMark} />
    </Stack>
  );
}
