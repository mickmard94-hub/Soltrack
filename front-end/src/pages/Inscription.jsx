import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Inscription() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [erreurs, setErreurs] = useState({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErreurs({});

    api.post('/register', form)
      .then((response) => {
        login(response.data.user, response.data.token);
        navigate('/sols');
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          setErreurs(error.response.data.errors);
        } else {
          console.error('Erreur lors de l\'inscription :', error);
        }
      });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card">
          <div className="card-body p-4">
            <h1 className="text-center mb-1">Bienvenue sur SolTrack</h1>
            <p className="text-center text-muted mb-4">
              Créez votre compte pour commencer à gérer vos sols en toute simplicité.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nom complet</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex : Marie Joseph"
                />
                {erreurs.name && <div className="text-danger">{erreurs.name[0]}</div>}
              </div>

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
                {erreurs.email && <div className="text-danger">{erreurs.email[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
                {erreurs.password && <div className="text-danger">{erreurs.password[0]}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-sol w-100">
                Créer mon compte
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inscription;