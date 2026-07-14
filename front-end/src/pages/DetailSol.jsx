import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import RoueDesTours from '../components/RoueDesTours';

// Affiche une date ISO (YYYY-MM-DD) au format français JJ/MM/AAAA.
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// Calcule la date de fin réelle du sol : date de début + (fréquence ×
// nombre de tours) - 1 jour. Reflète la réalité même si tous les membres
// (et donc tous les tours) n'ont pas encore été ajoutés.
function calculerDateFinSol(sol) {
  const joursParTour = sol.frequence === 'hebdomadaire' ? 7 : 30;
  const debut = new Date(sol.date_debut);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + joursParTour * sol.nombre_tours - 1);
  return fin.toISOString().slice(0, 10);
}

function DetailSol() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      `Voulez-vous vraiment supprimer le sol "${sol.nom}" ? Cette action supprimera aussi tous ses membres, tours et cotisations.`
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
    return <p>Chargement...</p>;
  }

  if (!sol) {
    return <p>Sol introuvable.</p>;
  }

  const nombreMembresManquants = sol.nombre_tours - sol.membres.length;
  const solComplet = nombreMembresManquants <= 0;

  return (
    <div>
      <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
        ← Retour à mes sols
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <span className="hero-eyebrow">Tableau de bord</span>
          <h1 className="mb-0 mt-1">{sol.nom}</h1>
          <p className="text-muted small mb-0 mt-1">
            Du {formatDate(sol.date_debut)} au {formatDate(calculerDateFinSol(sol))}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/sols/${id}/modifier`} className="btn btn-outline-primary btn-sm">
            Modifier
          </Link>
          <button className="btn btn-outline-danger btn-sm" onClick={handleSupprimer}>
            Supprimer ce sol
          </button>
        </div>
      </div>

      {!solComplet && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <span className="sceau sceau-attente">Sol incomplet</span>
          <span>
            Il manque {nombreMembresManquants} membre{nombreMembresManquants > 1 ? 's' : ''} sur {sol.nombre_tours} avant de pouvoir enregistrer des cotisations.
          </span>
        </div>
      )}

      {/* Hero du tableau de bord : la roue des tours au centre, les
          indicateurs clés autour — le premier regard doit montrer
          où en est le sol, pas une grille de chiffres isolés. */}
      <div className="dashboard-hero mb-4">
        <div className="row g-0 align-items-center">
          <div className="col-md-5 d-flex justify-content-center py-4">
            <RoueDesTours tours={sol.tours} />
          </div>
          <div className="col-md-7">
            <div className="row g-0">
              <div className="col-6 dashboard-stat border-bottom border-end">
                <div className="dashboard-stat-label">Total collecté</div>
                <div className="dashboard-stat-valeur">{dashboard.total_collecte} <span className="fs-6 fw-normal text-muted">HTG</span></div>
              </div>
              <div className="col-6 dashboard-stat border-bottom">
                <div className="dashboard-stat-label">Cotisation / tour</div>
                <div className="dashboard-stat-valeur">{sol.montant_cotisation} <span className="fs-6 fw-normal text-muted">HTG</span></div>
              </div>
              <div className="col-6 dashboard-stat border-end">
                <div className="dashboard-stat-label">En attente</div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="sceau sceau-attente">{dashboard.cotisations_en_attente}</span>
                </div>
              </div>
              <div className="col-6 dashboard-stat">
                <div className="dashboard-stat-label">En retard</div>
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
            <h5 className="mb-0">Membres</h5>
          </div>
          <div className="card mb-3">
            <div className="card-body">
              <p className="mb-3">
                <span className="chiffre">{sol.membres.length}</span>
                <span className="text-muted"> / {sol.nombre_tours} membre{sol.nombre_tours > 1 ? 's' : ''} inscrit{sol.membres.length > 1 ? 's' : ''}</span>
              </p>
              <div className="d-flex gap-2 flex-wrap">
                {!solComplet && (
                  <Link to={`/sols/${id}/membres/ajouter`} className="btn-sol d-inline-block">
                    + Ajouter un membre
                  </Link>
                )}
                <Link to={`/sols/${id}/membres`} className="btn btn-outline-secondary d-inline-block">
                  Gérer les membres
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Tours</h5>
            <Link to={`/sols/${id}/cotisations`} className="btn btn-sm btn-outline-secondary">
              Voir les cotisations manquantes
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
                    {tour.statut === 'verse' ? 'Versé' : 'À venir'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to={`/sols/${id}/cotisations/ajouter`} className="btn-dore d-inline-block">
              Enregistrer une cotisation
            </Link>
            <Link to={`/sols/${id}/cotisations/par-tour`} className="btn btn-outline-secondary d-inline-block">
              Voir qui a cotisé par tour
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailSol;
