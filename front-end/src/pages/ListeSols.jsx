import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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

  return (
    <div>
      <Link to="/" className="btn btn-sm btn-outline-secondary mb-3">
        ← Retour à l'accueil
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Mes sols</h1>
        <Link to="/sols/creer" className="btn btn-sol">
          + Créer un sol
        </Link>
      </div>

      <div className="table-responsive-wrapper">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Nom du sol</th>
              <th>Montant</th>
              <th>Fréquence</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sols.map((sol) => (
              <tr key={sol.id}>
                <td>{sol.nom}</td>
                <td>{sol.montant_cotisation} HTG</td>
                <td>{sol.frequence}</td>
                <td>{sol.statut}</td>
                <td>
                  <Link to={`/sols/${sol.id}`} className="btn btn-sm btn-outline-secondary">
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dernierePagee > 1 && (
        <nav className="d-flex justify-content-center gap-2">
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