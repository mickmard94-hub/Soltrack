import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function CotisationsParTour() {
  const { id } = useParams();
  const { t } = useLang();
  const [tours, setTours] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get(`/sols/${id}/cotisations-par-tour`)
      .then((response) => {
        setTours(response.data);
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des cotisations par tour :', error);
        setChargement(false);
      });
  }, [id]);

  if (chargement) {
    return <p>{t('common.chargement')}</p>;
  }

  const sceauTour = (statut) => {
    if (statut === 'verse') return { classe: 'sceau-paye', label: t('cotisations.verse') };
    return { classe: 'sceau-neutre', label: t('cotisations.a_venir') };
  };

  return (
    <div>
      <Link to={`/sols/${id}`} className="btn btn-sm btn-outline-secondary mb-3">
        {t('membres.retour_detail')}
      </Link>
      <br />
      <span className="hero-eyebrow">{t('cotisations.historique_eyebrow')}</span>
      <h1 className="mt-1 mb-4">{t('cotisations.par_tour_titre')}</h1>

      {tours.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5 text-muted">
            {t('cotisations.aucun_tour')}
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {tours.map((tour) => {
            const sceau = sceauTour(tour.statut);
            const nombrePayes = tour.membres.filter((m) => m.a_paye).length;

            return (
              <div className="card" key={tour.numero_tour}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                    <div>
                      <span className="hero-eyebrow" style={{ fontSize: '0.7rem' }}>
                        {t('cotisations.tour_prefix')} {tour.numero_tour} &middot; {t('cotisations.beneficiaire')} : {tour.beneficiaire || '—'}
                      </span>
                      <div className="text-muted small mt-1">
                        {nombrePayes} / {tour.membres.length} {t('cotisations.ont_cotise')}
                      </div>
                    </div>
                    <span className={`sceau ${sceau.classe}`}>{sceau.label}</span>
                  </div>

                  <div>
                    {tour.membres.map((membre) => (
                      <div className="membre-ligne" key={membre.id}>
                        <span>{membre.nom}</span>
                        {membre.a_paye ? (
                          <span className="sceau sceau-paye">
                            {t('cotisations.paye')}{membre.date_paiement ? ` — ${membre.date_paiement}` : ''}
                          </span>
                        ) : (
                          <span className="sceau sceau-neutre">{t('cotisations.pas_encore_paye')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CotisationsParTour;