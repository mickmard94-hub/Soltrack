import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';

function Parametres() {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { langue, setLangue, t, langues } = useLang();
  const navigate = useNavigate();

  const [profil, setProfil] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profilMessage, setProfilMessage] = useState(null);
  const [profilErreurs, setProfilErreurs] = useState({});
  const [profilEnvoi, setProfilEnvoi] = useState(false);

  const [motDePasse, setMotDePasse] = useState({
    current_password: '', password: '', password_confirmation: '',
  });
  const [mdpMessage, setMdpMessage] = useState(null);
  const [mdpErreurs, setMdpErreurs] = useState({});
  const [mdpEnvoi, setMdpEnvoi] = useState(false);

  const [motDePasseSuppression, setMotDePasseSuppression] = useState('');
  const [suppressionErreur, setSuppressionErreur] = useState(null);
  const [suppressionEnvoi, setSuppressionEnvoi] = useState(false);
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const handleProfilSubmit = (e) => {
    e.preventDefault();
    setProfilErreurs({});
    setProfilMessage(null);
    setProfilEnvoi(true);

    api.put('/user/profil', profil)
      .then((response) => {
        updateUser(response.data);
        setProfilMessage(t('parametres.profil_maj'));
        setProfilEnvoi(false);
      })
      .catch((error) => {
        setProfilEnvoi(false);
        if (error.response?.status === 422) {
          setProfilErreurs(error.response.data.errors || {});
        }
      });
  };

  const handleMotDePasseSubmit = (e) => {
    e.preventDefault();
    setMdpErreurs({});
    setMdpMessage(null);
    setMdpEnvoi(true);

    api.put('/user/mot-de-passe', motDePasse)
      .then(() => {
        setMdpMessage(t('parametres.mdp_maj'));
        setMotDePasse({ current_password: '', password: '', password_confirmation: '' });
        setMdpEnvoi(false);
      })
      .catch((error) => {
        setMdpEnvoi(false);
        if (error.response?.status === 422) {
          setMdpErreurs(error.response.data.errors || {});
        }
      });
  };

  const handleSuppression = () => {
    setSuppressionErreur(null);
    setSuppressionEnvoi(true);

    api.delete('/user', { data: { password: motDePasseSuppression } })
      .then(() => {
        logout();
        navigate('/');
      })
      .catch((error) => {
        setSuppressionEnvoi(false);
        if (error.response?.status === 422) {
          setSuppressionErreur(
            error.response.data.errors?.password?.[0] || 'Mot de passe incorrect.'
          );
        }
      });
  };

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to={user ? '/sols' : '/'} className="btn btn-sm btn-outline-secondary mb-3">
          ← {t('common.retour')}
        </Link>
        <br />

        <span className="hero-eyebrow">{t('nav.parametres')}</span>
        <h1 className="mt-1 mb-4">{t('parametres.titre')}</h1>

        {/* Langue — accessible avec ou sans connexion */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">{t('parametres.langue')}</h5>
            <div className="d-flex flex-wrap gap-2">
              {langues.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={langue === l.code ? 'btn-sol border-0' : 'btn btn-outline-secondary'}
                  onClick={() => setLangue(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thème — accessible avec ou sans connexion */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">{t('parametres.theme')}</h5>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={theme === 'dark' ? 'btn-sol border-0' : 'btn btn-outline-secondary'}
                onClick={() => theme !== 'dark' && toggleTheme()}
              >
                {t('parametres.theme_sombre')}
              </button>
              <button
                type="button"
                className={theme === 'light' ? 'btn-sol border-0' : 'btn btn-outline-secondary'}
                onClick={() => theme !== 'light' && toggleTheme()}
              >
                {t('parametres.theme_clair')}
              </button>
            </div>
          </div>
        </div>

        {/* Le reste (compte, mot de passe, suppression) n'apparaît que
            si l'utilisateur est connecté : rien à gérer sinon, et le
            header propose déjà Connexion / S'inscrire. */}
        {user && (
          <>
            {/* Compte */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">{t('parametres.compte')}</h5>

                {profilMessage && <div className="alert alert-success py-2">{profilMessage}</div>}

                <form onSubmit={handleProfilSubmit}>
                  <div className="mb-3">
                    <label className="form-label">{t('parametres.nom')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profil.name}
                      onChange={(e) => setProfil({ ...profil, name: e.target.value })}
                    />
                    {profilErreurs.name && <div className="text-danger small mt-1">{profilErreurs.name[0]}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('parametres.email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profil.email}
                      onChange={(e) => setProfil({ ...profil, email: e.target.value })}
                    />
                    {profilErreurs.email && <div className="text-danger small mt-1">{profilErreurs.email[0]}</div>}
                  </div>

                  <button type="submit" className="btn-sol border-0" disabled={profilEnvoi}>
                    {profilEnvoi ? t('common.chargement') : t('parametres.enregistrer_profil')}
                  </button>
                </form>

                <hr className="my-4" />

                {mdpMessage && <div className="alert alert-success py-2">{mdpMessage}</div>}

                <form onSubmit={handleMotDePasseSubmit}>
                  <div className="mb-3">
                    <label className="form-label">{t('parametres.mot_de_passe_actuel')}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={motDePasse.current_password}
                      onChange={(e) => setMotDePasse({ ...motDePasse, current_password: e.target.value })}
                    />
                    {mdpErreurs.current_password && <div className="text-danger small mt-1">{mdpErreurs.current_password[0]}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('parametres.nouveau_mot_de_passe')}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={motDePasse.password}
                      onChange={(e) => setMotDePasse({ ...motDePasse, password: e.target.value })}
                    />
                    {mdpErreurs.password && <div className="text-danger small mt-1">{mdpErreurs.password[0]}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('parametres.confirmer_mot_de_passe')}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={motDePasse.password_confirmation}
                      onChange={(e) => setMotDePasse({ ...motDePasse, password_confirmation: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-outline-secondary" disabled={mdpEnvoi}>
                    {mdpEnvoi ? t('common.chargement') : t('parametres.changer_mot_de_passe')}
                  </button>
                </form>
              </div>
            </div>

            {/* Zone sensible */}
            <div className="card border-danger">
              <div className="card-body">
                <h5 className="card-title text-danger mb-2">{t('parametres.zone_danger')}</h5>
                <p className="text-muted small mb-3">{t('parametres.supprimer_compte_texte')}</p>

                {!confirmationOuverte ? (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => setConfirmationOuverte(true)}
                  >
                    {t('parametres.supprimer_compte')}
                  </button>
                ) : (
                  <div>
                    <label className="form-label small">{t('parametres.mot_de_passe_confirmation')}</label>
                    <input
                      type="password"
                      className="form-control mb-2"
                      value={motDePasseSuppression}
                      onChange={(e) => setMotDePasseSuppression(e.target.value)}
                    />
                    {suppressionErreur && <div className="text-danger small mb-2">{suppressionErreur}</div>}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleSuppression}
                        disabled={suppressionEnvoi || !motDePasseSuppression}
                      >
                        {suppressionEnvoi ? t('common.chargement') : t('common.confirmer')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => { setConfirmationOuverte(false); setMotDePasseSuppression(''); setSuppressionErreur(null); }}
                      >
                        {t('common.annuler')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Parametres;