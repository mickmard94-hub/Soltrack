import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function AjouterMembre() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [nombreMembresActuel, setNombreMembresActuel] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    ordre_reception: '',
  });

  useEffect(() => {
    api.get(`/sols/${id}/membres`)
      .then((response) => {
        const count = response.data.length;
        setNombreMembresActuel(count);
        setForm((precedent) => ({ ...precedent, ordre_reception: count + 1 }));
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des membres :', error);
      });
  }, [id]);

  const handleChange = (e) => {
    setErreurGenerale('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});
    setErreurGenerale('');
    setEnvoi(true);

    api.post(`/sols/${id}/membres`, form)
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
          console.error('Erreur lors de l\'ajout du membre :', error);
        }
      });
  };

  const handleAnnuler = () => {
    navigate(`/sols/${id}`);
  };

  const positionMax = nombreMembresActuel !== null ? nombreMembresActuel + 1 : undefined;

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to={`/sols/${id}`} className="btn btn-sm btn-outline-secondary mb-3">
          {t('membres.retour_sol')}
        </Link>
        <span className="hero-eyebrow">{t('membres.eyebrow')}</span>
        <h1 className="mt-1 mb-4">{t('membres.ajouter_titre')}</h1>

        {erreurGenerale && (
          <div className="alert alert-danger">{erreurGenerale}</div>
        )}

        <div className="card">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('membres.nom_membre')}</label>
                <input
                  type="text"
                  className="form-control"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder={t('membres.nom_placeholder')}
                />
                {erreurs.nom && <div className="text-danger small mt-1">{erreurs.nom[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">{t('membres.telephone')}</label>
                <input
                  type="text"
                  className="form-control"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  placeholder={t('membres.telephone_placeholder')}
                />
                {erreurs.telephone && <div className="text-danger small mt-1">{erreurs.telephone[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">{t('membres.position')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="ordre_reception"
                  value={form.ordre_reception}
                  onChange={handleChange}
                  min={1}
                  max={positionMax}
                />
                <div className="form-text">
                  {positionMax
                    ? `${t('membres.position_aide_prefix')} ${positionMax}. ${t('membres.position_aide_ajout')}`
                    : t('common.chargement')}
                </div>
                {erreurs.ordre_reception && <div className="text-danger small mt-1">{erreurs.ordre_reception[0]}</div>}
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn-sol border-0" disabled={envoi}>
                  {envoi ? t('membres.enregistrement') : t('membres.enregistrer')}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={handleAnnuler}>
                  {t('membres.annuler')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AjouterMembre;