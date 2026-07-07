import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function AjouterMembre() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [erreurs, setErreurs] = useState({});
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    ordre_reception: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});

    api.post(`/sols/${id}/membres`, form)
      .then(() => {
        navigate(`/sols/${id}`);
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          setErreurs(error.response.data.errors);
        } else {
          console.error('Erreur lors de l\'ajout du membre :', error);
        }
      });
  };

  const handleAnnuler = () => {
    navigate(`/sols/${id}`);
  };

  return (
    <div>
      <h1>Ajouter un membre</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nom du membre</label>
          <input
            type="text"
            className="form-control"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            placeholder="Ex : Marie Joseph"
          />
          {erreurs.nom && <div className="text-danger">{erreurs.nom[0]}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Téléphone</label>
          <input
            type="text"
            className="form-control"
            name="telephone"
            value={form.telephone}
            onChange={handleChange}
            placeholder="Ex : 3712 3456"
          />
          {erreurs.telephone && <div className="text-danger">{erreurs.telephone[0]}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Ordre de réception</label>
          <input
            type="number"
            className="form-control"
            name="ordre_reception"
            value={form.ordre_reception}
            onChange={handleChange}
            placeholder="Ex : 3"
          />
          {erreurs.ordre_reception && <div className="text-danger">{erreurs.ordre_reception[0]}</div>}
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-sol">
            Enregistrer
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default AjouterMembre;