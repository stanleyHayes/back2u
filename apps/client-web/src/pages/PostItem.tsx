import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import type { CreateItemInput, ItemImage } from '@back2u/shared-types';
import { DEFAULT_CURRENCY } from '@back2u/shared-types';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';
import { uploadImage } from '../lib/cloudinary-upload.js';
import { useAuth } from '../lib/auth.store.js';
import { isFlagEnabled } from '../lib/feature-flags.js';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete.js';
import { AiAssistantBar } from '@back2u/ui-web';

const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const CATEGORIES = [
  'Phone',
  'Wallet',
  'Keys',
  'Bag',
  'ID',
  'Laptop',
  'Jewelry',
  'Document',
  'Other',
];
const STEPS = ['Type', 'Photos', 'Details', 'Location'];

export function PostItemPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const featureFlags = useAuth((s) => s.featureFlags);
  const aiAutoSuggestEnabled = isFlagEnabled(featureFlags, 'ai_auto_suggest', user?.id);

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<Omit<CreateItemInput, 'images' | 'occurredAt' | 'place'>>({
    kind: 'lost',
    classification: 'lost',
    title: '',
    description: '',
    category: 'Phone',
    tags: [],
  });
  const [placeName, setPlaceName] = useState('');
  const [lng, setLng] = useState('');
  const [lat, setLat] = useState('');
  // The place name the current lng/lat were resolved for — lets us skip re-geocoding
  // when the user picked a suggestion and didn't edit it afterward.
  const [coordsName, setCoordsName] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [images, setImages] = useState<ItemImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const hasAutoSuggested = useRef(false);

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setErr(null);
    try {
      const uploaded = await Promise.all(Array.from(files).slice(0, 8).map(uploadImage));
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!aiAutoSuggestEnabled) return;
    if (images.length === 1 && !hasAutoSuggested.current) {
      hasAutoSuggested.current = true;
      setAiLoading(true);
      api
        .describeImage(images[0]!.url)
        .then((ai) => {
          setForm((prev) => ({
            ...prev,
            title: prev.title || ai.title || prev.title,
            description: prev.description || ai.description || prev.description,
          }));
          if (ai.tags && ai.tags.length > 0) {
            setSuggestedTags(ai.tags);
            setSuggestionsVisible(true);
          }
        })
        .catch((e: unknown) => {
          setErr(e instanceof Error ? e.message : 'AI describe failed');
        })
        .finally(() => {
          setAiLoading(false);
        });
    }
  }, [images, aiAutoSuggestEnabled]);

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      if (images.length === 0) throw new Error('Add at least one photo');
      const name = placeName.trim();
      if (!name) throw new Error('Add a location — type a place and pick it from the list.');
      // Use the coordinates from the picked suggestion; if the user typed a place
      // without selecting (or edited it after), geocode the name now.
      let useLng = lng;
      let useLat = lat;
      if (!useLng || !useLat || coordsName !== name) {
        const [first] = await api.searchPlaces(name, { limit: 1 });
        if (!first)
          throw new Error("We couldn't find that place. Try a nearby landmark, area, or town.");
        useLng = String(first.lng);
        useLat = String(first.lat);
      }
      const item = await api.createItem({
        ...form,
        images,
        occurredAt: new Date(occurredAt).toISOString(),
        place: {
          name,
          point: { type: 'Point', coordinates: [Number(useLng), Number(useLat)] },
        },
      });
      navigate(`/items/${item.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Per-step gate: keeps users from advancing past a step with missing essentials.
  const stepValid = (step: number): boolean => {
    if (step === 1) return images.length > 0;
    if (step === 2) return form.title.trim().length > 0 && form.description.trim().length > 0;
    if (step === 3) return placeName.trim().length > 0;
    return true;
  };
  const stepHint = (step: number): string => {
    if (step === 1) return 'Add at least one photo to continue.';
    if (step === 2) return 'A title and description are required.';
    if (step === 3) return 'Add a location — type a place and pick it from the list.';
    return '';
  };

  const isLast = activeStep === STEPS.length - 1;
  const handleNext = () => {
    setErr(null);
    if (!stepValid(activeStep)) {
      setErr(stepHint(activeStep));
      return;
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const handleBack = () => {
    setErr(null);
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
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
        {form.kind === 'lost' ? 'Report a loss' : 'Report a find'}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontWeight: 600,
          fontSize: 30,
          color: INK,
          mb: 3,
        }}
      >
        Post an item
      </Typography>

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
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Stack spacing={2.5}>
          {err && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {err}
            </Alert>
          )}

          {/* STEP 0 — Type */}
          {activeStep === 0 && (
            <Stack spacing={2.5}>
              <Typography sx={{ fontWeight: 700, color: INK }}>What are you reporting?</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Type"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as 'lost' | 'found' })}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="lost">I lost something</MenuItem>
                  <MenuItem value="found">I found something</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Classification"
                  value={form.classification}
                  onChange={(e) =>
                    setForm({ ...form, classification: e.target.value as 'lost' | 'stolen' })
                  }
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="lost">Lost</MenuItem>
                  <MenuItem value="stolen">Stolen (escalate)</MenuItem>
                </TextField>
              </Stack>
              <TextField
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}

          {/* STEP 1 — Photos */}
          {activeStep === 1 && (
            <Stack spacing={2}>
              <Typography sx={{ fontWeight: 700, color: INK }}>Add photos</Typography>
              <Typography variant="body2" color="text.secondary">
                Clear photos dramatically improve AI matching.{' '}
                {aiAutoSuggestEnabled &&
                  'We’ll auto-suggest a title and description from your first photo.'}
              </Typography>
              <Box
                component="label"
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  gap: 1,
                  py: 5,
                  borderRadius: 3,
                  border: '2px dashed',
                  borderColor: uploading ? TEAL : 'divider',
                  cursor: 'pointer',
                  color: 'text.secondary',
                  transition: 'border-color .15s, background-color .15s',
                  '&:hover': { borderColor: TEAL, bgcolor: 'rgba(15,118,110,0.04)' },
                }}
              >
                {uploading ? (
                  <CircularProgress size={26} />
                ) : (
                  <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 34, color: TEAL }} />
                )}
                <Typography sx={{ fontWeight: 600 }}>
                  {uploading ? 'Uploading…' : 'Tap to add photos'}
                </Typography>
                <Typography variant="caption">Up to 8 images</Typography>
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => onPickFiles(e.target.files)}
                />
              </Box>

              {images.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                  {images.map((img) => (
                    <Box
                      key={img.publicId}
                      component="img"
                      src={img.url}
                      sx={{
                        width: 88,
                        height: 88,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ))}
                </Stack>
              )}

              {aiLoading && (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Analysing image…
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}

          {/* STEP 2 — Details */}
          {activeStep === 2 && (
            <Stack spacing={2.5}>
              <Typography sx={{ fontWeight: 700, color: INK }}>Describe it</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TextField
                  label="Title"
                  required
                  fullWidth
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                {images[0] && aiAutoSuggestEnabled && (
                  <Button
                    onClick={async () => {
                      try {
                        setAiLoading(true);
                        const ai = await api.describeImage(images[0]!.url);
                        setForm((prev) => ({
                          ...prev,
                          title: ai.title || prev.title,
                          description: ai.description || prev.description,
                          tags: ai.tags || prev.tags,
                        }));
                        if (ai.tags && ai.tags.length > 0) {
                          setSuggestedTags(ai.tags);
                          setSuggestionsVisible(true);
                        }
                      } catch (e: unknown) {
                        setErr(e instanceof Error ? e.message : 'AI describe failed');
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    disabled={aiLoading}
                    sx={{ whiteSpace: 'nowrap', color: TEAL, fontWeight: 700 }}
                  >
                    ✨ AI describe
                  </Button>
                )}
              </Stack>
              <Box>
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <AiAssistantBar
                    dense
                    value={form.description}
                    onChange={(text) => setForm((prev) => ({ ...prev, description: text }))}
                    assist={api.aiAssist.bind(api)}
                    actions={[
                      'fix_grammar',
                      'improve_clarity',
                      'expand',
                      'formalize',
                      'make_casual',
                      'summarize',
                      'translate',
                    ]}
                  />
                </Stack>
                <TextField
                  label="Description"
                  required
                  multiline
                  minRows={4}
                  fullWidth
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Box>
              {aiLoading && (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Analysing image…
                  </Typography>
                </Stack>
              )}
              {suggestionsVisible && suggestedTags.length > 0 && (
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                    useFlexGap
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                      AI suggests:
                    </Typography>
                    {suggestedTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() =>
                          setForm((prev) => {
                            const current = prev.tags ?? [];
                            return {
                              ...prev,
                              tags: current.includes(tag) ? current : [...current, tag],
                            };
                          })
                        }
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                    <Button
                      size="small"
                      onClick={() => setSuggestionsVisible(false)}
                      sx={{ ml: 'auto' }}
                    >
                      Dismiss suggestions
                    </Button>
                  </Stack>
                </Box>
              )}
              {form.tags && form.tags.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                  {form.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() =>
                        setForm((prev) => ({
                          ...prev,
                          tags: (prev.tags ?? []).filter((t) => t !== tag),
                        }))
                      }
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {/* STEP 3 — Location, time & reward */}
          {activeStep === 3 && (
            <Stack spacing={2.5}>
              <Typography sx={{ fontWeight: 700, color: INK }}>Where &amp; when</Typography>
              <PlaceAutocomplete
                label="Where was it?"
                value={placeName}
                proximity={{ lng: -0.187, lat: 5.603 }}
                required
                onChange={(name) => setPlaceName(name)}
                onSelect={(place) => {
                  if (place) {
                    setPlaceName(place.name);
                    setLng(String(place.lng));
                    setLat(String(place.lat));
                    setCoordsName(place.name);
                  } else {
                    setLng('');
                    setLat('');
                    setCoordsName('');
                  }
                }}
                helperText={
                  lng && lat && coordsName === placeName.trim()
                    ? `📍 Location set — ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
                    : 'Type a place or landmark and pick it from the list — we’ll add the map pin for you.'
                }
              />
              <TextField
                type="datetime-local"
                label="When"
                slotProps={{ inputLabel: { shrink: true } }}
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
              <TextField
                label={`Reward (${DEFAULT_CURRENCY}, optional)`}
                type="number"
                onChange={(e) =>
                  setForm({
                    ...form,
                    rewardAmount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </Stack>
          )}

          {/* Footer nav */}
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
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
                onClick={submit}
                variant="contained"
                disabled={submitting || !stepValid(3)}
                sx={{
                  bgcolor: MARIGOLD,
                  color: INK,
                  borderRadius: 999,
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#cf9305' },
                }}
              >
                {submitting ? 'Posting…' : 'Post item'}
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
    </Box>
  );
}
