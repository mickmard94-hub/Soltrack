import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaGear } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import Logo from './Logo';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const estActif = (chemin) => location.pathname === chemin;
  const surParametres = location.pathname === '/parametres';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleParametresClick = () => {
    if (surParametres) {
      navigate(-1);
    } else {
      navigate('/parametres');
    }
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/">
          <Logo size={30} />
          <span>Sòl Ansanm</span>
        </Link>
        <nav className="header-nav align-items-center">
          <Link
            className={`nav-link ${estActif('/') ? 'actif' : ''}`}
            to="/"
          >
            {t('nav.accueil')}
          </Link>

          {user && (
            <Link
              className={`nav-link ${estActif('/sols') ? 'actif' : ''}`}
              to="/sols"
            >
              {t('nav.mes_sols')}
            </Link>
          )}

          {user?.is_admin && (
            <Link
              className={`nav-link ${estActif('/admin') ? 'actif' : ''}`}
              to="/admin"
            >
              Admin
            </Link>
          )}

          <button
            type="button"
            className="theme-toggle"
            onClick={handleParametresClick}
            aria-label={t('nav.parametres')}
            title={t('nav.parametres')}
          >
            <FaGear size={14} />
          </button>

          {user ? (
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>
              {t('nav.deconnexion')}
            </button>
          ) : (
            <>
              <Link className="nav-link" to="/connexion">{t('nav.connexion')}</Link>
              <Link className="btn btn-sm btn-outline-light" to="/inscription">{t('nav.inscription')}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;