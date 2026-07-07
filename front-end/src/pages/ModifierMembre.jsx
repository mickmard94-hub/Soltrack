import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ModifierMembre() {
  const { id, membreId } = useParams();
  const navigate = useNavigate();
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(true);
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    ordre_reception: '',
  });

  useEffect(() => {
    api.get(`/sols/${id}/membres`)
      .then((response) => {
        const membre = response.data.find((m) => m.id === parseInt(membreId));
        if (membre) {
          setForm({
            nom: membre.nom,
            telephone: membre.telephone || '',
            ordre_reception: membre.ordre_reception,
          });
        }
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement du membre :', error);
        setChargement(false);
      });
  }, [id, membreId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});

    api.put(`/membres/${membreId}`, form)
      .then(() => {
        navigate(`/sols/${id}/membres`);
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          setErreurs(error.response.data.errors);
        } else {
          console.error('Erreur lors de la modification du membre :', error);
        }
      });
  };

  const handleAnnuler = () => {
    navigate(`/sols/${id}/membres`);
  };

  if (chargement) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <h1>Modifier le membre</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nom du membre</label>
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
          <label className="form-label">Téléphone</label>
          <input
            type="text"
            className="form-control"
            name="telephone"
            value={form.telephone}
            onChange={handleChange}
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
          />
          {erreurs.ordre_reception && <div className="text-danger">{erreurs.ordre_reception[0]}</div>}
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

export default ModifierMembre;