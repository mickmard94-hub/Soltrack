import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import RoueDesTours from '../components/RoueDesTours';
import { useLang } from '../contexts/LangContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function dateFinDuSol(sol) {
  if (!sol.tours || sol.tours.length === 0) return null;
  const dernierTour = sol.tours[sol.tours.length - 1];
  return dernierTour.date_fin_prevue;
}

function DetailSol() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [sol, setSol] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [chargement, setChargement] = useState(true);

  const chargerDonnees = () => {
    Promise.all([
      api.get(`/sols/${id}`),
      api.get(`/sols/${id}/tableau-de-bord`),
    ])
      .then(([solResponse, dashboardResponse]) => {
        setSol(solResponse.data);
        setDashboard(dashboardResponse.data);
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement du sol :', error);
        setChargement(false);
      });
  };

  useEffect(() => {
    chargerDonnees();
  }, [id]);

  const handleSupprimer = () => {
    const confirmation = window.confirm(
      `${t('detail_sol.confirmation_suppression')} "${sol.nom}" ? ${t('detail_sol.confirmation_suppression_suite')}`
    );

    if (!confirmation) {
      return;
    }

    api.delete(`/sols/${id}`)
      .then(() => {
        navigate('/sols');
      })
      .catch((error) => {
        console.error('Erreur lors de la suppression du sol :', error);
      });
  };

  if (chargement) {
    return <p>{t('common.chargement')}</p>;
  }

  if (!sol) {
    return <p>{t('detail_sol.sol_introuvable')}</p>;
  }

  const nombreMembresManquants = sol.nombre_tours - sol.membres.length;
  const solComplet = nombreMembresManquants <= 0;

  return (
    <div>
      <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
        {t('detail_sol.retour_sols')}
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <span className="hero-eyebrow">{t('detail_sol.tableau_de_bord')}</span>
          <h1 className="mb-0 mt-1">{sol.nom}</h1>
          <p className="text-muted small mb-0 mt-1">
            {t('detail_sol.du')} {formatDate(sol.date_debut)} {t('detail_sol.au')} {formatDate(dateFinDuSol(sol)) || '—'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/sols/${id}/modifier`} className="btn btn-outline-primary btn-sm">
            {t('detail_sol.modifier')}
          </Link>
          <button className="btn btn-outline-danger btn-sm" onClick={handleSupprimer}>
            {t('detail_sol.supprimer_sol')}
          </button>
        </div>
      </div>

      {!solComplet && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <span className="sceau sceau-attente">{t('detail_sol.sol_incomplet')}</span>
          <span>
            {t('detail_sol.il_manque')} {nombreMembresManquants} {nombreMembresManquants > 1 ? t('detail_sol.membres_pluriel') : t('detail_sol.membre_singulier')} {t('liste_sols.sur')} {sol.nombre_tours} {t('detail_sol.avant_de_pouvoir')}
          </span>
        </div>
      )}

      <div className="dashboard-hero mb-4">
        <div className="row g-0 align-items-center">
          <div className="col-md-5 d-flex justify-content-center py-4">
            <RoueDesTours tours={sol.tours} />
          </div>
          <div className="col-md-7">
            <div className="row g-0">
              <div className="col-6 dashboard-stat border-bottom border-end">
                <div className="dashboard-stat-label">{t('detail_sol.total_collecte')}</div>
                <div className="dashboard-stat-valeur">{dashboard.total_collecte} <span className="fs-6 fw-normal text-muted">HTG</span></div>
              </div>
              <div className="col-6 dashboard-stat border-bottom">
                <div className="dashboard-stat-label">{t('detail_sol.cotisation_par_tour')}</div>
                <div className="dashboard-stat-valeur">{sol.montant_cotisation} <span className="fs-6 fw-normal text-muted">HTG</span></div>
              </div>
              <div className="col-6 dashboard-stat border-end">
                <div className="dashboard-stat-label">{t('detail_sol.en_attente')}</div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="sceau sceau-attente">{dashboard.cotisations_en_attente}</span>
                </div>
              </div>
              <div className="col-6 dashboard-stat">
                <div className="dashboard-stat-label">{t('detail_sol.en_retard')}</div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="sceau sceau-retard">{dashboard.cotisations_en_retard}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-5">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">{t('detail_sol.membres')}</h5>
          </div>
          <div className="card mb-3">
            <div className="card-body">
              <p className="mb-3">
                <span className="chiffre">{sol.membres.length}</span>
                <span className="text-muted"> / {sol.nombre_tours} {sol.nombre_tours > 1 ? t('detail_sol.membres_pluriel') : t('detail_sol.membre_singulier')} {sol.membres.length > 1 ? t('detail_sol.inscrits') : t('detail_sol.inscrit')}</span>
              </p>
              <div className="d-flex gap-2 flex-wrap">
                {!solComplet && (
                  <Link to={`/sols/${id}/membres/ajouter`} className="btn-sol d-inline-block">
                    {t('detail_sol.ajouter_membre')}
                  </Link>
                )}
                <Link to={`/sols/${id}/membres`} className="btn btn-outline-secondary d-inline-block">
                  {t('detail_sol.gerer_membres')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">{t('detail_sol.tours')}</h5>
            <Link to={`/sols/${id}/cotisations`} className="btn btn-sm btn-outline-secondary">
              {t('detail_sol.voir_cotisations_manquantes')}
            </Link>
          </div>
          <div className="card mb-3">
            <div className="card-body py-2">
              {sol.tours.map((tour) => (
                <div className="membre-ligne" key={tour.id}>
                  <span className="d-flex align-items-center">
                    <span className="membre-puce">{tour.numero_tour}</span>
                    <span>
                      {tour.membre_beneficiaire?.nom}
                      <span className="text-muted small d-block">
                        {formatDate(tour.date_prevue)} → {formatDate(tour.date_fin_prevue)}
                      </span>
                    </span>
                  </span>
                  <span className={`sceau ${tour.statut === 'verse' ? 'sceau-paye' : 'sceau-neutre'}`}>
                    {tour.statut === 'verse' ? t('detail_sol.verse') : t('detail_sol.a_venir')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to={`/sols/${id}/cotisations/ajouter`} className="btn-dore d-inline-block">
              {t('detail_sol.enregistrer_cotisation')}
            </Link>
            <Link to={`/sols/${id}/cotisations/par-tour`} className="btn btn-outline-secondary d-inline-block">
              {t('detail_sol.voir_qui_a_cotise')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailSol;