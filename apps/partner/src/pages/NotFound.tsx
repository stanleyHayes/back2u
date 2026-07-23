import { useNavigate } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { EmptyState } from '@back2u/ui-web';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<SearchOffIcon />}
      title="Page not found"
      description="That portal page doesn't exist. It may have been moved or you followed a stale link."
      actions={[{ label: 'Back to overview', onClick: () => navigate('/') }]}
    />
  );
}
