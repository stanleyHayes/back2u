import { Box, Button, Container, Typography } from '@mui/material';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import { neuShadow } from '@back2u/ui-web';
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
    <Container sx={{ py: { xs: 6, md: 9 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '.8fr 1.5fr' },
          gap: 5,
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: '.14em',
              color: 'text.secondary',
              fontWeight: 700,
              mb: 2,
            }}
          >
            A MORE CONNECTED COMMUNITY
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontFamily: '"Black Ops One", Georgia, serif',
              fontSize: { xs: 32, md: 40 },
              fontWeight: 700,
              letterSpacing: '-.04em',
              lineHeight: 1.15,
            }}
          >
            Better together.
            <br />
            Across Ghana.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
            Connecting the places we visit with the things we leave behind.
          </Typography>
          <Button href="/partner" sx={{ mt: 3 }}>
            Explore partnerships →
          </Button>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 2 }}>
          {PARTNERS.map((name) => (
            <Box
              key={name}
              sx={{
                p: { xs: 2, sm: 2.5 },
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                borderRadius: '16px',
                bgcolor: 'background.default',
                boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
              }}
            >
              <ApartmentOutlinedIcon
                sx={{ color: 'text.secondary', fontSize: 20, display: { xs: 'none', sm: 'block' } }}
              />
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{name}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
}
