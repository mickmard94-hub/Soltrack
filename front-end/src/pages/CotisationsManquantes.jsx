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

      <span className="hero-eyebrow">Suivi</span>
      <h1 className="mt-1 mb-4">Cotisations manquantes</h1>

      <div className="card">
        <div className="card-body p-4">
          {donnees.statut === 'termine' && (
            <p className="text-muted mb-0">Tous les tours de ce sol sont terminés.</p>
          )}

          {donnees.statut === 'pas_commence' && (
            <p className="text-muted mb-0">
              Le tour <span className="chiffre">n°{donnees.tour_numero}</span> n'a pas encore commencé
              {donnees.date_debut_tour ? ` (début le ${donnees.date_debut_tour})` : ''}.
              Les cotisations en attente s'afficheront ici dès son commencement.
            </p>
          )}

          {(donnees.statut === 'en_cours' || donnees.statut === 'en_retard') && (
            <>
              <div className="d-flex align-items-center gap-2 mb-3">
                <p className="mb-0">
                  Pour le tour <span className="chiffre">n°{donnees.tour_numero}</span> :
                </p>
                {donnees.statut === 'en_retard' && (
                  <span className="sceau sceau-retard">Période terminée</span>
                )}
              </div>
              {donnees.membres_manquants.length === 0 ? (
                <span className="sceau sceau-paye">Tous les membres ont cotisé</span>
              ) : (
                <div>
                  {donnees.membres_manquants.map((membre) => (
                    <div className="membre-ligne" key={membre.id}>
                      <span>{membre.nom}</span>
                      <span className={`sceau ${donnees.statut === 'en_retard' ? 'sceau-retard' : 'sceau-attente'}`}>
                        {donnees.statut === 'en_retard' ? 'En retard' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CotisationsManquantes;
