import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
            title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
          >
            {theme === 'dark' ? <FaSun size={15} /> : <FaMoon size={15} />}
          </button>

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