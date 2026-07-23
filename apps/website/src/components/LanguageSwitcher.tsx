import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem, Box } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface LanguageOption {
  code: string;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'tw', label: 'Twi' },
  { code: 'ga', label: 'Ga' },
  { code: 'ee', label: 'Ewe' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelect = useCallback(
    (code: string) => {
      i18n.changeLanguage(code);
      localStorage.setItem('i18nextLng', code);
      handleClose();
    },
    [i18n, handleClose],
  );

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]!;

  return (
    <Box>
      <Button
        id="language-switcher-button"
        aria-controls={open ? 'language-switcher-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          minWidth: 0,
          px: 1.5,
          py: 0.5,
          fontWeight: 600,
          fontSize: '0.875rem',
          color: 'text.primary',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {currentLang.code.toUpperCase()}
      </Button>
      <Menu
        id="language-switcher-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'language-switcher-button',
            dense: true,
          },
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 140,
              borderRadius: 1,
              boxShadow: 3,
            },
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === currentLang.code}
            onClick={() => handleSelect(lang.code)}
            sx={{
              fontSize: '0.875rem',
              fontWeight: lang.code === currentLang.code ? 600 : 400,
            }}
          >
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
