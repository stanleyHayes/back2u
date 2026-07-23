import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { InstitutionDTO } from '@back2u/shared-types';
import { EmptyState, CardGridSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { PageHeader } from '../components/BrandPage.js';

const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const PAPER = '#FBF6EC';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'All partners' },
  { key: 'restaurant', label: 'Restaurants' },
  { key: 'cafe', label: 'Cafés' },
  { key: 'mall', label: 'Malls' },
  { key: 'retail', label: 'Shops' },
  { key: 'pharmacy', label: 'Pharmacies' },
  { key: 'hotel', label: 'Hotels' },
];

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

function PartnerCard({ p }: { p: InstitutionDTO }) {
  const rate = p.pointToCurrencyRate ?? 1;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px 24px 24px 8px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        transition: 'transform .15s, box-shadow .15s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 24px 48px -36px rgba(11,61,56,0.5)',
        },
      }}
    >
      <Box
        sx={{
          height: 120,
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
          <StorefrontOutlinedIcon sx={{ fontSize: 44, color: PAPER, opacity: 0.9 }} />
        )}
        <Chip
          label={TYPE_LABEL[p.type] ?? 'Partner'}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: 'rgba(251,246,236,0.92)',
            color: INK,
            fontWeight: 700,
          }}
        />
      </Box>
      <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontWeight: 600,
            fontSize: 19,
            color: INK,
          }}
          noWrap
        >
          {p.name}
        </Typography>
        {p.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {p.description}
          </Typography>
        )}
        {p.place?.name && (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ alignItems: 'center', color: 'text.secondary' }}
          >
            <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" noWrap>
              {[p.place.name, p.place.city].filter(Boolean).join(', ')}
            </Typography>
          </Stack>
        )}
        <Box sx={{ flex: 1 }} />
        <Chip
          label={`100 pts ≈ GHS ${((100 * rate) / 100).toFixed(2)}`}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'rgba(224,161,6,0.14)',
            color: '#946a00',
            fontWeight: 700,
          }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <Button
            component={Link}
            to={`/redeem?institution=${p.id}`}
            variant="contained"
            size="small"
            startIcon={<RedeemOutlinedIcon />}
            sx={{
              bgcolor: INK,
              color: PAPER,
              borderRadius: 999,
              fontWeight: 700,
              '&:hover': { bgcolor: '#0a322e' },
            }}
          >
            Redeem here
          </Button>
          {p.website && (
            <Button
              href={p.website}
              target="_blank"
              rel="noopener"
              size="small"
              startIcon={<LanguageOutlinedIcon />}
              sx={{ color: TEAL, borderRadius: 999, fontWeight: 700 }}
            >
              Visit
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export function RewardPartnersPage() {
  const [category, setCategory] = useState('all');
  const { data, isLoading } = useQuery({
    queryKey: ['reward-partners', category],
    queryFn: () => api.listRewardPartners(category),
  });
  const partners = data ?? [];

  return (
    <Box>
      <PageHeader
        eyebrow="Rewards"
        title="Spend your points"
        subtitle="Turn the points you earn from returning lost items into perks at restaurants, cafés, malls and shops near you. New partners join all the time."
      />

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 3 }} useFlexGap>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            onClick={() => setCategory(c.key)}
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              bgcolor: category === c.key ? INK : 'transparent',
              color: category === c.key ? PAPER : INK,
              border: '1px solid',
              borderColor: category === c.key ? INK : 'divider',
              '&:hover': { bgcolor: category === c.key ? '#0a322e' : 'rgba(15,118,110,0.06)' },
            }}
          />
        ))}
      </Stack>

      {isLoading ? (
        <CardGridSkeleton count={6} minWidth={260} />
      ) : partners.length === 0 ? (
        <EmptyState
          tone="marigold"
          icon={<StorefrontOutlinedIcon />}
          title="No reward partners here yet"
          description="We're signing up restaurants, malls and shops where you can spend your points. Check back soon — or tell your favourite spot about Back2u."
          actions={[{ label: 'Earn more points', href: '/' }]}
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {partners.map((p) => (
            <PartnerCard key={p.id} p={p} />
          ))}
        </Box>
      )}
    </Box>
  );
}
