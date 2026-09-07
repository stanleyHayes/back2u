import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
} from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { BrandMark } from '@back2u/ui-web';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const dark = useTheme().palette.mode === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const surface = dark ? '#26312B' : '#F2EFEA';
  const raised = dark
    ? '10px 10px 24px #101A14, -7px -7px 20px #35423988'
    : '10px 10px 24px #D2CDC4, -8px -8px 22px #FFFFFF';
  const inset = dark
    ? 'inset 4px 4px 9px #18211C, inset -4px -4px 9px #354039'
    : 'inset 4px 4px 9px #D8D3CA, inset -4px -4px 9px #FFFFFF';
  const fieldSx = {
    '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: surface, boxShadow: inset },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiInputLabel-root, & .MuiInputAdornment-root': { color: dark ? '#B7C7BC' : '#526052' },
    '& input::placeholder': { color: dark ? '#A9B8AD' : '#687267', opacity: 1 },
    '& .MuiInputBase-input': { py: 2 },
    '& .MuiIconButton-root': {
      color: dark ? '#D8E4DA' : '#40614A',
      width: 32,
      height: 32,
      bgcolor: surface,
      boxShadow: dark
        ? '3px 3px 6px #18211C, -3px -3px 6px #354039'
        : '3px 3px 6px #D8D3CA, -3px -3px 6px #FFFFFF',
      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
    },
  };

  const setAuth = useAuth((s) => s.set);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await api.register(form);
      setAuth({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      });
      navigate('/');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 1080,
        mx: 'auto',
        py: { xs: 0, md: 3 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
        gap: { xs: 3, md: 7 },
        alignItems: 'center',
      }}
    >
      <Box sx={{ px: { xs: 1, md: 2 }, py: { md: 4 } }}>
        <Typography
          sx={{
            fontSize: 11,
            letterSpacing: '.16em',
            fontWeight: 700,
            color: 'text.secondary',
            mb: 2,
          }}
        >
          A LITTLE HELP. A WAY BACK.
        </Typography>
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: 34, md: 52 },
            lineHeight: 1.08,
            letterSpacing: '-.045em',
            fontWeight: 700,
            maxWidth: 400,
          }}
        >
          Good people.
          <br />
          Happy returns.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2.5, lineHeight: 1.8, maxWidth: 350 }}>
          Join a community helping lost things find their way home. Your next small act could make
          someone’s day.
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 5 }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 144,
              height: 144,
              borderRadius: '50%',
              bgcolor: surface,
              boxShadow: raised,
              p: 2,
              mb: 4,
            }}
          >
            <Box
              sx={{
                height: '100%',
                borderRadius: '50%',
                boxShadow: inset,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <BrandMark size={58} onDark={dark} />
            </Box>
          </Box>
          <Stack spacing={2.5}>
            {[
              'Report what’s lost or found',
              'Follow possible matches',
              'Help make a return happen',
            ].map((text, i) => (
              <Stack key={text} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: surface,
                    boxShadow: raised,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'text.secondary',
                  }}
                >
                  0{i + 1}
                </Box>
                <Typography sx={{ fontSize: 15 }}>{text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
      <Paper
        elevation={0}
        sx={{
          bgcolor: surface,
          boxShadow: raised,
          borderRadius: '28px',
          border: '1px solid',
          borderColor: dark ? '#3A463D' : '#FFFFFF',
          p: { xs: 2.5, sm: 4.5 },
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 28, sm: 34 },
            letterSpacing: '-.035em',
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          Create your account
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3.5, fontSize: 14 }}>
          A few details, and you’re part of the community.
        </Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2.5}>
            {err && <Alert severity="error">{err}</Alert>}
            {(
              [
                {
                  key: 'name',
                  label: 'Full name',
                  placeholder: 'Your full name',
                  type: 'text',
                  autoComplete: 'name',
                  icon: <PersonOutlineRoundedIcon />,
                },
                {
                  key: 'email',
                  label: 'Email address',
                  placeholder: 'you@example.com',
                  type: 'email',
                  autoComplete: 'email',
                  icon: <MailOutlineRoundedIcon />,
                },
                {
                  key: 'phone',
                  label: 'Phone (optional)',
                  placeholder: '+233 24 123 4567',
                  type: 'tel',
                  autoComplete: 'tel',
                  icon: <PhoneOutlinedIcon />,
                },
              ] as const
            ).map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                type={field.type}
                autoComplete={field.autoComplete}
                required={field.key !== 'phone'}
                fullWidth
                sx={fieldSx}
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: <InputAdornment position="start">{field.icon}</InputAdornment>,
                    endAdornment: form[field.key] ? (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={`Clear ${field.label.toLowerCase()}`}
                          onClick={() => setForm({ ...form, [field.key]: '' })}
                          edge="end"
                        >
                          <CloseRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
              />
            ))}
            <TextField
              label="Password"
              placeholder="Create a password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              fullWidth
              sx={fieldSx}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText="Use at least 8 characters."
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { minLength: 8 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                py: 1.65,
                borderRadius: '15px',
                boxShadow: raised,
                bgcolor: dark ? '#C7D4B9' : '#40614A',
                color: dark ? '#1C2B20' : '#FFFFFF',
                '&:hover': { bgcolor: dark ? '#D8E3CC' : '#344F3D' },
                '&:active': { boxShadow: inset },
              }}
            >
              {loading ? 'Creating your account…' : 'Create account'}
            </Button>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', color: 'text.secondary', pt: 0.5 }}
            >
              Already a member?{' '}
              <Box
                component={Link}
                to="/login"
                sx={{
                  color: 'text.primary',
                  fontWeight: 700,
                  textDecorationColor: dark ? '#829B88' : '#A6B5A1',
                  textUnderlineOffset: '4px',
                }}
              >
                Sign in
              </Box>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
