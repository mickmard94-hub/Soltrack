import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function CreerSol() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    montant_cotisation: '',
    frequence: 'mensuelle',
    nombre_tours: '',
    date_debut: '',
    penalites_actives: false,
    penalite_montant_base: '',
    penalite_palier10_actif: false,
    penalite_palier10_mode: 'doubler',
    penalite_palier10_montant: '',
    penalite_palier30_actif: false,
    penalite_palier30_mode: 'doubler',
    penalite_palier30_montant: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});
    setEnvoi(true);

    api.post('/sols', form)
      .then((response) => {
        navigate(`/sols/${response.data.id}`);
      })
      .catch((error) => {
        setEnvoi(false);
        if (error.response && error.response.status === 422) {
          setErreurs(error.response.data.errors);
        } else {
          console.error('Erreur lors de la création du sol :', error);
        }
      });
  };

  const handleAnnuler = () => {
    navigate('/sols');
  };

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <span className="hero-eyebrow">{t('creer_sol.eyebrow')}</span>
        <h1 className="mt-1 mb-4">{t('creer_sol.titre')}</h1>

        <div className="card mb-3">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} id="form-creer-sol">
              <div className="mb-3">
                <label className="form-label">{t('creer_sol.nom_sol')}</label>
                <input
                  type="text"
                  className="form-control"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder={t('creer_sol.nom_placeholder')}
                />
                {erreurs.nom && <div className="text-danger small mt-1">{erreurs.nom[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('creer_sol.montant')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="montant_cotisation"
                  value={form.montant_cotisation}
                  onChange={handleChange}
                  placeholder="Ex : 2000"
                />
                {erreurs.montant_cotisation && <div className="text-danger small mt-1">{erreurs.montant_cotisation[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('creer_sol.frequence')}</label>
                <select
                  className="form-select"
                  name="frequence"
                  value={form.frequence}
                  onChange={handleChange}
                >
                  <option value="hebdomadaire">{t('creer_sol.hebdomadaire')}</option>
                  <option value="mensuelle">{t('creer_sol.mensuelle')}</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">{t('creer_sol.nombre_tours')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="nombre_tours"
                  value={form.nombre_tours}
                  onChange={handleChange}
                  placeholder="Ex : 10"
                />
                <div className="form-text">
                  {t('creer_sol.nombre_tours_aide')}
                </div>
                {erreurs.nombre_tours && <div className="text-danger small mt-1">{erreurs.nombre_tours[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">{t('creer_sol.date_debut')}</label>
                <input
                  type="date"
                  className="form-control"
                  name="date_debut"
                  value={form.date_debut}
                  onChange={handleChange}
                />
                {erreurs.date_debut && <div className="text-danger small mt-1">{erreurs.date_debut[0]}</div>}
              </div>
            </form>
          </div>
        </div>

        {/* Configuration des pénalités — optionnelle */}
        <div className="card mb-3">
          <div className="card-body p-4">
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="penalites_actives"
                name="penalites_actives"
                checked={form.penalites_actives}
                onChange={handleChange}
                form="form-creer-sol"
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
                    form="form-creer-sol"
                    placeholder="Ex : 100"
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
                    form="form-creer-sol"
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
                      form="form-creer-sol"
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
                        form="form-creer-sol"
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
                    form="form-creer-sol"
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
                      form="form-creer-sol"
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
                        form="form-creer-sol"
                        placeholder={t('creer_sol.palier30_montant')}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" form="form-creer-sol" className="btn-sol border-0" disabled={envoi}>
            {envoi ? t('creer_sol.enregistrement') : t('creer_sol.enregistrer')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
            {t('creer_sol.annuler')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreerSol;