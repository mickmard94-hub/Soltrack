import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
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

  // ===== Double authentification =====
  const [activation2fa, setActivation2fa] = useState(null); // { secret, uri }
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [code2faConfirmation, setCode2faConfirmation] = useState('');
  const [erreur2fa, setErreur2fa] = useState(null);
  const [envoi2fa, setEnvoi2fa] = useState(false);
  const [message2fa, setMessage2fa] = useState(null);

  const [desactivation2faOuverte, setDesactivation2faOuverte] = useState(false);
  const [mdpDesactivation2fa, setMdpDesactivation2fa] = useState('');
  const [erreurDesactivation2fa, setErreurDesactivation2fa] = useState(null);
  const [envoiDesactivation2fa, setEnvoiDesactivation2fa] = useState(false);

  useEffect(() => {
    if (activation2fa?.uri) {
      QRCode.toDataURL(activation2fa.uri, { width: 220, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }
  }, [activation2fa]);

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

  const demarrerActivation2fa = () => {
    setErreur2fa(null);
    api.post('/2fa/activer')
      .then((response) => {
        setActivation2fa(response.data);
      })
      .catch((error) => {
        setErreur2fa(error.response?.data?.message || 'Erreur lors de l\'activation.');
      });
  };

  const confirmerActivation2fa = (e) => {
    e.preventDefault();
    setErreur2fa(null);
    setEnvoi2fa(true);

    api.post('/2fa/confirmer', { code: code2faConfirmation })
      .then(() => {
        updateUser({ ...user, two_factor_enabled: true });
        setActivation2fa(null);
        setQrDataUrl(null);
        setCode2faConfirmation('');
        setEnvoi2fa(false);
        setMessage2fa(t('parametres.deuxfa_active'));
      })
      .catch((error) => {
        setEnvoi2fa(false);
        setErreur2fa(error.response?.data?.message || 'Code invalide.');
      });
  };

  const handleDesactivation2fa = () => {
    setErreurDesactivation2fa(null);
    setEnvoiDesactivation2fa(true);

    api.post('/2fa/desactiver', { password: mdpDesactivation2fa })
      .then(() => {
        updateUser({ ...user, two_factor_enabled: false });
        setDesactivation2faOuverte(false);
        setMdpDesactivation2fa('');
        setEnvoiDesactivation2fa(false);
      })
      .catch((error) => {
        setEnvoiDesactivation2fa(false);
        setErreurDesactivation2fa(error.response?.data?.message || 'Mot de passe incorrect.');
      });
  };

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to={user ? '/sols' : '/'} className="btn btn-sm btn-outline-secondary mb-3">
          ← {t('common.retour')}
        </Link>

        <span className="hero-eyebrow">{t('nav.parametres')}</span>
        <h1 className="mt-1 mb-4">{t('parametres.titre')}</h1>

        {/* Langue */}
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

        {/* Thème */}
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

            {/* Double authentification */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">{t('parametres.deuxfa_titre')}</h5>
                  <span className={`sceau ${user.two_factor_enabled ? 'sceau-paye' : 'sceau-neutre'}`}>
                    {user.two_factor_enabled ? t('parametres.deuxfa_active') : t('parametres.deuxfa_inactive')}
                  </span>
                </div>
                <p className="text-muted small mb-3">{t('parametres.deuxfa_intro')}</p>

                {message2fa && <div className="alert alert-success py-2">{message2fa}</div>}

                {!user.two_factor_enabled && !activation2fa && (
                  <button type="button" className="btn-sol border-0" onClick={demarrerActivation2fa}>
                    {t('parametres.deuxfa_activer_bouton')}
                  </button>
                )}

                {!user.two_factor_enabled && activation2fa && (
                  <div>
                    <p className="small mb-2">{t('parametres.deuxfa_scanner')}</p>
                    {qrDataUrl && (
                      <div className="text-center mb-3">
                        <img src={qrDataUrl} alt="QR code" style={{ borderRadius: 8 }} />
                      </div>
                    )}
                    <div className="mb-3 text-center">
                      <code className="chiffre" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                        {activation2fa.secret}
                      </code>
                    </div>

                    <form onSubmit={confirmerActivation2fa}>
                      <label className="form-label small">{t('parametres.deuxfa_confirmer_label')}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="form-control text-center chiffre mb-2"
                        style={{ fontSize: '1.3rem', letterSpacing: '0.25em' }}
                        value={code2faConfirmation}
                        onChange={(e) => setCode2faConfirmation(e.target.value.replace(/\D/g, ''))}
                      />
                      {erreur2fa && <div className="text-danger small mb-2">{erreur2fa}</div>}
                      <button type="submit" className="btn-sol border-0" disabled={envoi2fa || code2faConfirmation.length !== 6}>
                        {envoi2fa ? t('common.chargement') : t('parametres.deuxfa_confirmer_bouton')}
                      </button>
                    </form>
                  </div>
                )}

                {user.two_factor_enabled && !desactivation2faOuverte && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => setDesactivation2faOuverte(true)}
                  >
                    {t('parametres.deuxfa_desactiver_bouton')}
                  </button>
                )}

                {user.two_factor_enabled && desactivation2faOuverte && (
                  <div>
                    <label className="form-label small">{t('parametres.deuxfa_desactiver_mdp')}</label>
                    <input
                      type="password"
                      className="form-control mb-2"
                      value={mdpDesactivation2fa}
                      onChange={(e) => setMdpDesactivation2fa(e.target.value)}
                    />
                    {erreurDesactivation2fa && <div className="text-danger small mb-2">{erreurDesactivation2fa}</div>}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleDesactivation2fa}
                        disabled={envoiDesactivation2fa || !mdpDesactivation2fa}
                      >
                        {envoiDesactivation2fa ? t('common.chargement') : t('parametres.deuxfa_desactiver_confirmer')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => { setDesactivation2faOuverte(false); setMdpDesactivation2fa(''); setErreurDesactivation2fa(null); }}
                      >
                        {t('common.annuler')}
                      </button>
                    </div>
                  </div>
                )}
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