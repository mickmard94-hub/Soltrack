import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Affiche une date ISO (YYYY-MM-DD) au format français JJ/MM/AAAA.
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// Calcule la date de fin réelle du sol : date de début + (fréquence ×
// nombre de tours) - 1 jour.
function calculerDateFinSol(sol) {
  const joursParTour = sol.frequence === 'hebdomadaire' ? 7 : 30;
  const debut = new Date(sol.date_debut);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + joursParTour * sol.nombre_tours - 1);
  return fin.toISOString().slice(0, 10);
}

function ListeSols() {
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
    return <p>Chargement...</p>;
  }

  const sceauStatut = (statut) => {
    if (statut === 'actif') return { classe: 'sceau-paye', label: 'Actif' };
    return { classe: 'sceau-neutre', label: 'Clôturé' };
  };

  return (
    <div>
      <Link to="/" className="btn btn-sm btn-outline-secondary mb-3">
        ← Retour à l'accueil
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Mes sols</h1>
        <Link to="/sols/creer" className="btn-sol d-inline-block">
          + Créer un sol
        </Link>
      </div>

      {sols.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="mb-3">Vous n'avez pas encore créé de sol.</p>
            <Link to="/sols/creer" className="btn-dore d-inline-block">
              Créer mon premier sol
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
                    <span className="text-muted small">Cotisation</span>
                    <span className="chiffre">{sol.montant_cotisation} HTG</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">Fréquence</span>
                    <span className="text-capitalize">{sol.frequence}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">Période</span>
                    <span className="small">
                      {formatDate(sol.date_debut)} → {formatDate(calculerDateFinSol(sol))}
                    </span>
                  </div>

                  <Link to={`/sols/${sol.id}`} className="btn btn-sol mt-auto align-self-start">
                    Voir le sol
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
            Précédent
          </button>
          <span className="align-self-center">
            Page {pageActuelle} sur {dernierePagee}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={pageActuelle === dernierePagee}
            onClick={() => chargerSols(pageActuelle + 1)}
          >
            Suivant
          </button>
        </nav>
      )}
    </div>
  );
}

export default ListeSols;
