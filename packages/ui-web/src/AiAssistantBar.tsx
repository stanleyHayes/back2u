import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

/* Types mirror @back2u/shared-types (kept local so ui-web stays dependency-light;
   structural typing makes api.aiAssist assignable to the `assist` prop). */
export type AiAssistAction =
  | 'formalize'
  | 'summarize'
  | 'make_casual'
  | 'expand'
  | 'fix_grammar'
  | 'improve_clarity'
  | 'generate_title'
  | 'generate_message'
  | 'create_from_prompt'
  | 'translate';

export interface AiAssistInput {
  action: AiAssistAction;
  text?: string;
  prompt?: string;
  context?: string;
  tone?: string;
  language?: string;
}

export interface AiAssistResult {
  action: AiAssistAction;
  text: string;
}

type Tone = 'teal' | 'marigold' | 'clay';
const TONES: Record<Tone, { main: string; soft: string }> = {
  teal: { main: '#0F766E', soft: 'rgba(15,118,110,0.10)' },
  marigold: { main: '#B8860B', soft: 'rgba(224,161,6,0.12)' },
  clay: { main: '#C2410C', soft: 'rgba(194,65,12,0.10)' },
};

const ACTION_META: Record<AiAssistAction, { label: string; needs?: 'prompt' | 'language' }> = {
  fix_grammar: { label: 'Fix spelling & grammar' },
  improve_clarity: { label: 'Improve clarity' },
  formalize: { label: 'Make it professional' },
  make_casual: { label: 'Make it casual' },
  summarize: { label: 'Summarize' },
  expand: { label: 'Add more detail' },
  generate_title: { label: 'Suggest a title' },
  generate_message: { label: 'Draft a message…', needs: 'prompt' },
  create_from_prompt: { label: 'Write from a prompt…', needs: 'prompt' },
  translate: { label: 'Translate…', needs: 'language' },
};

const DEFAULT_ACTIONS: AiAssistAction[] = [
  'fix_grammar',
  'improve_clarity',
  'formalize',
  'make_casual',
  'summarize',
  'expand',
  'translate',
];

const DEFAULT_LANGUAGES = ['French', 'Twi', 'Ga', 'Ewe', 'Hausa', 'English'];

function SparkleIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5l1.8 5.2a4 4 0 0 0 2.5 2.5l5.2 1.8-5.2 1.8a4 4 0 0 0-2.5 2.5L12 21.5l-1.8-5.2a4 4 0 0 0-2.5-2.5L2.5 12l5.2-1.8a4 4 0 0 0 2.5-2.5L12 2.5z"
        fill={color}
      />
      <path d="M19 3.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" fill={color} opacity={0.7} />
    </svg>
  );
}

export interface AiAssistantBarProps {
  /** Full current text of the field. */
  value: string;
  /** Apply text back to the field (replace / insert). */
  onChange: (next: string) => void;
  /** Calls the API (e.g. api.aiAssist). */
  assist: (input: AiAssistInput) => Promise<AiAssistResult>;
  /** Which actions to offer (defaults to a general writing set). */
  actions?: AiAssistAction[];
  /** Optional: return the user's current selection to operate on it instead of the full text. */
  getSelection?: () => string;
  /** Extra context (e.g. the body when generating a title). */
  context?: string;
  /** Languages offered for translate. */
  languages?: string[];
  tone?: Tone;
  label?: string;
  dense?: boolean;
  disabled?: boolean;
}

export function AiAssistantBar({
  value,
  onChange,
  assist,
  actions = DEFAULT_ACTIONS,
  getSelection,
  context,
  languages = DEFAULT_LANGUAGES,
  tone = 'teal',
  label = 'AI assist',
  dense,
  disabled,
}: AiAssistantBarProps) {
  const t = TONES[tone];
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [dialogAction, setDialogAction] = useState<AiAssistAction | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [language, setLanguage] = useState(languages[0] ?? 'French');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [copied, setCopied] = useState(false);

  const menuOpen = Boolean(anchorEl);
  const dialogOpen = dialogAction !== null;

  const reset = () => {
    setDialogAction(null);
    setPromptValue('');
    setLoading(false);
    setError(null);
    setDraft(null);
    setSourceText('');
    setConfirmReplace(false);
    setCopied(false);
  };

  const runAssist = async (action: AiAssistAction, extra?: { prompt?: string; language?: string }) => {
    const selection = getSelection?.().trim() ?? '';
    const source = selection || value;
    setSourceText(selection && selection !== value ? selection : '');
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const result = await assist({
        action,
        text: source || undefined,
        prompt: extra?.prompt,
        language: extra?.language,
        context: action === 'generate_title' ? context ?? value : undefined,
      });
      setDraft(result.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The assistant could not complete that. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickAction = (action: AiAssistAction) => {
    setAnchorEl(null);
    setError(null);
    setDraft(null);
    setConfirmReplace(false);
    setDialogAction(action);
    const needs = ACTION_META[action].needs;
    if (!needs) void runAssist(action);
  };

  const submitDialogInput = () => {
    if (!dialogAction) return;
    const needs = ACTION_META[dialogAction].needs;
    if (needs === 'prompt') void runAssist(dialogAction, { prompt: promptValue.trim() });
    else if (needs === 'language') void runAssist(dialogAction, { language });
  };

  const applyReplace = () => {
    if (draft === null) return;
    // If we transformed a selection that's still present, swap just that span.
    if (sourceText && value.includes(sourceText)) {
      onChange(value.replace(sourceText, draft));
      reset();
      return;
    }
    if (value.trim() && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    onChange(draft);
    reset();
  };

  const applyInsert = () => {
    if (draft === null) return;
    onChange(value.trim() ? `${value}\n\n${draft}` : draft);
    reset();
  };

  const copyDraft = () => {
    if (draft === null) return;
    navigator.clipboard?.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const needsInput = dialogAction ? ACTION_META[dialogAction].needs : undefined;
  const awaitingInput = needsInput && draft === null && !loading;

  let dialogBody: ReactNode = null;
  if (loading) {
    dialogBody = (
      <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 5 }}>
        <CircularProgress size={28} sx={{ color: t.main }} />
        <Typography variant="body2" color="text.secondary">
          Writing…
        </Typography>
      </Stack>
    );
  } else if (awaitingInput) {
    dialogBody =
      needsInput === 'language' ? (
        <TextField
          select
          fullWidth
          label="Translate into"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ mt: 1 }}
        >
          {languages.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          label={dialogAction === 'generate_message' ? 'What should the message say?' : 'What should I write?'}
          placeholder={
            dialogAction === 'generate_message'
              ? 'e.g. remind the finder to drop the item at the front desk by Friday'
              : 'e.g. a friendly announcement about our new reward partners'
          }
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          sx={{ mt: 1 }}
        />
      );
  } else if (draft !== null) {
    dialogBody = (
      <Stack spacing={1.5}>
        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={16}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          label="Suggested text (editable)"
        />
        {confirmReplace && (
          <Alert severity="warning" sx={{ alignItems: 'center' }}>
            This replaces your current text. Replace it?
          </Alert>
        )}
      </Stack>
    );
  }

  return (
    <>
      <Button
        type="button"
        size={dense ? 'small' : 'medium'}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={disabled}
        startIcon={<SparkleIcon size={dense ? 14 : 16} />}
        sx={{
          color: t.main,
          bgcolor: t.soft,
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          px: dense ? 1.25 : 1.75,
          py: dense ? 0.25 : 0.5,
          '&:hover': { bgcolor: t.soft, filter: 'brightness(0.97)' },
        }}
      >
        {label}
      </Button>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={() => setAnchorEl(null)}>
        {actions.map((action, i) => {
          const meta = ACTION_META[action];
          const showDivider = i > 0 && (action === 'translate' || action === 'generate_title');
          return [
            showDivider ? <Divider key={`${action}-d`} sx={{ my: 0.5 }} /> : null,
            <MenuItem key={action} onClick={() => pickAction(action)} sx={{ minWidth: 220 }}>
              <ListItemText primary={meta.label} />
            </MenuItem>,
          ];
        })}
      </Menu>

      <Dialog open={dialogOpen} onClose={reset} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <Box sx={{ color: t.main, display: 'inline-flex' }}>
            <SparkleIcon size={18} color={t.main} />
          </Box>
          {dialogAction ? ACTION_META[dialogAction].label.replace('…', '') : 'AI assist'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}
          {dialogBody}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {awaitingInput ? (
            <>
              <Button onClick={reset} color="inherit">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={submitDialogInput}
                disabled={needsInput === 'prompt' && !promptValue.trim()}
                sx={{ bgcolor: t.main, '&:hover': { bgcolor: t.main } }}
              >
                Generate
              </Button>
            </>
          ) : draft !== null ? (
            <Stack direction="row" spacing={1} sx={{ width: '100%' }} alignItems="center">
              <Button onClick={reset} color="inherit">
                Discard
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={copyDraft} color="inherit">
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={applyInsert} color="inherit">
                Insert below
              </Button>
              <Button
                variant="contained"
                onClick={applyReplace}
                sx={{ bgcolor: t.main, '&:hover': { bgcolor: t.main } }}
              >
                {confirmReplace ? 'Confirm replace' : 'Replace'}
              </Button>
            </Stack>
          ) : (
            <Button onClick={reset} color="inherit">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
