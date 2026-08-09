import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function EnregistrerCotisation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [membres, setMembres] = useState([]);
  const [chargementMembres, setChargementMembres] = useState(true);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [form, setForm] = useState({
    membre_id: '',
    tour_numero: '',
    montant: '',
  });

  const aujourdhui = new Date().toLocaleDateString('fr-FR');

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
    setEnvoi(true);

    api.post('/cotisations', { ...form, sol_id: id })
      .then(() => {
        navigate(`/sols/${id}`);
      })
      .catch((error) => {
        setEnvoi(false);
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
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to={`/sols/${id}`} className="btn btn-sm btn-outline-secondary mb-3">
          {t('membres.retour_sol')}
        </Link>
        <br />
        <span className="hero-eyebrow">{t('cotisations.eyebrow')}</span>
        <h1 className="mt-1 mb-4">{t('cotisations.titre_enregistrer')}</h1>

        {erreurGenerale && (
          <div className="alert alert-danger">{erreurGenerale}</div>
        )}

        <div className="card">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('cotisations.membre')}</label>
                {chargementMembres ? (
                  <select className="form-select" disabled>
                    <option>{t('cotisations.chargement_membres')}</option>
                  </select>
                ) : (
                  <select
                    className="form-select"
                    name="membre_id"
                    value={form.membre_id}
                    onChange={handleChange}
                  >
                    <option value="">{t('cotisations.selectionner_membre')}</option>
                    {membres.map((membre) => (
                      <option key={membre.id} value={membre.id}>{membre.nom}</option>
                    ))}
                  </select>
                )}
                {erreurs.membre_id && <div className="text-danger small mt-1">{erreurs.membre_id[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('cotisations.tour_concerne')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="tour_numero"
                  value={form.tour_numero}
                  onChange={handleChange}
                  placeholder="Ex : 1"
                />
                {erreurs.tour_numero && <div className="text-danger small mt-1">{erreurs.tour_numero[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('cotisations.montant')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="montant"
                  value={form.montant}
                  onChange={handleChange}
                  placeholder="Ex : 2000"
                />
                {erreurs.montant && <div className="text-danger small mt-1">{erreurs.montant[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">{t('cotisations.date_cotisation')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={`${t('cotisations.aujourdhui')} — ${aujourdhui}`}
                  disabled
                />
                <div className="form-text">
                  {t('cotisations.date_aide')}
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn-dore border-0" disabled={chargementMembres || envoi}>
                  {envoi ? t('cotisations.enregistrement') : t('cotisations.enregistrer')}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
                  {t('cotisations.annuler')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnregistrerCotisation;
