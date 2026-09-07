import { Box, Container, Typography, Avatar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { neuShadow } from '@back2u/ui-web';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';

interface Story {
  name: string;
  location: string;
  initials: string;
  icon: typeof LaptopMacOutlinedIcon;
  lostItem: string;
  timeframe: string;
  method: string;
  body: string;
}

const STORIES: Story[] = [
  {
    name: 'Ama K.',
    location: 'Accra',
    initials: 'AK',
    icon: LaptopMacOutlinedIcon,
    lostItem: 'laptop',
    timeframe: '2 hours',
    method: 'AI matching',
    body: 'I left my laptop in a taxi and posted it on bak2me within minutes. The AI matching engine surfaced a found item that looked identical, and I had it back before dinner.',
  },
  {
    name: 'Kofi B.',
    location: 'Kumasi',
    initials: 'KB',
    icon: BackpackOutlinedIcon,
    lostItem: 'backpack with QR tag',
    timeframe: 'Instantly',
    method: 'QR tag scan',
    body: 'My backpack had a bak2me QR tag from the campus event. Someone found it, scanned the code, and I received an alert with the exact location instantly.',
  },
  {
    name: 'Efua M.',
    location: 'Legon',
    initials: 'EM',
    icon: PhoneIphoneOutlinedIcon,
    lostItem: 'phone at campus',
    timeframe: '5 minutes',
    method: 'Campus security',
    body: 'I dropped my phone in the library and panicked when I realized it was gone. The campus security team had already logged it in bak2me, so pickup took five minutes.',
  },
  {
    name: 'Kwame O.',
    location: 'Airport',
    initials: 'KO',
    icon: WorkOutlineRoundedIcon,
    lostItem: 'passport bag',
    timeframe: '30 minutes',
    method: 'Geo-fenced alert',
    body: 'My passport bag went missing at the airport departure lounge. A geo-fenced alert notified me that a match had been reported nearby, and staff verified my identity quickly.',
  },
];

function StoryCard({ story }: { story: Story }) {
  const ItemIcon = story.icon;
  return (
    <Box
      component="article"
      aria-label={`${story.name}’s recovery story`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        bgcolor: 'background.default',
        borderRadius: '20px',
        overflow: 'hidden',
        border: 'none',
        boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.07),
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: '13px',
            boxShadow: (t) =>
              t.palette.mode === 'dark'
                ? '4px 4px 8px #050905, -4px -4px 8px #4A5D3E66'
                : '4px 4px 8px #C6BFB4AA, -4px -4px 8px #FFFFFFE6',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'background.default',
            color: 'text.primary',
          }}
        >
          <ItemIcon aria-hidden="true" sx={{ fontSize: 23 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              mb: 0.5,
            }}
          >
            Lost &amp; found
          </Typography>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 15,
              lineHeight: 1.4,
              '&::first-letter': { textTransform: 'uppercase' },
            }}
          >
            {story.lostItem}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: 'text.primary',
          }}
        >
          <CheckRoundedIcon aria-hidden="true" sx={{ fontSize: 17 }} />
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            columnGap: 1,
            rowGap: 0.5,
            p: 2,
            borderRadius: '12px',
            bgcolor: 'background.default',
            boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
          }}
        >
          <Typography
            component="h3"
            sx={{
              m: 0,
              fontFamily: 'inherit',
              fontSize: { xs: 28, sm: 32 },
              fontWeight: 600,
              letterSpacing: '-.04em',
              lineHeight: 1.2,
            }}
          >
            {story.timeframe}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
            {story.timeframe === 'Instantly' ? 'after a scan' : 'to recovery'}
          </Typography>
        </Box>
        <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>
          {story.method}
        </Typography>
        <Box component="blockquote" sx={{ m: 0, mt: 3, mb: 3, flex: 1 }}>
          <FormatQuoteRoundedIcon
            aria-hidden="true"
            sx={{
              display: 'block',
              color: (t) => alpha(t.palette.text.primary, 0.25),
              fontSize: 29,
              ml: -0.5,
              mb: 0.5,
              transform: 'rotate(180deg)',
            }}
          />
          <Typography sx={{ fontSize: { xs: 15, sm: 16 }, lineHeight: 1.8, color: 'text.primary' }}>
            {story.body}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pt: 2.5,
            borderTop: '1px solid',
            borderColor: (t) => alpha(t.palette.text.primary, 0.09),
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              fontSize: 12,
              fontWeight: 600,
              boxShadow: (t) =>
                t.palette.mode === 'dark'
                  ? '3px 3px 6px #050905, -3px -3px 6px #4A5D3E66'
                  : '3px 3px 6px #C6BFB499, -3px -3px 6px #FFFFFFE6',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              color: 'text.primary',
            }}
          >
            {story.initials}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
              {story.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
              {story.location}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function SuccessStories() {
  return (
    <Box sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
      <Container>
        <Typography
          variant="h2"
          gutterBottom
          sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 700, textAlign: 'center' }}
        >
          Success Stories
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto', mb: 6 }}
        >
          Real people, real reunions.
        </Typography>

        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}
        >
          {STORIES.map((story) => (
            <StoryCard key={story.name} story={story} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
