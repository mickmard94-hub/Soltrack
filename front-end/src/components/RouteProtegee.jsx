import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RouteProtegee({ children }) {
  const { user, chargement } = useAuth();

  if (chargement) {
    return <p>Chargement...</p>;
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}

export default RouteProtegee;