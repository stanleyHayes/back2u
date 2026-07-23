import { useNavigate } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { EmptyState } from '@back2u/ui-web';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<SearchOffIcon />}
      title="Page not found"
      description="That page doesn't exist or may have moved. Let's get you back to the feed."
      actions={[
        { label: 'Back to feed', onClick: () => navigate('/') },
        { label: 'Browse the map', variant: 'secondary', onClick: () => navigate('/map') },
      ]}
    />
  );
}
