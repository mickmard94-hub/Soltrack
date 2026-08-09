import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import ScenesDeFond from '../components/ScenesDeFond';

function Accueil() {
  const { user } = useAuth();
  const { t } = useLang();

  if (user) {
    return (
      <div className="py-4">
        <span className="hero-eyebrow">{t('nav.bon_retour')}</span>
        <h1 className="mt-2">{user.name}</h1>
        <p className="text-muted mb-4" style={{ maxWidth: '32rem' }}>
          {t('accueil.retrouvez')}
        </p>
        <Link to="/sols" className="btn-sol d-inline-block">
          {t('accueil.voir_sols')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="hero-accueil">
        <ScenesDeFond />
        <div className="hero-accueil-voile"></div>
        <div className="hero-accueil-contenu text-center py-5">
          <span className="hero-eyebrow">{t('accueil.eyebrow')}</span>
          <h1 className="display-5 mt-2">Sòl Ansanm</h1>
          <p className="lead text-muted mb-4 mx-auto" style={{ maxWidth: '34rem' }}>
            {t('accueil.lead')}
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/inscription" className="btn-sol d-inline-block">
              {t('accueil.creer_compte')}
            </Link>
            <Link to="/connexion" className="btn btn-outline-secondary">
              {t('accueil.deja_compte')}
            </Link>
          </div>
        </div>
      </div>

      <div className="row my-5">
        <div className="col-12 mb-4">
          <h2 className="text-center">{t('accueil.pourquoi_titre')}</h2>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title" style={{ fontSize: '1.25rem' }}>{t('accueil.probleme_titre')}</h3>
              <p className="card-text">{t('accueil.probleme_texte')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title" style={{ fontSize: '1.25rem' }}>{t('accueil.vision_titre')}</h3>
              <p className="card-text">{t('accueil.vision_texte')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title" style={{ fontSize: '1.25rem' }}>{t('accueil.mobile_titre')}</h3>
              <p className="card-text">{t('accueil.mobile_texte')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row my-5">
        <div className="col-12 mb-4">
          <h2 className="text-center">{t('accueil.etapes_titre')}</h2>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">01</span>
              <h3 className="card-title mt-2" style={{ fontSize: '1rem' }}>{t('accueil.etape1_titre')}</h3>
              <p className="card-text small">{t('accueil.etape1_texte')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">02</span>
              <h3 className="card-title mt-2" style={{ fontSize: '1rem' }}>{t('accueil.etape2_titre')}</h3>
              <p className="card-text small">{t('accueil.etape2_texte')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">03</span>
              <h3 className="card-title mt-2" style={{ fontSize: '1rem' }}>{t('accueil.etape3_titre')}</h3>
              <p className="card-text small">{t('accueil.etape3_texte')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">04</span>
              <h3 className="card-title mt-2" style={{ fontSize: '1rem' }}>{t('accueil.etape4_titre')}</h3>
              <p className="card-text small">{t('accueil.etape4_texte')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <h4>{t('accueil.cta_titre')}</h4>
        <Link to="/inscription" className="btn-dore d-inline-block mt-2">
          {t('accueil.cta_bouton')}
        </Link>
      </div>
    </div>
  );
}

export default Accueil;