import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';

import { api } from '../lib/api.js';
import { shareLink } from '../lib/share.js';

const DISPLAY = '"Fraunces", Georgia, serif';
const BODY = '"Outfit", system-ui, sans-serif';
const INK = '#0B3D38';
const PAPER = '#FBF6EC';
const PAPER_RAISED = '#FFFDF8';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const CLAY = '#C2410C';
const MUTED = '#3C544F';

function Wordmark() {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.1 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '11px 11px 11px 3px',
          background: `linear-gradient(140deg, ${TEAL} 0%, #14B8A6 100%)`,
          display: 'grid',
          placeItems: 'center',
          transform: 'rotate(-6deg)',
          boxShadow: '0 8px 16px -10px rgba(15,118,110,.9)',
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PAPER_RAISED }} />
      </Box>
      <Typography
        sx={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: 21,
          letterSpacing: '-0.03em',
          color: INK,
        }}
      >
        Back2u
      </Typography>
    </Box>
  );
}

function PinMark() {
  return (
    <Box
      sx={{ position: 'relative', width: 88, height: 88, display: 'grid', placeItems: 'center' }}
    >
      {/* pulse rings */}
      <Box
        sx={{
          position: 'absolute',
          inset: -14,
          borderRadius: '50%',
          border: '1.5px solid rgba(15,118,110,.25)',
        }}
      />
      <Box
        className="b2u-scan-pulse"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `2px solid ${TEAL}`,
          opacity: 0.4,
          '@keyframes b2uScan': {
            '0%': { transform: 'scale(0.6)', opacity: 0.6 },
            '80%': { opacity: 0 },
            '100%': { transform: 'scale(1.25)', opacity: 0 },
          },
          animation: 'b2uScan 3.2s cubic-bezier(.2,.7,.2,1) infinite',
        }}
      />
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50% 50% 50% 7px',
          background: `linear-gradient(150deg, ${TEAL}, #14B8A6)`,
          transform: 'rotate(-45deg)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 20px 38px -18px rgba(11,61,56,.7)',
        }}
      >
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: PAPER_RAISED,
            transform: 'rotate(45deg)',
          }}
        />
      </Box>
    </Box>
  );
}

export function ScanTagPage() {
  const { code } = useParams<{ code: string }>();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [shared, setShared] = useState(false);

  const { data: tag, isLoading } = useQuery({
    queryKey: ['tag', code],
    queryFn: () => api.getTagByCode(code!),
    enabled: !!code,
  });

  const scan = useMutation({
    mutationFn: () => api.scanTag(code!, message, email || undefined),
    onSuccess: () => {
      setMessage('');
      setEmail('');
    },
  });

  const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173';

  const handleShare = async () => {
    const result = await shareLink({
      title: 'Back2u',
      text: tag?.itemLabel
        ? `Help reunite this "${tag.itemLabel}" with its owner via Back2u.`
        : 'Help reunite this item with its owner — open this Back2u tag.',
      url: window.location.href,
    });
    if (result === 'copied') setShared(true);
  };

  const statusColor = tag?.status === 'lost' ? CLAY : tag?.status === 'active' ? TEAL : MARIGOLD;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        fontFamily: BODY,
        color: INK,
        backgroundColor: PAPER,
        backgroundImage: [
          'radial-gradient(42rem 36rem at 88% -10%, rgba(224,161,6,0.18), transparent 60%)',
          'radial-gradient(38rem 34rem at -8% 8%, rgba(20,184,166,0.16), transparent 58%)',
        ].join(','),
      }}
    >
      {/* Header */}
      <Box
        sx={{
          borderBottom: '1px solid rgba(11,61,56,0.1)',
          backdropFilter: 'blur(8px)',
          bgcolor: 'rgba(251,246,236,0.7)',
        }}
      >
        <Container maxWidth="sm" sx={{ py: 1.75, display: 'flex', alignItems: 'center' }}>
          <Wordmark />
          <Box sx={{ flex: 1 }} />
          <Button
            href={APP_URL}
            variant="contained"
            sx={{
              bgcolor: INK,
              color: PAPER,
              borderRadius: 999,
              textTransform: 'none',
              fontFamily: BODY,
              fontWeight: 700,
              px: 2.5,
              '&:hover': { bgcolor: '#0a322e' },
            }}
          >
            Open app
          </Button>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 } }}>
        <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', mb: 4 }}>
          <PinMark />
          <Box
            component="span"
            sx={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: TEAL,
            }}
          >
            Back2u QR tag
          </Box>
          <Typography
            sx={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: { xs: 36, md: 46 },
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            You found something.
          </Typography>
          <Typography sx={{ color: MUTED, maxWidth: 420, fontSize: 17 }}>
            Someone is missing this. Leave a note and we&apos;ll reunite it with its owner — your
            identity stays private.
          </Typography>
        </Stack>

        <Box
          sx={{
            borderRadius: 5,
            bgcolor: PAPER_RAISED,
            border: '1px solid rgba(11,61,56,0.1)',
            boxShadow: '0 30px 60px -40px rgba(11,61,56,.5)',
            p: { xs: 3, md: 4 },
          }}
        >
          {isLoading && (
            <Typography sx={{ color: MUTED, textAlign: 'center' }}>Loading tag info…</Typography>
          )}

          {!isLoading && !tag && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              This tag code was not found. It may be invalid or expired.
            </Alert>
          )}

          {tag && (
            <Stack spacing={2.5}>
              {/* tag summary row */}
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  {tag.itemLabel && (
                    <Typography
                      sx={{
                        fontFamily: DISPLAY,
                        fontWeight: 600,
                        fontSize: 24,
                        color: INK,
                        lineHeight: 1.1,
                      }}
                    >
                      {tag.itemLabel}
                    </Typography>
                  )}
                  <Typography sx={{ color: MUTED, fontSize: 14, mt: tag.itemLabel ? 0.5 : 0 }}>
                    Tag {tag.code}
                  </Typography>
                </Box>
                <Box
                  component="span"
                  sx={{
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: statusColor,
                    bgcolor: `${statusColor}1A`,
                    flexShrink: 0,
                  }}
                >
                  {tag.status}
                </Box>
              </Stack>

              {tag.status === 'unclaimed' && (
                <Alert severity="info" sx={{ borderRadius: 3, textAlign: 'left' }}>
                  This tag hasn&apos;t been claimed yet. If you found it near something valuable,
                  the owner may not know it&apos;s lost — leave a message and we&apos;ll try to
                  help.
                </Alert>
              )}

              {scan.isSuccess ? (
                <Alert severity="success" sx={{ borderRadius: 3 }}>
                  Message sent! The owner has been notified. Thank you for being a good human. 💚
                </Alert>
              ) : (
                <>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="How did you find this?"
                    placeholder="Where you found it, its condition, and how to return it."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={scan.isPending}
                  />
                  <TextField
                    fullWidth
                    label="Your email (optional)"
                    placeholder="so the owner can reply"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={scan.isPending}
                  />
                  {scan.isError && (
                    <Alert severity="error" sx={{ borderRadius: 3 }}>
                      Something went wrong sending your message. Please try again.
                    </Alert>
                  )}
                  <Button
                    fullWidth
                    size="large"
                    onClick={() => scan.mutate()}
                    disabled={!message.trim() || scan.isPending}
                    sx={{
                      bgcolor: MARIGOLD,
                      color: INK,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontFamily: BODY,
                      fontWeight: 700,
                      py: 1.4,
                      boxShadow: '0 14px 28px -16px rgba(224,161,6,.9)',
                      '&:hover': { bgcolor: '#cf9305' },
                    }}
                  >
                    {scan.isPending ? 'Sending…' : 'Notify the owner'}
                  </Button>
                </>
              )}

              <Box sx={{ pt: 1.5, borderTop: '1px dashed rgba(11,61,56,0.18)' }}>
                <Typography sx={{ color: MUTED, fontSize: 14, mb: 1.25 }}>
                  Can&apos;t help directly? Share this tag so someone who can will see it.
                </Typography>
                <Button
                  fullWidth
                  onClick={handleShare}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontFamily: BODY,
                    fontWeight: 700,
                    color: INK,
                    border: '1.5px solid rgba(11,61,56,0.25)',
                    py: 1.2,
                    '&:hover': { borderColor: INK, bgcolor: 'rgba(11,61,56,0.04)' },
                  }}
                >
                  Share this tag
                </Button>
                {shared && (
                  <Typography
                    sx={{ color: TEAL, fontSize: 13, mt: 1, textAlign: 'center', fontWeight: 600 }}
                  >
                    Link copied to clipboard.
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'center', mt: 4, color: MUTED, fontSize: 13 }}
        >
          <span>🔒 Anonymous</span>
          <span>·</span>
          <span>No app needed</span>
          <span>·</span>
          <span>Free</span>
        </Stack>
        <Typography sx={{ color: MUTED, textAlign: 'center', mt: 1.5, fontSize: 13, opacity: 0.8 }}>
          Powered by Back2u — the smart lost &amp; found ecosystem.
        </Typography>
      </Container>
    </Box>
  );
}
