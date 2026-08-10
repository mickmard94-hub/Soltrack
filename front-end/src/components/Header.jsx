import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaGear, FaBell } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';
import Logo from './Logo';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const estActif = (chemin) => location.pathname === chemin;
  const surParametres = location.pathname === '/parametres';
  const surNotifications = location.pathname === '/notifications';

  const [nonLues, setNonLues] = useState(0);

  useEffect(() => {
    if (!user) return;

    const charger = () => {
      api.get('/notifications/non-lues-count')
        .then((response) => setNonLues(response.data.compte))
        .catch(() => {});
    };

    charger();
    const intervalle = setInterval(charger, 60000);
    return () => clearInterval(intervalle);
  }, [user, location.pathname]);

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

  const handleNotificationsClick = () => {
    if (surNotifications) {
      navigate(-1);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/">
          <Logo size={30} />
          <span>Sòl Ansanm</span>
        </Link>
        <nav className="header-nav align-items-center" aria-label="Navigation principale">
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

          {user && (
            <button
              type="button"
              className="theme-toggle position-relative"
              onClick={handleNotificationsClick}
              aria-label={t('notifications.titre')}
              title={t('notifications.titre')}
            >
              <FaBell size={14} />
              {nonLues > 0 && (
                <span
                  className="position-absolute"
                  style={{
                    top: -2, right: -2, minWidth: 16, height: 16,
                    borderRadius: '50%', background: 'var(--corail)',
                    color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}
                >
                  {nonLues > 9 ? '9+' : nonLues}
                </span>
              )}
            </button>
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