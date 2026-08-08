import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';

const PAGES = ['accueil', 'mes_sols', 'detail_sol', 'cotisations', 'parametres'];

function BoutonChoix({ actif, onClick, children }) {
  return (
    <button
      type="button"
      className={actif ? 'btn-sol border-0' : 'btn btn-outline-secondary'}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Avis() {
  const { user } = useAuth();
  const { t } = useLang();

  const [aime, setAime] = useState(null);
  const [meilleuresPages, setMeilleuresPages] = useState([]);
  const [pagesAAmeliorer, setPagesAAmeliorer] = useState([]);
  const [recommande, setRecommande] = useState(null);

  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState(null);

  const toggleMeilleurePage = (page) => {
    setMeilleuresPages((actuel) =>
      actuel.includes(page) ? actuel.filter((p) => p !== page) : [...actuel, page]
    );
  };

  const togglePageAAmeliorer = (page) => {
    setPagesAAmeliorer((actuel) =>
      actuel.includes(page) ? actuel.filter((p) => p !== page) : [...actuel, page]
    );
  };

  // Au moins UNE réponse suffit — on ne force personne à tout remplir.
  const auMoinsUneReponse =
    aime !== null || meilleuresPages.length > 0 || pagesAAmeliorer.length > 0 || recommande !== null;

  const handleEnvoyer = () => {
    setEnvoi(true);
    setErreur(null);

    api.post('/feedback', {
      aime,
      meilleures_pages: meilleuresPages,
      pages_a_ameliorer: pagesAAmeliorer,
      recommande,
    })
      .then(() => {
        setEnvoi(false);
        setEnvoye(true);
      })
      .catch((error) => {
        setEnvoi(false);
        if (error.response?.status === 422 && error.response.data.message) {
          setErreur(error.response.data.message);
        } else {
          console.error('Erreur lors de l\'envoi de l\'avis :', error);
        }
      });
  };

  if (envoye) {
    return (
      <div className="row justify-content-center py-4">
        <div className="col-md-8 col-lg-6 text-center">
          <div className="card">
            <div className="card-body py-5">
              <h2 className="mb-2">{t('avis.merci_titre')}</h2>
              <p className="text-muted mb-4">{t('avis.merci_texte')}</p>
              <Link to={user ? '/sols' : '/'} className="btn-sol d-inline-block">
                {t('avis.retour_accueil')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to={user ? '/sols' : '/'} className="btn btn-sm btn-outline-secondary mb-3">
          ← {t('common.retour')}
        </Link>
        <br />
        <span className="hero-eyebrow">{t('nav.parametres')}</span>
        <h1 className="mt-1 mb-2">{t('avis.titre')}</h1>
        <p className="text-muted mb-4">{t('avis.intro')}</p>

        {erreur && <div className="alert alert-danger">{erreur}</div>}

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title mb-3">{t('avis.q1')}</h6>
            <div className="d-flex gap-2">
              <BoutonChoix actif={aime === true} onClick={() => setAime(aime === true ? null : true)}>
                {t('avis.oui')}
              </BoutonChoix>
              <BoutonChoix actif={aime === false} onClick={() => setAime(aime === false ? null : false)}>
                {t('avis.non')}
              </BoutonChoix>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title mb-1">{t('avis.q2')}</h6>
            <p className="text-muted small mb-3">{t('avis.multichoice_hint')}</p>
            <div className="d-flex flex-wrap gap-2">
              {PAGES.map((page) => (
                <BoutonChoix
                  key={page}
                  actif={meilleuresPages.includes(page)}
                  onClick={() => toggleMeilleurePage(page)}
                >
                  {t(`avis.page_${page}`)}
                </BoutonChoix>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title mb-1">{t('avis.q3')}</h6>
            <p className="text-muted small mb-3">{t('avis.multichoice_hint')}</p>
            <div className="d-flex flex-wrap gap-2">
              {PAGES.map((page) => (
                <BoutonChoix
                  key={page}
                  actif={pagesAAmeliorer.includes(page)}
                  onClick={() => togglePageAAmeliorer(page)}
                >
                  {t(`avis.page_${page}`)}
                </BoutonChoix>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title mb-3">{t('avis.q4')}</h6>
            <div className="d-flex gap-2">
              <BoutonChoix actif={recommande === true} onClick={() => setRecommande(recommande === true ? null : true)}>
                {t('avis.oui')}
              </BoutonChoix>
              <BoutonChoix actif={recommande === false} onClick={() => setRecommande(recommande === false ? null : false)}>
                {t('avis.non')}
              </BoutonChoix>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-dore border-0 w-100"
          disabled={!auMoinsUneReponse || envoi}
          onClick={handleEnvoyer}
        >
          {envoi ? t('avis.envoi') : t('avis.envoyer')}
        </button>
      </div>
    </div>
  );
}

export default Avis;
