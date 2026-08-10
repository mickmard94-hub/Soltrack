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
    frequence_jours: '',
    nombre_tours: '',
    date_debut: '',
    statut: 'actif',
    penalites_actives: false,
    penalite_montant_base: '',
    penalite_palier10_actif: false,
    penalite_palier10_mode: 'doubler',
    penalite_palier10_montant: '',
    penalite_palier30_actif: false,
    penalite_palier30_mode: 'doubler',
    penalite_palier30_montant: '',
    penalites_verrouillees: false,
  });

  useEffect(() => {
    api.get(`/sols/${id}`)
      .then((response) => {
        const d = response.data;
        setForm({
          nom: d.nom,
          montant_cotisation: d.montant_cotisation,
          frequence: d.frequence_jours ? 'personnalisee' : d.frequence,
          frequence_jours: d.frequence_jours || '',
          nombre_tours: d.nombre_tours,
          date_debut: d.date_debut,
          statut: d.statut,
          penalites_actives: !!d.penalites_actives,
          penalite_montant_base: d.penalite_montant_base || '',
          penalite_palier10_actif: !!d.penalite_palier10_actif,
          penalite_palier10_mode: d.penalite_palier10_mode || 'doubler',
          penalite_palier10_montant: d.penalite_palier10_montant || '',
          penalite_palier30_actif: !!d.penalite_palier30_actif,
          penalite_palier30_mode: d.penalite_palier30_mode || 'doubler',
          penalite_palier30_montant: d.penalite_palier30_montant || '',
          penalites_verrouillees: !!d.penalites_verrouillees,
        });
        setADesTours(Boolean(d.tours && d.tours.length > 0));
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement du sol :', error);
        setChargement(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
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

    const donnees = { ...form };
    if (donnees.frequence === 'personnalisee') {
      donnees.frequence = 'mensuelle';
    } else {
      donnees.frequence_jours = null;
    }

    api.put(`/sols/${id}`, donnees)
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

        {erreurs.general && (
          <div className="alert alert-danger">{erreurs.general[0]}</div>
        )}

        <div className="card mb-3">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} id="form-modifier-sol">
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
                  <option value="personnalisee">{t('creer_sol.personnalisee')}</option>
                </select>
                {aDesTours && (
                  <div className="form-text text-muted">
                    {t('modifier_sol.figee_calendrier')}
                  </div>
                )}
              </div>

              {form.frequence === 'personnalisee' && (
                <div className="mb-3">
                  <label className="form-label">{t('creer_sol.frequence_jours_label')}</label>
                  <input
                    type="number"
                    min={7}
                    className="form-control"
                    name="frequence_jours"
                    value={form.frequence_jours}
                    onChange={handleChange}
                    disabled={aDesTours}
                  />
                  <div className="form-text">{t('creer_sol.frequence_jours_aide')}</div>
                  {erreurs.frequence_jours && <div className="text-danger small mt-1">{erreurs.frequence_jours[0]}</div>}
                </div>
              )}

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
            </form>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body p-4">
            {form.penalites_verrouillees && (
              <div className="alert alert-warning py-2 small mb-3">
                {t('creer_sol.verrouille_note')}
              </div>
            )}

            <fieldset disabled={form.penalites_verrouillees}>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="penalites_actives"
                  name="penalites_actives"
                  checked={form.penalites_actives}
                  onChange={handleChange}
                  form="form-modifier-sol"
                />
                <label className="form-check-label fw-semibold" htmlFor="penalites_actives">
                  {t('creer_sol.penalites_titre')}
                </label>
              </div>

              {form.penalites_actives && (
                <>
                  <div className="mb-3">
                    <label className="form-label">{t('creer_sol.penalite_montant_base')}</label>
                    <input
                      type="number"
                      className="form-control"
                      name="penalite_montant_base"
                      value={form.penalite_montant_base}
                      onChange={handleChange}
                      form="form-modifier-sol"
                    />
                    {erreurs.penalite_montant_base && <div className="text-danger small mt-1">{erreurs.penalite_montant_base[0]}</div>}
                  </div>

                  <hr />

                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="penalite_palier10_actif"
                      name="penalite_palier10_actif"
                      checked={form.penalite_palier10_actif}
                      onChange={handleChange}
                      form="form-modifier-sol"
                    />
                    <label className="form-check-label fw-semibold" htmlFor="penalite_palier10_actif">
                      {t('creer_sol.palier10_titre')}
                    </label>
                  </div>
                  {form.penalite_palier10_actif && (
                    <div className="mb-3 ps-4">
                      <select
                        className="form-select mb-2"
                        name="penalite_palier10_mode"
                        value={form.penalite_palier10_mode}
                        onChange={handleChange}
                        form="form-modifier-sol"
                      >
                        <option value="doubler">{t('creer_sol.mode_doubler')}</option>
                        <option value="ajouter">{t('creer_sol.mode_ajouter')}</option>
                      </select>
                      {form.penalite_palier10_mode === 'ajouter' && (
                        <input
                          type="number"
                          className="form-control"
                          name="penalite_palier10_montant"
                          value={form.penalite_palier10_montant}
                          onChange={handleChange}
                          form="form-modifier-sol"
                          placeholder={t('creer_sol.palier10_montant')}
                        />
                      )}
                    </div>
                  )}

                  <hr />

                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="penalite_palier30_actif"
                      name="penalite_palier30_actif"
                      checked={form.penalite_palier30_actif}
                      onChange={handleChange}
                      form="form-modifier-sol"
                    />
                    <label className="form-check-label fw-semibold" htmlFor="penalite_palier30_actif">
                      {t('creer_sol.palier30_titre')}
                    </label>
                  </div>
                  {form.penalite_palier30_actif && (
                    <div className="mb-2 ps-4">
                      <select
                        className="form-select mb-2"
                        name="penalite_palier30_mode"
                        value={form.penalite_palier30_mode}
                        onChange={handleChange}
                        form="form-modifier-sol"
                      >
                        <option value="doubler">{t('creer_sol.palier30_mode_doubler')}</option>
                        <option value="ajouter">{t('creer_sol.mode_ajouter')}</option>
                      </select>
                      {form.penalite_palier30_mode === 'ajouter' && (
                        <input
                          type="number"
                          className="form-control"
                          name="penalite_palier30_montant"
                          value={form.penalite_palier30_montant}
                          onChange={handleChange}
                          form="form-modifier-sol"
                          placeholder={t('creer_sol.palier30_montant')}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </fieldset>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" form="form-modifier-sol" className="btn-sol border-0" disabled={envoi}>
            {envoi ? t('modifier_sol.enregistrement') : t('modifier_sol.enregistrer')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
            {t('modifier_sol.annuler')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModifierSol;