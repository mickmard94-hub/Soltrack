import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ModifierSol() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      const confirmation = window.confirm(
        'Clôturer ce sol empêchera tout nouvel ajout de membre ou de cotisation. Continuer ?'
      );
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
    return <p>Chargement...</p>;
  }

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <span className="hero-eyebrow">Modifier</span>
        <h1 className="mt-1 mb-4">Modifier le sol</h1>

        <div className="card">
          <div className="card-body p-4">
            {erreurs.general && (
              <div className="alert alert-danger">{erreurs.general[0]}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nom du sol</label>
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
                <label className="form-label">Montant de cotisation (HTG)</label>
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
                <label className="form-label">Fréquence</label>
                <select
                  className="form-select"
                  name="frequence"
                  value={form.frequence}
                  onChange={handleChange}
                  disabled={aDesTours}
                >
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuelle">Mensuelle</option>
                </select>
                {aDesTours && (
                  <div className="form-text text-muted">
                    Non modifiable : des tours existent déjà avec ce calendrier.
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Nombre de tours / participants</label>
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
                <label className="form-label">Date de début</label>
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
                    Non modifiable : des tours existent déjà avec cette date.
                  </div>
                )}
                {erreurs.date_debut && <div className="text-danger small mt-1">{erreurs.date_debut[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">Statut</label>
                <select
                  className="form-select"
                  name="statut"
                  value={form.statut}
                  onChange={handleChange}
                >
                  <option value="actif">Actif</option>
                  <option value="cloture">Clôturé</option>
                </select>
                {form.statut === 'cloture' && (
                  <div className="form-text text-danger">
                    Un sol clôturé n'accepte plus de nouveaux membres ni de nouvelles cotisations.
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn-sol border-0" disabled={envoi}>
                  {envoi ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
                  Annuler
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