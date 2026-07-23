import { Box, Container, Divider, Typography } from '@mui/material';

const PARTNERS = [
  'University of Ghana',
  'Accra Mall',
  'Kotoka Airport',
  'Uber Ghana',
  'MTN',
  'Stanbic Bank',
  'British Council',
  'Ghana Police',
];

export function PartnerLogos() {
  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.paper' }}>
      <Container>
        <Typography
          variant="h6"
          fontWeight={600}
          textAlign="center"
          color="text.secondary"
          sx={{ mb: { xs: 4, md: 5 }, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 14 }}
        >
          Trusted by leading institutions
        </Typography>

        {/* Mobile: horizontal scroll */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            overflowX: 'auto',
            gap: 0,
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {PARTNERS.map((name, index) => (
            <Box key={name} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {index > 0 && (
                <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: 'divider', opacity: 0.5 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: 'text.disabled',
                  fontWeight: 600,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  py: 1,
                  px: 0.5,
                }}
              >
                {name}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Desktop: grid */}
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
          }}
        >
          {PARTNERS.map((name, index) => {
            const isFirstInRow = index % 4 === 0;
            const isFirstRow = index < 4;
            return (
              <Box
                key={name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 3,
                  px: 2,
                  borderRight: (index + 1) % 4 !== 0 ? '1px solid' : 'none',
                  borderBottom: !isFirstRow ? 'none' : '1px solid',
                  borderColor: 'divider',
                  opacity: 0.6,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: 15,
                    textAlign: 'center',
                  }}
                >
                  {name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
