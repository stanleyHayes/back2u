import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface Step {
  emoji: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    emoji: '📸',
    title: 'Snap',
    description: 'Take a photo of your lost item',
  },
  {
    emoji: '🤖',
    title: 'AI Matches',
    description: 'Our AI finds possible matches in seconds',
  },
  {
    emoji: '💬',
    title: 'Chat',
    description: 'Talk anonymously with the finder',
  },
  {
    emoji: '🎉',
    title: 'Reunite',
    description: 'Verify and get your item back',
  },
];

function StepCard({ step }: { step: Step }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: { xs: '100%', sm: 200 },
        maxWidth: { md: 260 },
        p: 3,
        textAlign: 'center',
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: 40,
          lineHeight: 1,
          display: 'block',
          mb: 1.5,
        }}
      >
        {step.emoji}
      </Typography>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {step.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {step.description}
      </Typography>
    </Paper>
  );
}

function ArrowConnector() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'primary.main',
        opacity: 0.5,
        minWidth: 40,
        py: { xs: 1, md: 0 },
      }}
    >
      {isMobile ? (
        <ArrowDownwardIcon fontSize="medium" />
      ) : (
        <ArrowForwardIcon fontSize="medium" />
      )}
    </Box>
  );
}

export function HeroDemo() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: (theme) =>
          `linear-gradient(180deg, ${theme.palette.primary.light}15 0%, ${theme.palette.background.default} 100%)`,
      }}
    >
      <Container>
        <Typography
          variant="h2"
          fontSize={{ xs: 28, md: 40 }}
          fontWeight={700}
          textAlign="center"
          gutterBottom
        >
          See how it works in 10 seconds
        </Typography>
        <Typography
          color="text.secondary"
          textAlign="center"
          maxWidth={600}
          mx="auto"
          mb={6}
        >
          Four simple steps from lost to found.
        </Typography>

        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={0}
          alignItems="center"
          justifyContent="center"
        >
          {STEPS.map((step, index) => (
            <Box
              key={step.title}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: isMobile ? 'column' : 'row',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <StepCard step={step} />
              {index < STEPS.length - 1 && <ArrowConnector />}
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
