import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function ModifierSol() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [aDesTours, setADesTours] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    montant_cotisation: '',
    frequence: 'mensuelle',
    nombre_tours: '',
    date_debut: '',
    statut: 'actif',
  });

  useEffect(() => {
    api.get(`/sols/${id}`)
      .then((response) => {
        setForm({
          nom: response.data.nom,
          montant_cotisation: response.data.montant_cotisation,
          frequence: response.data.frequence,
          nombre_tours: response.data.nombre_tours,
          date_debut: response.data.date_debut,
          statut: response.data.statut,
        });
        setADesTours(Boolean(response.data.tours && response.data.tours.length > 0));
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement du sol :', error);
        setChargement(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.statut === 'cloture') {
      const confirmation = window.confirm(t('modifier_sol.confirmation_cloture'));
      if (!confirmation) {
        return;
      }
    }

    setErreurs({});
    setEnvoi(true);

    api.put(`/sols/${id}`, form)
      .then(() => {
        navigate(`/sols/${id}`);
      })
      .catch((error) => {
        setEnvoi(false);
        if (error.response && error.response.status === 422) {
          setErreurs(error.response.data.errors || {});
          if (error.response.data.message) {
            setErreurs((prev) => ({ ...prev, general: [error.response.data.message] }));
          }
        } else {
          console.error('Erreur lors de la modification du sol :', error);
        }
      });
  };

  const handleAnnuler = () => {
    navigate(`/sols/${id}`);
  };

  if (chargement) {
    return <p>{t('common.chargement')}</p>;
  }

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <span className="hero-eyebrow">{t('modifier_sol.eyebrow')}</span>
        <h1 className="mt-1 mb-4">{t('modifier_sol.titre')}</h1>

        <div className="card">
          <div className="card-body p-4">
            {erreurs.general && (
              <div className="alert alert-danger">{erreurs.general[0]}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('modifier_sol.nom_sol')}</label>
                <input
                  type="text"
                  className="form-control"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                />
                {erreurs.nom && <div className="text-danger small mt-1">{erreurs.nom[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('modifier_sol.montant')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="montant_cotisation"
                  value={form.montant_cotisation}
                  onChange={handleChange}
                />
                {erreurs.montant_cotisation && <div className="text-danger small mt-1">{erreurs.montant_cotisation[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('modifier_sol.frequence')}</label>
                <select
                  className="form-select"
                  name="frequence"
                  value={form.frequence}
                  onChange={handleChange}
                  disabled={aDesTours}
                >
                  <option value="hebdomadaire">{t('modifier_sol.hebdomadaire')}</option>
                  <option value="mensuelle">{t('modifier_sol.mensuelle')}</option>
                </select>
                {aDesTours && (
                  <div className="form-text text-muted">
                    {t('modifier_sol.figee_calendrier')}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('modifier_sol.nombre_tours')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="nombre_tours"
                  value={form.nombre_tours}
                  onChange={handleChange}
                />
                {erreurs.nombre_tours && <div className="text-danger small mt-1">{erreurs.nombre_tours[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('modifier_sol.date_debut')}</label>
                <input
                  type="date"
                  className="form-control"
                  name="date_debut"
                  value={form.date_debut}
                  onChange={handleChange}
                  disabled={aDesTours}
                />
                {aDesTours && (
                  <div className="form-text text-muted">
                    {t('modifier_sol.figee_date')}
                  </div>
                )}
                {erreurs.date_debut && <div className="text-danger small mt-1">{erreurs.date_debut[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">{t('modifier_sol.statut')}</label>
                <select
                  className="form-select"
                  name="statut"
                  value={form.statut}
                  onChange={handleChange}
                >
                  <option value="actif">{t('modifier_sol.actif')}</option>
                  <option value="cloture">{t('modifier_sol.cloture')}</option>
                </select>
                {form.statut === 'cloture' && (
                  <div className="form-text text-danger">
                    {t('modifier_sol.cloture_aide')}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn-sol border-0" disabled={envoi}>
                  {envoi ? t('modifier_sol.enregistrement') : t('modifier_sol.enregistrer')}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
                  {t('modifier_sol.annuler')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModifierSol;