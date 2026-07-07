import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const estActif = (chemin) => location.pathname === chemin;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/">SolTrack</Link>
        <nav className="header-nav align-items-center">
          <Link
            className={`nav-link ${estActif('/') ? 'actif' : ''}`}
            to="/"
          >
            Accueil
          </Link>

          {user && (
            <Link
              className={`nav-link ${estActif('/sols') ? 'actif' : ''}`}
              to="/sols"
            >
              Mes sols
            </Link>
          )}

          {user ? (
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>
              Déconnexion
            </button>
          ) : (
            <>
              <Link className="nav-link" to="/connexion">Connexion</Link>
              <Link className="btn btn-sm btn-outline-light" to="/inscription">S'inscrire</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;