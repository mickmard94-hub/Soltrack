import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ModifierSol() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(true);
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
    setErreurs({});

    api.put(`/sols/${id}`, form)
      .then(() => {
        navigate(`/sols/${id}`);
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          setErreurs(error.response.data.errors);
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
    <div>
      <h1>Modifier le sol</h1>
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
          {erreurs.nom && <div className="text-danger">{erreurs.nom[0]}</div>}
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
          {erreurs.montant_cotisation && <div className="text-danger">{erreurs.montant_cotisation[0]}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Fréquence</label>
          <select
            className="form-select"
            name="frequence"
            value={form.frequence}
            onChange={handleChange}
          >
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuelle">Mensuelle</option>
          </select>
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
          {erreurs.nombre_tours && <div className="text-danger">{erreurs.nombre_tours[0]}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Date de début</label>
          <input
            type="date"
            className="form-control"
            name="date_debut"
            value={form.date_debut}
            onChange={handleChange}
          />
          {erreurs.date_debut && <div className="text-danger">{erreurs.date_debut[0]}</div>}
        </div>

        <div className="mb-3">
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
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-sol">
            Enregistrer les modifications
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default ModifierSol;