import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function calculerDateFinSol(sol) {
  const joursParTour = sol.frequence_jours || (sol.frequence === 'hebdomadaire' ? 7 : 30);
  const [annee, mois, jour] = sol.date_debut.slice(0, 10).split('-').map(Number);
  const debutUTC = Date.UTC(annee, mois - 1, jour);
  const finUTC = debutUTC + (joursParTour * sol.nombre_tours - 1) * 86400000;
  return new Date(finUTC).toISOString().slice(0, 10);
}

function ListeSols() {
  const { t } = useLang();
  const [sols, setSols] = useState([]);
  const [pageActuelle, setPageActuelle] = useState(1);
  const [dernierePagee, setDernierePagee] = useState(1);
  const [chargement, setChargement] = useState(true);

  const chargerSols = (page) => {
    setChargement(true);
    api.get(`/sols?page=${page}`)
      .then((response) => {
        setSols(response.data.data);
        setPageActuelle(response.data.current_page);
        setDernierePagee(response.data.last_page);
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des sols :', error);
        setChargement(false);
      });
  };

  useEffect(() => {
    chargerSols(1);
  }, []);

  if (chargement) {
    return <p>{t('common.chargement')}</p>;
  }

  const sceauStatut = (statut) => {
    if (statut === 'actif') return { classe: 'sceau-paye', label: t('liste_sols.actif') };
    return { classe: 'sceau-neutre', label: t('liste_sols.cloture') };
  };

  const frequenceLabel = (sol) => {
    if (sol.frequence_jours) {
      return `${sol.frequence_jours} j`;
    }
    return sol.frequence === 'hebdomadaire' ? t('creer_sol.hebdomadaire') : t('creer_sol.mensuelle');
  };

  return (
    <div>
      <Link to="/" className="btn btn-sm btn-outline-secondary mb-3">
        {t('liste_sols.retour_accueil')}
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{t('liste_sols.titre')}</h1>
        <Link to="/sols/creer" className="btn-sol d-inline-block">
          {t('liste_sols.creer_sol')}
        </Link>
      </div>

      {sols.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="mb-3">{t('liste_sols.aucun_sol')}</p>
            <Link to="/sols/creer" className="btn-dore d-inline-block">
              {t('liste_sols.premier_sol')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grille-sols">
          {sols.map((sol) => {
            const sceau = sceauStatut(sol.statut);
            return (
              <div className="card" key={sol.id}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{sol.nom}</h5>
                    <span className={`sceau ${sceau.classe}`}>{sceau.label}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2 mb-1">
                    <span className="text-muted small">{t('liste_sols.cotisation')}</span>
                    <span className="chiffre">{sol.montant_cotisation} HTG</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">{t('liste_sols.frequence')}</span>
                    <span>{frequenceLabel(sol)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">{t('liste_sols.periode')}</span>
                    <span className="small">
                      {formatDate(sol.date_debut)} → {formatDate(calculerDateFinSol(sol))}
                    </span>
                  </div>

                  <Link to={`/sols/${sol.id}`} className="btn btn-sol mt-auto align-self-start">
                    {t('liste_sols.voir_sol')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dernierePagee > 1 && (
        <nav className="d-flex justify-content-center gap-2 mt-4">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={pageActuelle === 1}
            onClick={() => chargerSols(pageActuelle - 1)}
          >
            {t('liste_sols.precedent')}
          </button>
          <span className="align-self-center">
            {t('liste_sols.page')} {pageActuelle} {t('liste_sols.sur')} {dernierePagee}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={pageActuelle === dernierePagee}
            onClick={() => chargerSols(pageActuelle + 1)}
          >
            {t('liste_sols.suivant')}
          </button>
        </nav>
      )}
    </div>
  );
}

export default ListeSols;