import Dashboard from './Dashboard';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isStaff, loading } = useUserRole();
  if (loading) return null;
  if (isStaff) return <Navigate to="/pay-collection" replace />;
  return <Dashboard />;
};

export default Index;
