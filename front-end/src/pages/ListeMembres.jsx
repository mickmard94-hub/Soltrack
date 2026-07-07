import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function ListeMembres() {
  const { id } = useParams();
  const [membres, setMembres] = useState([]);
  const [chargement, setChargement] = useState(true);

  const chargerMembres = () => {
    api.get(`/sols/${id}/membres`)
      .then((response) => {
        setMembres(response.data);
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des membres :', error);
        setChargement(false);
      });
  };

  useEffect(() => {
    chargerMembres();
  }, [id]);

  const handleSupprimer = (membre) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment retirer "${membre.nom}" de ce sol ?`
    );

    if (!confirmation) {
      return;
    }

    api.delete(`/membres/${membre.id}`)
      .then(() => {
        chargerMembres();
      })
      .catch((error) => {
        console.error('Erreur lors de la suppression du membre :', error);
      });
  };

  if (chargement) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <Link to={`/sols/${id}`} className="btn btn-sm btn-outline-secondary mb-3">
        ← Retour au détail du sol
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Membres du sol</h1>
        <Link to={`/sols/${id}/membres/ajouter`} className="btn btn-sol">
          + Ajouter un membre
        </Link>
      </div>

      <div className="table-responsive-wrapper">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Ordre de réception</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {membres.map((membre) => (
              <tr key={membre.id}>
                <td>{membre.nom}</td>
                <td>{membre.telephone || '—'}</td>
                <td>{membre.ordre_reception}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/sols/${id}/membres/${membre.id}/modifier`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Modifier
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleSupprimer(membre)}
                    >
                      Retirer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListeMembres;