import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function CotisationsManquantes() {
  const { id } = useParams();
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get(`/sols/${id}/cotisations-manquantes`)
      .then((response) => {
        setDonnees(response.data);
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement :', error);
        setChargement(false);
      });
  }, [id]);

  if (chargement) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <Link to={`/sols/${id}`} className="btn btn-sm btn-outline-secondary mb-3">
        ← Retour au détail du sol
      </Link>

      <h1>Cotisations manquantes</h1>

      {donnees.tour_numero === null ? (
        <p className="text-muted">Tous les tours de ce sol sont terminés.</p>
      ) : (
        <>
          <p>Pour le tour n°{donnees.tour_numero} :</p>
          {donnees.membres_manquants.length === 0 ? (
            <div className="alert alert-success">
              Tous les membres ont cotisé pour ce tour.
            </div>
          ) : (
            <ul className="list-group">
              {donnees.membres_manquants.map((membre) => (
                <li className="list-group-item" key={membre.id}>
                  {membre.nom}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default CotisationsManquantes;