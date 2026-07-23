import { Box, Container, Typography, Card, CardContent, Avatar } from '@mui/material';

interface Story {
  name: string;
  location: string;
  initials: string;
  avatarColor: string;
  lostItem: string;
  timeframe: string;
  body: string;
}

const STORIES: Story[] = [
  {
    name: 'Ama K.',
    location: 'Accra',
    initials: 'AK',
    avatarColor: '#0F766E',
    lostItem: 'laptop',
    timeframe: '2 hours via AI match',
    body: 'I left my laptop in a taxi and posted it on Back2u within minutes. The AI matching engine surfaced a found item that looked identical, and I had it back before dinner.',
  },
  {
    name: 'Kofi B.',
    location: 'Kumasi',
    initials: 'KB',
    avatarColor: '#F59E0B',
    lostItem: 'backpack with QR tag',
    timeframe: 'instantly after scan',
    body: 'My backpack had a Back2u QR tag from the campus event. Someone found it, scanned the code, and I received an alert with the exact location instantly.',
  },
  {
    name: 'Efua M.',
    location: 'Legon',
    initials: 'EM',
    avatarColor: '#2563EB',
    lostItem: 'phone at campus',
    timeframe: '5 minutes via security partner',
    body: 'I dropped my phone in the library and panicked when I realized it was gone. The campus security team had already logged it in Back2u, so pickup took five minutes.',
  },
  {
    name: 'Kwame O.',
    location: 'Airport',
    initials: 'KO',
    avatarColor: '#7C3AED',
    lostItem: 'passport bag',
    timeframe: '30 minutes via geo-fenced alert',
    body: 'My passport bag went missing at the airport departure lounge. A geo-fenced alert notified me that a match had been reported nearby, and staff verified my identity quickly.',
  },
];

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
            <Card
              key={story.name}
              variant="outlined"
              sx={{
                borderRadius: 2,
                bgcolor: 'background.paper',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'none',
                transition: 'border-color .18s ease, box-shadow .18s ease',
                '&:hover': {
                  borderColor: 'rgba(11,61,56,0.3)',
                  boxShadow: '0 6px 20px rgba(11,61,56,0.08)',
                },
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: story.avatarColor,
                      color: '#fff',
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {story.initials}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{story.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {story.location}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      bgcolor: 'rgba(11,61,56,0.07)',
                      color: 'text.primary',
                    }}
                  >
                    Lost: {story.lostItem}
                  </Box>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      bgcolor: 'rgba(224,161,6,0.15)',
                      color: '#8a6103',
                    }}
                  >
                    Found in: {story.timeframe}
                  </Box>
                </Box>

                <Typography color="text.secondary" sx={{ flex: 1, lineHeight: 1.6 }}>
                  {story.body}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
