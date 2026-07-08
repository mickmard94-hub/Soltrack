import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function EnregistrerCotisation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membres, setMembres] = useState([]);
  const [chargementMembres, setChargementMembres] = useState(true);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [form, setForm] = useState({
    membre_id: '',
    tour_numero: '',
    montant: '',
    date_paiement: '',
  });

  useEffect(() => {
    setChargementMembres(true);
    api.get(`/sols/${id}/membres`)
      .then((response) => {
        setMembres(response.data);
        setChargementMembres(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des membres :', error);
        setChargementMembres(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});
    setErreurGenerale('');

    api.post('/cotisations', { ...form, sol_id: id })
      .then(() => {
        navigate(`/sols/${id}`);
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          if (error.response.data.errors) {
            setErreurs(error.response.data.errors);
          } else if (error.response.data.message) {
            setErreurGenerale(error.response.data.message);
          }
        } else {
          console.error('Erreur lors de l\'enregistrement de la cotisation :', error);
        }
      });
  };

  const handleAnnuler = () => {
    navigate(`/sols/${id}`);
  };

  return (
    <div>
      <h1>Enregistrer une cotisation</h1>

      {erreurGenerale && (
        <div className="alert alert-danger">{erreurGenerale}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Membre</label>
          {chargementMembres ? (
            // Empêche toute interaction avec le menu tant que la liste réelle
            // des membres n'est pas arrivée du serveur : évite de proposer un
            // menu vide ou périmé (source de confusion pour l'utilisateur,
            // et de faux échecs pour des tests automatisés trop rapides).
            <select className="form-select" disabled>
              <option>Chargement des membres...</option>
            </select>
          ) : (
            <select
              className="form-select"
              name="membre_id"
              value={form.membre_id}
              onChange={handleChange}
            >
              <option value="">-- Sélectionner un membre --</option>
              {membres.map((membre) => (
                <option key={membre.id} value={membre.id}>{membre.nom}</option>
              ))}
            </select>
          )}
          {erreurs.membre_id && <div className="text-danger">{erreurs.membre_id[0]}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Tour concerné</label>
          <input
            type="number"
            className="form-control"
            name="tour_numero"
            value={form.tour_numero}
            onChange={handleChange}
            placeholder="Ex : 1"
          />
          {erreurs.tour_numero && <div className="text-danger">{erreurs.tour_numero[0]}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Montant (HTG)</label>
          <input
            type="number"
            className="form-control"
            name="montant"
            value={form.montant}
            onChange={handleChange}
            placeholder="Ex : 2000"
          />
          {erreurs.montant && <div className="text-danger">{erreurs.montant[0]}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Date de paiement</label>
          <input
            type="date"
            className="form-control"
            name="date_paiement"
            value={form.date_paiement}
            onChange={handleChange}
          />
          {erreurs.date_paiement && <div className="text-danger">{erreurs.date_paiement[0]}</div>}
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-sol" disabled={chargementMembres}>
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

export default EnregistrerCotisation;