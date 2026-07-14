import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Connexion() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [erreurs, setErreurs] = useState({});
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});

    api.post('/login', form)
      .then((response) => {
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

  return (
    <div className="row justify-content-center py-4">
      <div className="col-md-6 col-lg-5">
        <div className="text-center mb-3">
          <span className="hero-eyebrow">SolTrack</span>
        </div>
        <div className="card">
          <div className="card-body p-4">
            <h1 className="text-center mb-1" style={{ fontSize: '1.8rem' }}>Content de vous revoir</h1>
            <p className="text-center text-muted mb-4">
              Connectez-vous pour retrouver vos sols.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
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
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
                {erreurs.password && <div className="text-danger small mt-1">{erreurs.password[0]}</div>}
              </div>

              <button type="submit" className="btn-sol w-100 border-0">
                Se connecter
              </button>
            </form>

            <p className="text-center mt-3 mb-0 small">
              Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Connexion;
