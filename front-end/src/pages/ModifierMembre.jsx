import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useLang } from '../contexts/LangContext';

function ModifierMembre() {
  const { id, membreId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(true);
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
        setNombreMembresActuel(response.data.length);
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
    setErreurGenerale('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});
    setErreurGenerale('');
    setEnvoi(true);

    api.put(`/membres/${membreId}`, form)
      .then(() => {
        navigate(`/sols/${id}/membres`);
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
          console.error('Erreur lors de la modification du membre :', error);
        }
      });
  };

  const handleAnnuler = () => {
    navigate(`/sols/${id}/membres`);
  };

  if (chargement) {
    return <p>{t('common.chargement')}</p>;
  }

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to={`/sols/${id}/membres`} className="btn btn-sm btn-outline-secondary mb-3">
          {t('membres.retour_membres')}
        </Link>
        <span className="hero-eyebrow">{t('membres.eyebrow')}</span>
        <h1 className="mt-1 mb-4">{t('membres.modifier_titre')}</h1>

        <div className="card">
          <div className="card-body p-4">
            {erreurGenerale && (
              <div className="alert alert-danger">{erreurGenerale}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('membres.nom_membre')}</label>
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
                <label className="form-label">{t('membres.telephone')}</label>
                <input
                  type="text"
                  className="form-control"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                />
                {erreurs.telephone && <div className="text-danger small mt-1">{erreurs.telephone[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">{t('membres.ordre_reception')}</label>
                <input
                  type="number"
                  className="form-control"
                  name="ordre_reception"
                  value={form.ordre_reception}
                  onChange={handleChange}
                  min={1}
                  max={nombreMembresActuel || undefined}
                />
                <div className="form-text">
                  {nombreMembresActuel
                    ? `${t('membres.position_aide_prefix')} ${nombreMembresActuel}. ${t('membres.position_aide_modif')}`
                    : ''}
                </div>
                {erreurs.ordre_reception && <div className="text-danger small mt-1">{erreurs.ordre_reception[0]}</div>}
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn-sol border-0" disabled={envoi}>
                  {envoi ? t('membres.enregistrement') : t('membres.enregistrer_modifications')}
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

export default ModifierMembre;