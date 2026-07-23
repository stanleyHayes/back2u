import { useState } from 'react';
import {
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PublicIcon from '@mui/icons-material/Public';
import IosShareIcon from '@mui/icons-material/IosShare';

import { api } from '../lib/api.js';

interface ShareButtonProps {
  itemId?: string;
  url?: string;
  message?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

export function ShareButton({
  itemId,
  url: urlProp,
  message: messageProp,
  title,
  size = 'small',
}: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareData, setShareData] = useState<{ url: string; message: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const open = Boolean(anchorEl);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const getShareData = async (): Promise<{ url: string; message: string }> => {
    if (urlProp && messageProp) {
      return { url: urlProp, message: messageProp };
    }
    if (shareData) {
      return shareData;
    }
    if (itemId) {
      const result = await api.getShareCard(itemId);
      const data = { url: result.url, message: result.message };
      setShareData(data);
      return data;
    }
    throw new Error('Either itemId or both url and message must be provided');
  };

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch {
      showSnackbar('Failed to share', 'error');
    } finally {
      handleCloseMenu();
    }
  };

  const handleCopyLink = () =>
    handleAction(async () => {
      const { url } = await getShareData();
      await navigator.clipboard.writeText(url);
      showSnackbar('Link copied to clipboard!', 'success');
    });

  const handleWhatsApp = () =>
    handleAction(async () => {
      const { url, message } = await getShareData();
      const text = encodeURIComponent(`${message} ${url}`);
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    });

  const handleX = () =>
    handleAction(async () => {
      const { url } = await getShareData();
      window.open(
        `https://twitter.com/intent/tweet?text=&url=${encodeURIComponent(url)}`,
        '_blank',
        'noopener,noreferrer',
      );
    });

  const handleFacebook = () =>
    handleAction(async () => {
      const { url } = await getShareData();
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        '_blank',
        'noopener,noreferrer',
      );
    });

  const handleNativeShare = () =>
    handleAction(async () => {
      const { url, message } = await getShareData();
      const shareTitle = title || 'Back2u';
      if (navigator.share) {
        try {
          await navigator.share({ title: shareTitle, text: message, url });
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            return;
          }
          await navigator.clipboard.writeText(`${message}\n${url}`);
          showSnackbar('Link copied to clipboard!', 'success');
        }
      }
    });

  const handleButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;

    if (urlProp && messageProp) {
      setAnchorEl(target);
      return;
    }

    if (shareData) {
      setAnchorEl(target);
      return;
    }

    setLoading(true);
    try {
      const result = await api.getShareCard(itemId!);
      setShareData({ url: result.url, message: result.message });
      setAnchorEl(target);
    } catch {
      showSnackbar('Failed to get share link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton size={size} onClick={handleButtonClick} disabled={loading} aria-label="Share">
        {loading ? (
          <CircularProgress size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} />
        ) : (
          <ShareIcon fontSize={size} />
        )}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleWhatsApp}>
          <ListItemIcon>
            <ChatBubbleOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleX}>
          <ListItemIcon>
            <AlternateEmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on X</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFacebook}>
          <ListItemIcon>
            <PublicIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on Facebook</ListItemText>
        </MenuItem>
        {typeof navigator !== 'undefined' &&
          !!(navigator as Navigator & { share?: unknown }).share && (
            <MenuItem onClick={handleNativeShare}>
              <ListItemIcon>
                <IosShareIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Native share</ListItemText>
            </MenuItem>
          )}
      </Menu>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
