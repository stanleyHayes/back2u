import { Box, Container, Stack, Typography } from '@mui/material';

import { Navbar } from './Navbar';
import { Footer } from './Footer';

const INK = '#0B3D38';

/** Header/footer wrapper for sub-pages (legal, download, 404). */
export function PageShell({
  children,
  maxWidth = 'md',
}: {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1 }}>
        <Container maxWidth={maxWidth} sx={{ py: { xs: 6, md: 9 } }}>
          {children}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}

/** Shared section heading + prose styles for legal pages. */
export function LegalProse({
  title,
  updated,
  sections,
  intro,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <Box>
      <Typography component="span" className="b2u-eyebrow">
        Legal
      </Typography>
      <Typography className="b2u-display" component="h1" sx={{ mt: 2, fontSize: { xs: 36, md: 52 }, fontWeight: 600, color: INK }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 1.5, color: 'text.secondary', fontSize: 14 }}>Last updated {updated}</Typography>
      <Typography sx={{ mt: 3, color: 'text.secondary', fontSize: 18, lineHeight: 1.7 }}>{intro}</Typography>
      <Stack spacing={4} mt={5}>
        {sections.map((s, i) => (
          <Box key={s.heading}>
            <Typography className="b2u-display" component="h2" sx={{ fontSize: 24, fontWeight: 600, color: INK }}>
              {i + 1}. {s.heading}
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'text.secondary', fontSize: 16, lineHeight: 1.75, whiteSpace: 'pre-line' }}>
              {s.body}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
