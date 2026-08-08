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

  const [reponses, setReponses] = useState({
    aime: null,
    meilleure_page: null,
    page_a_ameliorer: null,
    recommande: null,
  });
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const repondre = (question, valeur) => {
    setReponses((r) => ({ ...r, [question]: valeur }));
  };

  const toutesRepondues = Object.values(reponses).every((v) => v !== null);

  const handleEnvoyer = () => {
    setEnvoi(true);
    api.post('/feedback', reponses)
      .then(() => {
        setEnvoi(false);
        setEnvoye(true);
      })
      .catch((error) => {
        console.error('Erreur lors de l\'envoi de l\'avis :', error);
        setEnvoi(false);
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

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title mb-3">{t('avis.q1')}</h6>
            <div className="d-flex gap-2">
              <BoutonChoix actif={reponses.aime === true} onClick={() => repondre('aime', true)}>
                {t('avis.oui')}
              </BoutonChoix>
              <BoutonChoix actif={reponses.aime === false} onClick={() => repondre('aime', false)}>
                {t('avis.non')}
              </BoutonChoix>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title mb-3">{t('avis.q2')}</h6>
            <div className="d-flex flex-wrap gap-2">
              {PAGES.map((page) => (
                <BoutonChoix
                  key={page}
                  actif={reponses.meilleure_page === page}
                  onClick={() => repondre('meilleure_page', page)}
                >
                  {t(`avis.page_${page}`)}
                </BoutonChoix>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title mb-3">{t('avis.q3')}</h6>
            <div className="d-flex flex-wrap gap-2">
              {PAGES.map((page) => (
                <BoutonChoix
                  key={page}
                  actif={reponses.page_a_ameliorer === page}
                  onClick={() => repondre('page_a_ameliorer', page)}
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
              <BoutonChoix actif={reponses.recommande === true} onClick={() => repondre('recommande', true)}>
                {t('avis.oui')}
              </BoutonChoix>
              <BoutonChoix actif={reponses.recommande === false} onClick={() => repondre('recommande', false)}>
                {t('avis.non')}
              </BoutonChoix>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-dore border-0 w-100"
          disabled={!toutesRepondues || envoi}
          onClick={handleEnvoyer}
        >
          {envoi ? t('avis.envoi') : t('avis.envoyer')}
        </button>
      </div>
    </div>
  );
}

export default Avis;