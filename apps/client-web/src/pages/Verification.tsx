import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import type { SubmitVerificationInput, VerificationProof } from '@back2u/shared-types';
import { AiAssistantBar } from '@back2u/ui-web';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { api } from '../lib/api.js';

const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const STEPS = ['Ownership questions', 'Supporting proof'];

export function VerificationPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { data: questions } = useQuery({
    queryKey: ['verif-questions'],
    queryFn: () => api.getVerificationQuestions(),
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [proofText, setProofText] = useState('');
  const [submitted, setSubmitted] = useState<{ score: number; status: string } | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => {
      const input: SubmitVerificationInput = {
        itemId: itemId!,
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        proofs: proofText
          ? ([{ kind: 'other', text: proofText }] satisfies VerificationProof[])
          : ([{ kind: 'other', text: 'no extra proof' }] satisfies VerificationProof[]),
      };
      return api.submitVerification(input);
    },
    onSuccess: (data) => setSubmitted({ score: data.aiConsistencyScore, status: data.status }),
  });

  const stepValid = (s: number): boolean => {
    if (s === 0) {
      if (!questions || questions.length === 0) return false;
      return questions.every((q) => (answers[q.id] ?? '').trim().length > 0);
    }
    return true;
  };

  const stepHint = (s: number): string => {
    if (s === 0) return 'Please answer every ownership question before continuing.';
    return '';
  };

  const isLast = activeStep === STEPS.length - 1;

  const handleNext = () => {
    setError(null);
    if (!stepValid(activeStep)) {
      setError(stepHint(activeStep));
      return;
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  return (
    <Box maxWidth={760} mx="auto">
      <Typography
        sx={{
          color: TEAL,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 12,
          mb: 0.5,
        }}
      >
        Proof of ownership
      </Typography>
      <Typography
        sx={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, fontSize: 30, color: INK, mb: 3 }}
      >
        Prove ownership
      </Typography>

      {submitted ? (
        <Card variant="outlined" sx={{ borderRadius: '24px 24px 24px 8px' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, fontSize: 22, color: INK }}>
              Verification submitted
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
              Status: <strong>{submitted.status}</strong>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={Math.round(submitted.score * 100)}
                sx={{ height: 10, borderRadius: 999 }}
              />
              <Typography variant="caption" color="text.secondary">
                AI consistency: {Math.round(submitted.score * 100)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: '24px 24px 24px 8px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 30px 60px -48px rgba(11,61,56,0.5)',
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((l) => (
            <Step key={l}>
              <StepLabel>{l}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <Stack spacing={2.5}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Answer the questions below. Our AI will compare your answers against the original listing. Strong
                matches unlock chat and reward release.
              </Alert>
              {questions?.map((q) => (
                <Box key={q.id}>
                  <Typography>{q.prompt}</Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                </Box>
              ))}
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={2.5}>
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Extra proof</Typography>
                  <AiAssistantBar
                    dense
                    value={proofText}
                    onChange={setProofText}
                    assist={api.aiAssist.bind(api)}
                    actions={['fix_grammar', 'improve_clarity', 'expand', 'formalize']}
                  />
                </Stack>
                <TextField
                  label="Extra proof (receipt info, photos URLs, IMEI…)"
                  fullWidth
                  multiline
                  minRows={2}
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                />
              </Box>
            </Stack>
          )}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackRoundedIcon />}
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                visibility: activeStep === 0 ? 'hidden' : 'visible',
              }}
            >
              Back
            </Button>
            <Typography variant="caption" color="text.secondary">
              Step {activeStep + 1} of {STEPS.length}
            </Typography>
            {isLast ? (
              <Button
                onClick={() => submit.mutate()}
                variant="contained"
                disabled={submit.isPending || !stepValid(STEPS.length - 1)}
                sx={{
                  bgcolor: MARIGOLD,
                  color: INK,
                  borderRadius: 999,
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#cf9305' },
                }}
              >
                Submit verification
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!stepValid(activeStep)}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  bgcolor: INK,
                  color: '#FBF6EC',
                  borderRadius: 999,
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#0a322e' },
                }}
              >
                Continue
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
      )}
    </Box>
  );
}
