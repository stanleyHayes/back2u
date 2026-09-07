import { useState } from 'react';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { neuShadow } from '@back2u/ui-web';
export function ReferralBanner() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setError(false);
    } catch {
      setError(true);
    }
  };
  return (
    <Container sx={{ py: { xs: 5, md: 7 } }}>
      <Box
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: '28px',
          bgcolor: 'background.default',
          boxShadow: (t) => neuShadow(t.palette.mode, 'raised'),
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto' },
          gap: 3,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 76,
            height: 76,
            borderRadius: '24px',
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            boxShadow: (t) => neuShadow(t.palette.mode, 'inset'),
          }}
        >
          <GroupAddOutlinedIcon sx={{ fontSize: 34 }} />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: '.14em',
              fontWeight: 700,
              color: 'text.secondary',
              mb: 1,
            }}
          >
            PASS THE GOOD ON
          </Typography>
          <Typography
            component="h2"
            sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 700, letterSpacing: '-.035em' }}
          >
            More people. More ways home.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 470 }}>
            Share bak2me with a friend. The next person to join could be the one who finds what
            matters.
          </Typography>
        </Box>
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            size="large"
            onClick={copy}
            startIcon={<ContentCopyRoundedIcon />}
          >
            {copied ? 'Link copied' : 'Copy invite link'}
          </Button>
          <Typography role="status" variant="caption" color="text.secondary">
            {copied ? 'Ready to paste into a message.' : 'A small share can make a big difference.'}
          </Typography>
          {error && <Alert severity="info">Copy this link: {window.location.origin}</Alert>}
        </Stack>
      </Box>
    </Container>
  );
}
