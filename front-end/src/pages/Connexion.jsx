import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import ChampMotDePasse from '../components/ChampMotDePasse';

function Connexion() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLang();
  const [erreurs, setErreurs] = useState({});
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [etape, setEtape] = useState('identifiants');
  const [jetonTemporaire, setJetonTemporaire] = useState(null);
  const [code2fa, setCode2fa] = useState('');
  const [erreur2fa, setErreur2fa] = useState(null);
  const [envoi2fa, setEnvoi2fa] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});

    api.post('/login', form)
      .then((response) => {
        if (response.data.deux_facteurs_requis) {
          setJetonTemporaire(response.data.jeton_temporaire);
          setEtape('code2fa');
          return;
        }
        login(response.data.user, response.data.token);
        navigate('/sols');
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          setErreurs(error.response.data.errors);
        } else {
          console.error('Erreur lors de la connexion :', error);
        }
      });
  };

  const handleSubmit2fa = (e) => {
    e.preventDefault();
    setErreur2fa(null);
    setEnvoi2fa(true);

    api.post('/2fa/verifier-connexion', {
      jeton_temporaire: jetonTemporaire,
      code: code2fa,
    })
      .then((response) => {
        login(response.data.user, response.data.token);
        navigate('/sols');
      })
      .catch((error) => {
        setEnvoi2fa(false);
        setErreur2fa(error.response?.data?.message || 'Code invalide.');
      });
  };

  if (etape === 'code2fa') {
    return (
      <div className="row justify-content-center py-4">
        <div className="col-md-6 col-lg-5">
          <div className="text-center mb-3">
            <span className="hero-eyebrow">{t('auth.eyebrow')}</span>
          </div>
          <div className="card">
            <div className="card-body p-4">
              <h1 className="text-center mb-1" style={{ fontSize: '1.6rem' }}>{t('auth.code_2fa_titre')}</h1>
              <p className="text-center text-muted mb-4 small">
                {t('auth.code_2fa_intro')}
              </p>

              <form onSubmit={handleSubmit2fa}>
                <div className="mb-4">
                  <label className="form-label">{t('auth.code_2fa_label')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="form-control text-center chiffre"
                    style={{ fontSize: '1.5rem', letterSpacing: '0.3em' }}
                    value={code2fa}
                    onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                  {erreur2fa && <div className="text-danger small mt-2 text-center">{erreur2fa}</div>}
                </div>

                <button type="submit" className="btn-sol w-100 border-0" disabled={envoi2fa || code2fa.length !== 6}>
                  {envoi2fa ? t('common.chargement') : t('auth.valider_bouton')}
                </button>
              </form>

              <button
                type="button"
                className="btn btn-link w-100 mt-2 text-muted small"
                onClick={() => { setEtape('identifiants'); setCode2fa(''); setErreur2fa(null); }}
              >
                {t('auth.retour_connexion')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center py-4">
      <div className="col-md-6 col-lg-5">
        <div className="text-center mb-3">
          <span className="hero-eyebrow">{t('auth.eyebrow')}</span>
        </div>
        <div className="card">
          <div className="card-body p-4">
            <h1 className="text-center mb-1" style={{ fontSize: '1.8rem' }}>{t('auth.connexion_titre')}</h1>
            <p className="text-center text-muted mb-4">
              {t('auth.connexion_sous_titre')}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('auth.email')}</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                />
                {erreurs.email && <div className="text-danger small mt-1">{erreurs.email[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">{t('auth.mot_de_passe')}</label>
                <ChampMotDePasse
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
                {erreurs.password && <div className="text-danger small mt-1">{erreurs.password[0]}</div>}
              </div>

              <button type="submit" className="btn-sol w-100 border-0">
                {t('auth.se_connecter')}
              </button>
            </form>

            <p className="text-center mt-3 mb-0 small">
              {t('auth.pas_de_compte')} <Link to="/inscription">{t('auth.sinscrire')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Connexion;