import { Box, Stack, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';

export const workspaceHeading = {
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 600,
  letterSpacing: '-.025em',
};
export const workspacePanel = {
  bgcolor: 'background.default',
  borderRadius: '24px',
  boxShadow: 'var(--workspace-raised)',
  p: { xs: 2.5, md: 3 },
  minWidth: 0,
};

export function PartnerWorkspace({ children }: { children: ReactNode }) {
  const dark = useTheme().palette.mode === 'dark';
  return (
    <Box
      component="main"
      sx={{
        '--workspace-raised': dark
          ? '7px 7px 18px rgba(0,0,0,.28), -5px -5px 15px rgba(105,128,91,.08)'
          : '7px 7px 18px #dcded5, -5px -5px 15px #ffffff',
        '--workspace-inset': dark
          ? 'inset 3px 3px 8px rgba(0,0,0,.32), inset -3px -3px 8px rgba(105,128,91,.10)'
          : 'inset 3px 3px 8px #dcded5, inset -3px -3px 8px #ffffff',
        '--workspace-green': dark ? '#B0C9A5' : '#42633E',
        '--workspace-amber': dark ? '#DCB88C' : '#926031',
        '& .MuiCard-root': {
          bgcolor: 'background.default',
          boxShadow: 'var(--workspace-raised)',
          border: 'none',
          borderRadius: '24px',
          minWidth: 0,
        },
        '& .MuiCardContent-root': { p: { xs: 2.5, md: 3 } },
        '& .MuiOutlinedInput-root': { borderRadius: '13px', boxShadow: 'var(--workspace-inset)' },
        '& .MuiChip-root': { boxShadow: 'none', textTransform: 'capitalize', fontSize: 11 },
        '& .MuiButton-root': { borderRadius: '12px' },
        '& .MuiTableContainer-root': { borderRadius: '18px', boxShadow: 'var(--workspace-inset)' },
        '& .MuiTableCell-head': { fontSize: 11, color: 'text.secondary', bgcolor: 'action.hover' },
        '& .MuiTableCell-body': { py: 1.5 },
      }}
    >
      {children}
    </Box>
  );
}

export function WorkspaceHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
    >
      <Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', color: 'var(--workspace-green)', mb: 1.5 }}
        >
          <Box sx={{ display: 'flex', '& svg': { fontSize: 19 } }}>{icon}</Box>
          <Typography
            sx={{ color: 'text.secondary', fontSize: 11, letterSpacing: '.14em', fontWeight: 700 }}
          >
            PARTNER WORKSPACE
          </Typography>
        </Stack>
        <Typography
          component="h1"
          sx={{ ...workspaceHeading, fontSize: { xs: 30, md: 38 }, lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.7, mt: 1, maxWidth: 660 }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {actions}
    </Stack>
  );
}
