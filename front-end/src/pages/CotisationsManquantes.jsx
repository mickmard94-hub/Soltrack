import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function CotisationsManquantes() {
  const { id } = useParams();
  const { t } = useLang();
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
    return <p>{t('common.chargement')}</p>;
  }

  return (
    <div>
      <Link to={`/sols/${id}`} className="btn btn-sm btn-outline-secondary mb-3">
        {t('membres.retour_detail')}
      </Link>
      <br />
      <span className="hero-eyebrow">{t('cotisations.suivi_eyebrow')}</span>
      <h1 className="mt-1 mb-4">{t('cotisations.manquantes_titre')}</h1>

      <div className="card">
        <div className="card-body p-4">
          {donnees.statut === 'termine' && (
            <p className="text-muted mb-0">{t('cotisations.tous_termines')}</p>
          )}

          {donnees.statut === 'pas_commence' && (
            <p className="text-muted mb-0">
              {t('cotisations.pas_commence_prefix')} <span className="chiffre">n°{donnees.tour_numero}</span> {t('cotisations.pas_commence_suffix')}
              {donnees.date_debut_tour ? ` (${t('cotisations.pas_commence_debut')} ${donnees.date_debut_tour})` : ''}.
              {' '}{t('cotisations.pas_commence_note')}
            </p>
          )}

          {(donnees.statut === 'en_cours' || donnees.statut === 'en_retard') && (
            <>
              <div className="d-flex align-items-center gap-2 mb-3">
                <p className="mb-0">
                  {t('cotisations.pour_le_tour')} <span className="chiffre">n°{donnees.tour_numero}</span> :
                </p>
                {donnees.statut === 'en_retard' && (
                  <span className="sceau sceau-retard">{t('cotisations.periode_terminee')}</span>
                )}
              </div>
              {donnees.membres_manquants.length === 0 ? (
                <span className="sceau sceau-paye">{t('cotisations.tous_ont_cotise')}</span>
              ) : (
                <div>
                  {donnees.membres_manquants.map((membre) => (
                    <div className="membre-ligne" key={membre.id}>
                      <span>{membre.nom}</span>
                      <span className={`sceau ${donnees.statut === 'en_retard' ? 'sceau-retard' : 'sceau-attente'}`}>
                        {donnees.statut === 'en_retard' ? t('cotisations.en_retard') : t('cotisations.en_attente')}
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