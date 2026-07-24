import { useEffect, useState } from 'react';
import { Box, Button, Chip, Container, Typography } from '@mui/material';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
const INK = '#2E3D2F';
const PAPER = '#F2EFEA';
const TEAL = '#40614A';

interface Partner {
  id: string;
  name: string;
  type: string;
  logoUrl?: string;
  description?: string;
  pointToCurrencyRate?: number;
  place?: { name?: string; city?: string };
}

const TYPE_LABEL: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  mall: 'Shopping mall',
  retail: 'Shop',
  pharmacy: 'Pharmacy',
  hotel: 'Hotel',
  school: 'Campus',
  airport: 'Airport',
  transport: 'Transport',
  event: 'Venue',
  other: 'Partner',
};

/**
 * Marketing-site strip advertising the partners that have OPTED IN to accept
 * Back2u points (rewardsListed === true). Renders nothing until at least one exists.
 */
export function RewardPartnersSection() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/v1/institutions/rewards/partners`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && Array.isArray(j?.data)) setPartners(j.data as Partner[]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (partners.length === 0) return null;

  return (
    <Box
      component="section"
      aria-labelledby="rewards-heading"
      sx={{ bgcolor: '#fff', py: { xs: 8, md: 13 } }}
    >
      <Container>
        <Box
          data-reveal
          className="b2u-reveal"
          sx={{ textAlign: 'center', maxWidth: 660, mx: 'auto', mb: { xs: 5, md: 7 } }}
        >
          <Typography
            sx={{
              color: TEAL,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontSize: 13,
            }}
          >
            Reward partners
          </Typography>
          <Typography
            id="rewards-heading"
            className="b2u-display"
            component="h2"
            sx={{ mt: 2, fontSize: { xs: 32, md: 50 }, fontWeight: 600, color: INK }}
          >
            Spend your points where it counts
          </Typography>
          <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 18 }}>
            Restaurants, malls and shops across Ghana have opted in to accept Back2u points. Return
            what you find — then treat yourself at one of our partners.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {partners.slice(0, 9).map((p) => (
            <Box
              key={p.id}
              data-reveal
              className="b2u-reveal"
              sx={{
                borderRadius: '24px 24px 24px 8px',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                transition: 'transform .15s, box-shadow .15s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 24px 48px -36px rgba(46,61,47,0.5)',
                },
              }}
            >
              <Box
                sx={{
                  height: 132,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  background: p.logoUrl ? undefined : `linear-gradient(135deg, ${TEAL}, ${INK})`,
                }}
              >
                {p.logoUrl ? (
                  <Box
                    component="img"
                    src={p.logoUrl}
                    alt={p.name}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Typography
                    className="b2u-display"
                    sx={{ color: PAPER, fontSize: 32, fontWeight: 600 }}
                  >
                    {p.name.charAt(0)}
                  </Typography>
                )}
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Chip
                  label={TYPE_LABEL[p.type] ?? 'Partner'}
                  size="small"
                  sx={{ bgcolor: 'rgba(64,97,74,0.1)', color: TEAL, fontWeight: 700, mb: 1 }}
                />
                <Typography
                  className="b2u-display"
                  sx={{ fontSize: 20, fontWeight: 600, color: INK }}
                  noWrap
                >
                  {p.name}
                </Typography>
                {p.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.description}
                  </Typography>
                )}
                {[p.place?.name, p.place?.city].filter(Boolean).length > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.75 }}
                    noWrap
                  >
                    {[p.place?.name, p.place?.city].filter(Boolean).join(', ')}
                  </Typography>
                )}
                <Typography sx={{ mt: 1.5, fontWeight: 700, color: '#946a00', fontSize: 14 }}>
                  100 pts ≈ GHS {((100 * (p.pointToCurrencyRate ?? 0)) / 100).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <Button
            variant="outlined"
            color="inherit"
            href={`${APP_URL}/rewards`}
            sx={{ color: 'text.primary' }}
          >
            See all reward partners →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
