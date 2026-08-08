import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function ListeMembres() {
  const { id } = useParams();
  const { t } = useLang();
  const [membres, setMembres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modeEchange, setModeEchange] = useState(false);
  const [selection, setSelection] = useState([]);
  const [erreurEchange, setErreurEchange] = useState('');
  const [envoiEchange, setEnvoiEchange] = useState(false);

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
      `${t('membres.confirmation_suppression')} "${membre.nom}" ${t('membres.confirmation_suppression_suite')}`
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

  const toggleModeEchange = () => {
    setModeEchange(!modeEchange);
    setSelection([]);
    setErreurEchange('');
  };

  const toggleSelection = (membreId) => {
    setErreurEchange('');
    setSelection((actuel) => {
      if (actuel.includes(membreId)) {
        return actuel.filter((id) => id !== membreId);
      }
      if (actuel.length === 2) {
        return [actuel[1], membreId];
      }
      return [...actuel, membreId];
    });
  };

  const handleEchanger = () => {
    if (selection.length !== 2) {
      return;
    }

    setEnvoiEchange(true);
    setErreurEchange('');

    api.post(`/sols/${id}/membres/echanger-tour`, {
      membre_id_1: selection[0],
      membre_id_2: selection[1],
    })
      .then(() => {
        setEnvoiEchange(false);
        setModeEchange(false);
        setSelection([]);
        chargerMembres();
      })
      .catch((error) => {
        setEnvoiEchange(false);
        if (error.response && error.response.data && error.response.data.message) {
          setErreurEchange(error.response.data.message);
        } else {
          console.error('Erreur lors de l\'échange de tour :', error);
        }
      });
  };

  if (chargement) {
    return <p>{t('common.chargement')}</p>;
  }

  return (
    <div>
      <Link to={`/sols/${id}`} className="btn btn-sm btn-outline-secondary mb-3">
        {t('membres.retour_detail')}
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="mb-0">{t('membres.titre_liste')}</h1>
        <div className="d-flex gap-2">
          {membres.length >= 2 && (
            <button
              className={`btn btn-sm ${modeEchange ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={toggleModeEchange}
            >
              {modeEchange ? t('membres.echanger_annuler') : t('membres.echanger')}
            </button>
          )}
          <Link to={`/sols/${id}/membres/ajouter`} className="btn-sol d-inline-block">
            {t('detail_sol.ajouter_membre')}
          </Link>
        </div>
      </div>

      {modeEchange && (
        <div className="card mb-3">
          <div className="card-body">
            <p className="mb-2 small text-muted">
              {t('membres.echange_consigne')}
            </p>
            {erreurEchange && <div className="alert alert-danger py-2 small">{erreurEchange}</div>}
            <button
              className="btn-dore border-0"
              disabled={selection.length !== 2 || envoiEchange}
              onClick={handleEchanger}
            >
              {envoiEchange ? t('membres.echange_en_cours') : `${t('membres.echanger_bouton_prefix')} (${selection.length}/2 ${t('membres.echanger_bouton_suffix')})`}
            </button>
          </div>
        </div>
      )}

      {membres.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="mb-3 text-muted">{t('membres.aucun_membre')}</p>
            <Link to={`/sols/${id}/membres/ajouter`} className="btn-dore d-inline-block">
              {t('membres.premier_membre')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body py-2">
            {membres.map((membre) => (
              <div
                className="membre-ligne"
                key={membre.id}
                style={modeEchange ? { cursor: 'pointer' } : undefined}
                onClick={modeEchange ? () => toggleSelection(membre.id) : undefined}
              >
                <span className="d-flex align-items-center">
                  {modeEchange && (
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={selection.includes(membre.id)}
                      onChange={() => toggleSelection(membre.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <span className="membre-puce">{membre.ordre_reception}</span>
                  <span>
                    {membre.nom}
                    {membre.telephone && (
                      <span className="text-muted small ms-2">{membre.telephone}</span>
                    )}
                  </span>
                </span>
                {!modeEchange && (
                  <div className="d-flex gap-2">
                    <Link
                      to={`/sols/${id}/membres/${membre.id}/modifier`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      {t('membres.modifier')}
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleSupprimer(membre)}
                    >
                      {t('membres.retirer')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListeMembres;