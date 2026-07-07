import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

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

  return (
    <div>
      <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
        ← Retour à mes sols
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">{sol.nom}</h1>
        <div className="d-flex gap-2">
          <Link to={`/sols/${id}/modifier`} className="btn btn-outline-primary btn-sm">
            Modifier
          </Link>
          <button className="btn btn-outline-danger btn-sm" onClick={handleSupprimer}>
            Supprimer ce sol
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6>Total collecté</h6>
              <p className="fs-4">{dashboard.total_collecte} HTG</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6>Prochain bénéficiaire</h6>
              <p className="fs-5">{dashboard.prochain_beneficiaire || '—'}</p>
              <small>{dashboard.prochaine_date || ''}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6>Cotisations en attente</h6>
              <p className="fs-4">{dashboard.cotisations_en_attente}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6>Cotisations en retard</h6>
              <p className="fs-4">{dashboard.cotisations_en_retard}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Membres</h5>
            <Link to={`/sols/${id}/membres`} className="btn btn-sm btn-outline-secondary">
              Gérer les membres
            </Link>
          </div>
          <ul className="list-group mb-3">
            {sol.membres.map((membre) => (
              <li className="list-group-item" key={membre.id}>
                {membre.nom} — Ordre : {membre.ordre_reception}
              </li>
            ))}
          </ul>
          <Link to={`/sols/${id}/membres/ajouter`} className="btn btn-sol">
            + Ajouter un membre
          </Link>
        </div>

        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Tours</h5>
            <Link to={`/sols/${id}/cotisations`} className="btn btn-sm btn-outline-secondary">
              Voir les cotisations manquantes
            </Link>
          </div>
          <ul className="list-group mb-3">
            {sol.tours.map((tour) => (
              <li className="list-group-item" key={tour.id}>
                Tour {tour.numero_tour} → {tour.membre_beneficiaire?.nom} — {tour.statut === 'verse' ? 'Versé' : 'À venir'}
              </li>
            ))}
          </ul>
          <Link to={`/sols/${id}/cotisations/ajouter`} className="btn btn-sol">
            Enregistrer une cotisation
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DetailSol;