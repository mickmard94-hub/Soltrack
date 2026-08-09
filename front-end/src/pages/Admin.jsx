import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';
import ChampMotDePasse from '../components/ChampMotDePasse';

const PHRASE_CONFIRMATION = 'SUPPRIMER TOUT';

const LIBELLES_ACTIONS_RESTREINTES = {
  export_utilisateurs: 'Exporter la liste des utilisateurs',
  export_avis: 'Exporter les avis',
  export_journal: "Exporter le journal d'audit",
  reinitialiser_base: 'Réinitialiser la base de données',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateHeure(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR');
}

function telechargerBlob(blob, nomParDefaut) {
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomParDefaut;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}

function BarreProgression({ label, valeur }) {
  return (
    <div className="barre-progression-ligne">
      <div className="barre-progression-entete">
        <span className="small">{label}</span>
        <span className="chiffre small">{valeur}%</span>
      </div>
      <div className="barre-progression-piste">
        <div className="barre-progression-remplissage" style={{ width: `${valeur}%` }}></div>
      </div>
    </div>
  );
}

const LIBELLES_ACTIONS_JOURNAL = {
  inscription: 'Inscription',
  connexion: 'Connexion',
  deconnexion: 'Déconnexion',
  modification_profil: 'Modification du profil',
  changement_mot_de_passe: 'Changement de mot de passe',
  suppression_compte: 'Suppression de compte',
  promotion_admin: 'Promotion administrateur',
  revocation_admin: 'Révocation administrateur',
  activation_2fa: 'Activation double authentification',
  desactivation_2fa: 'Désactivation double authentification',
  reinitialisation_base: 'Réinitialisation de la base de données',
  approbation_demande_admin: "Demande d'autorisation approuvée",
  refus_demande_admin: "Demande d'autorisation refusée",
};

function Admin() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [secret, setSecret] = useState('');
  const [promotionErreur, setPromotionErreur] = useState(null);
  const [promotionEnvoi, setPromotionEnvoi] = useState(false);

  const [stats, setStats] = useState(null);
  const [recentsUtilisateurs, setRecentsUtilisateurs] = useState([]);
  const [recentsAvis, setRecentsAvis] = useState([]);
  const [recentsJournal, setRecentsJournal] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreurChargement, setErreurChargement] = useState(null);
  const [exportEnCours, setExportEnCours] = useState(null);
  const [messageExport, setMessageExport] = useState(null);

  const [admins, setAdmins] = useState([]);
  const [revocationEnCours, setRevocationEnCours] = useState(null);
  const [revocationErreur, setRevocationErreur] = useState(null);

  const [demandes, setDemandes] = useState([]);
  const [demandeEnCours, setDemandeEnCours] = useState(null);
  const [traitementEnCours, setTraitementEnCours] = useState(null);

  const [zoneReinitOuverte, setZoneReinitOuverte] = useState(false);
  const [confirmationSaisie, setConfirmationSaisie] = useState('');
  const [reinitEnvoi, setReinitEnvoi] = useState(false);
  const [reinitErreur, setReinitErreur] = useState(null);

  const estPrincipal = user?.admin_niveau === 'principal';

  const chargerDemandes = () => {
    api.get('/admin/demandes')
      .then((response) => setDemandes(response.data))
      .catch((error) => console.error('Erreur demandes :', error));
  };

  const chargerTout = () => {
    setChargement(true);
    setErreurChargement(null);
    Promise.all([
      api.get('/admin/statistiques'),
      api.get('/admin/utilisateurs/recents'),
      api.get('/admin/avis/recents'),
      api.get('/admin/journal/recents'),
      api.get('/admin/administrateurs'),
      api.get('/admin/demandes'),
    ])
      .then(([reponseStats, reponseUsers, reponseAvis, reponseJournal, reponseAdmins, reponseDemandes]) => {
        setStats(reponseStats.data);
        setRecentsUtilisateurs(reponseUsers.data);
        setRecentsAvis(reponseAvis.data);
        setRecentsJournal(reponseJournal.data);
        setAdmins(reponseAdmins.data);
        setDemandes(reponseDemandes.data);
        setChargement(false);
      })
      .catch((error) => {
        setChargement(false);
        if (error.response?.status === 403) {
          setErreurChargement('Accès réservé aux administrateurs.');
        } else {
          console.error('Erreur admin :', error);
        }
      });
  };

  useEffect(() => {
    if (user?.is_admin) {
      chargerTout();
    }
  }, [user]);

  const handlePromouvoir = (e) => {
    e.preventDefault();
    setPromotionErreur(null);
    setPromotionEnvoi(true);

    api.post('/admin/promouvoir', { secret })
      .then((response) => {
        updateUser(response.data.user);
        setPromotionEnvoi(false);
      })
      .catch((error) => {
        setPromotionEnvoi(false);
        setPromotionErreur(
          error.response?.data?.message || 'Secret invalide.'
        );
      });
  };

  const revoquerAdmin = (utilisateurId) => {
    setRevocationErreur(null);
    setRevocationEnCours(utilisateurId);

    api.delete(`/admin/revoquer/${utilisateurId}`)
      .then(() => {
        setAdmins((liste) => liste.filter((a) => a.id !== utilisateurId));
        setRevocationEnCours(null);
      })
      .catch((error) => {
        setRevocationEnCours(null);
        setRevocationErreur(error.response?.data?.message || 'Erreur lors de la révocation.');
      });
  };

  // Trouve, parmi ses propres demandes, une demande approuvée et pas
  // encore utilisée pour cette action précise.
  const demandeApprouveePour = (action) =>
    demandes.find((d) => d.action === action && d.statut === 'approuvee');

  const demandeEnAttentePour = (action) =>
    demandes.find((d) => d.action === action && d.statut === 'en_attente');

  const exporterCsv = (type) => {
    setMessageExport(null);
    const action = type === 'utilisateurs' ? 'export_utilisateurs' : type === 'avis' ? 'export_avis' : 'export_journal';

    // Admin secondaire sans autorisation approuvée : on envoie une demande
    // au lieu d'agir directement.
    if (!estPrincipal && !demandeApprouveePour(action)) {
      if (demandeEnAttentePour(action)) {
        setMessageExport("Une demande est déjà en attente d'approbation du principal.");
        return;
      }
      setDemandeEnCours(action);
      api.post('/admin/demandes', { action })
        .then(() => {
          setMessageExport("Demande envoyée à l'administrateur principal. Vous serez notifié dès qu'elle sera traitée.");
          chargerDemandes();
          setDemandeEnCours(null);
        })
        .catch((error) => {
          setDemandeEnCours(null);
          setMessageExport(error.response?.data?.message || 'Erreur lors de la demande.');
        });
      return;
    }

    setExportEnCours(type);
    const chemins = {
      utilisateurs: '/admin/utilisateurs/export',
      avis: '/admin/avis/export',
      journal: '/admin/journal/export',
    };
    const noms = {
      utilisateurs: 'utilisateurs.csv',
      avis: 'avis.csv',
      journal: 'journal_audit.csv',
    };

    api.get(chemins[type], { responseType: 'blob' })
      .then((response) => {
        telechargerBlob(response.data, noms[type]);
        setExportEnCours(null);
        chargerDemandes(); // l'autorisation vient d'être consommée
      })
      .catch((error) => {
        console.error('Erreur export CSV :', error);
        setExportEnCours(null);
        setMessageExport(error.response?.data?.message || 'Erreur lors de l\'export.');
      });
  };

  const approuverDemande = (demandeId) => {
    setTraitementEnCours(demandeId);
    api.post(`/admin/demandes/${demandeId}/approuver`)
      .then(() => {
        setDemandes((liste) => liste.filter((d) => d.id !== demandeId));
        setTraitementEnCours(null);
      })
      .catch((error) => {
        console.error(error);
        setTraitementEnCours(null);
      });
  };

  const refuserDemande = (demandeId) => {
    setTraitementEnCours(demandeId);
    api.post(`/admin/demandes/${demandeId}/refuser`)
      .then(() => {
        setDemandes((liste) => liste.filter((d) => d.id !== demandeId));
        setTraitementEnCours(null);
      })
      .catch((error) => {
        console.error(error);
        setTraitementEnCours(null);
      });
  };

  const handleReinitialiser = () => {
    const action = 'reinitialiser_base';

    if (!estPrincipal && !demandeApprouveePour(action)) {
      if (demandeEnAttentePour(action)) {
        setReinitErreur("Une demande est déjà en attente d'approbation du principal.");
        return;
      }
      setReinitEnvoi(true);
      api.post('/admin/demandes', { action })
        .then(() => {
          setReinitErreur("Demande envoyée à l'administrateur principal. Vous serez notifié dès qu'elle sera traitée.");
          chargerDemandes();
          setReinitEnvoi(false);
        })
        .catch((error) => {
          setReinitEnvoi(false);
          setReinitErreur(error.response?.data?.message || 'Erreur lors de la demande.');
        });
      return;
    }

    setReinitErreur(null);
    setReinitEnvoi(true);

    api.delete('/admin/reinitialiser', { data: { confirmation: confirmationSaisie } })
      .then(() => {
        logout();
        navigate('/');
      })
      .catch((error) => {
        setReinitEnvoi(false);
        setReinitErreur(
          error.response?.data?.message || 'Erreur lors de la réinitialisation.'
        );
      });
  };

  if (!user?.is_admin) {
    return (
      <div className="row justify-content-center py-2">
        <div className="col-md-6">
          <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
            ← {t('common.retour')}
          </Link>
          <br />
          <span className="hero-eyebrow">Administration</span>
          <h1 className="mt-1 mb-4">Accès administrateur</h1>
          <div className="card">
            <div className="card-body p-4">
              <p className="text-muted mb-3">
                Ce compte n'est pas encore administrateur. Entrez le code secret pour l'activer.
              </p>
              <form onSubmit={handlePromouvoir}>
                <ChampMotDePasse
                  className="form-control mb-2"
                  placeholder="Code secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                {promotionErreur && <div className="text-danger small mb-2">{promotionErreur}</div>}
                <button type="submit" className="btn-sol border-0" disabled={promotionEnvoi || !secret}>
                  {promotionEnvoi ? t('common.chargement') : 'Activer'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (chargement || !stats) {
    return (
      <div>
        <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
          ← {t('common.retour')}
        </Link>
        <p>{t('common.chargement')}</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
        ← {t('common.retour')}
      </Link>
      <br />
      <span className="hero-eyebrow">Administration</span>
      <h1 className="mt-1 mb-4">Vue d'ensemble</h1>

      {erreurChargement && <div className="alert alert-danger">{erreurChargement}</div>}

      <div className="admin-stat-grille mb-4">
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Utilisateurs</div>
          <div className="admin-stat-valeur">{stats.nombre_utilisateurs}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Sols créés</div>
          <div className="admin-stat-valeur">{stats.nombre_sols}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Avis reçus</div>
          <div className="admin-stat-valeur">{stats.nombre_avis}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Premier inscrit</div>
          <div className="admin-stat-valeur" style={{ fontSize: '1.1rem' }}>{formatDate(stats.premiere_inscription)}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Dernier inscrit</div>
          <div className="admin-stat-valeur" style={{ fontSize: '1.1rem' }}>{formatDate(stats.derniere_inscription)}</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body p-4">
          <h6 className="card-title mb-3">Taux de réponse par question</h6>
          <BarreProgression label="A aimé son expérience" valeur={stats.taux_reponse.aime} />
          <BarreProgression label="Meilleures pages désignées" valeur={stats.taux_reponse.meilleures_pages} />
          <BarreProgression label="Pages à améliorer désignées" valeur={stats.taux_reponse.pages_a_ameliorer} />
          <BarreProgression label="Recommanderait Sòl Ansanm" valeur={stats.taux_reponse.recommande} />
        </div>
      </div>

      {messageExport && <div className="alert alert-warning py-2">{messageExport}</div>}

      <div className="admin-section-entete">
        <h6 className="mb-0">Derniers utilisateurs inscrits</h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exporterCsv('utilisateurs')}
          disabled={exportEnCours === 'utilisateurs' || demandeEnCours === 'export_utilisateurs' || stats.nombre_utilisateurs === 0}
        >
          {exportEnCours === 'utilisateurs' || demandeEnCours === 'export_utilisateurs'
            ? 'Patientez...'
            : !estPrincipal && !demandeApprouveePour('export_utilisateurs')
              ? '🔒 Demander l\'export CSV'
              : '⬇ Export CSV complet'}
        </button>
      </div>
      <div className="card mb-4">
        <div className="card-body px-4 py-2">
          {recentsUtilisateurs.length === 0 ? (
            <p className="text-muted small py-2 mb-0">Aucun utilisateur pour l'instant.</p>
          ) : (
            recentsUtilisateurs.map((u) => (
              <div className="admin-recent-item" key={u.id}>
                <div>
                  <div className="fw-semibold">{u.name}</div>
                  <div className="text-muted small">{u.email}</div>
                </div>
                <div className="text-end">
                  <div className="chiffre small">{u.sols_count} sol{u.sols_count > 1 ? 's' : ''}</div>
                  <div className="text-muted small">{formatDateHeure(u.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-section-entete">
        <h6 className="mb-0">Derniers avis reçus</h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exporterCsv('avis')}
          disabled={exportEnCours === 'avis' || demandeEnCours === 'export_avis' || stats.nombre_avis === 0}
        >
          {exportEnCours === 'avis' || demandeEnCours === 'export_avis'
            ? 'Patientez...'
            : !estPrincipal && !demandeApprouveePour('export_avis')
              ? '🔒 Demander l\'export CSV'
              : '⬇ Export CSV complet'}
        </button>
      </div>
      <div className="card mb-4">
        <div className="card-body px-4 py-2">
          {recentsAvis.length === 0 ? (
            <p className="text-muted small py-2 mb-0">Aucun avis pour l'instant.</p>
          ) : (
            recentsAvis.map((a) => (
              <div className="admin-recent-item" key={a.id} style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="d-flex gap-2 flex-wrap small mb-1">
                    <span>Aimé : <strong>{a.aime === null ? '—' : a.aime ? 'Oui' : 'Non'}</strong></span>
                    <span>&middot;</span>
                    <span>Recommande : <strong>{a.recommande === null ? '—' : a.recommande ? 'Oui' : 'Non'}</strong></span>
                  </div>
                  <div className="text-muted small">
                    {a.user ? a.user.name : 'Anonyme'}
                  </div>
                </div>
                <div className="text-muted small text-end">{formatDateHeure(a.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Administrateurs actuels */}
      <div className="admin-section-entete">
        <h6 className="mb-0">Administrateurs ({admins.length} / 3)</h6>
      </div>
      <div className="card mb-4">
        <div className="card-body px-4 py-2">
          {revocationErreur && <div className="alert alert-danger py-2 my-2">{revocationErreur}</div>}
          {admins.map((admin) => (
            <div className="admin-recent-item" key={admin.id}>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold">{admin.name}</span>
                  <span className={`sceau ${admin.admin_niveau === 'principal' ? 'sceau-paye' : 'sceau-neutre'}`}>
                    {admin.admin_niveau === 'principal' ? 'Principal' : 'Secondaire'}
                  </span>
                  {admin.id === user.id && <span className="text-muted small">(vous)</span>}
                </div>
                <div className="text-muted small">{admin.email}</div>
              </div>
              {estPrincipal && admin.id !== user.id && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => revoquerAdmin(admin.id)}
                  disabled={revocationEnCours === admin.id}
                >
                  {revocationEnCours === admin.id ? '...' : 'Révoquer'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Demandes d'autorisation — vue principal : approuver/refuser */}
      {estPrincipal && (
        <>
          <div className="admin-section-entete">
            <h6 className="mb-0">Demandes d'autorisation en attente ({demandes.length})</h6>
          </div>
          <div className="card mb-4">
            <div className="card-body px-4 py-2">
              {demandes.length === 0 ? (
                <p className="text-muted small py-2 mb-0">Aucune demande en attente.</p>
              ) : (
                demandes.map((d) => (
                  <div className="admin-recent-item" key={d.id}>
                    <div>
                      <div className="fw-semibold small">{LIBELLES_ACTIONS_RESTREINTES[d.action] || d.action}</div>
                      <div className="text-muted small">
                        {d.demandeur?.name} ({d.demandeur?.email}) &middot; {formatDateHeure(d.created_at)}
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-sol border-0"
                        onClick={() => approuverDemande(d.id)}
                        disabled={traitementEnCours === d.id}
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => refuserDemande(d.id)}
                        disabled={traitementEnCours === d.id}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Journal d'audit — 3 derniers + export CSV */}
      <div className="admin-section-entete">
        <h6 className="mb-0">Journal d'audit — actions récentes</h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exporterCsv('journal')}
          disabled={exportEnCours === 'journal' || demandeEnCours === 'export_journal'}
        >
          {exportEnCours === 'journal' || demandeEnCours === 'export_journal'
            ? 'Patientez...'
            : !estPrincipal && !demandeApprouveePour('export_journal')
              ? '🔒 Demander l\'export CSV'
              : '⬇ Export CSV complet'}
        </button>
      </div>
      <div className="card mb-5">
        <div className="card-body px-4 py-2">
          {recentsJournal.length === 0 ? (
            <p className="text-muted small py-2 mb-0">Aucune entrée pour l'instant.</p>
          ) : (
            recentsJournal.map((entree) => (
              <div className="admin-recent-item" key={entree.id}>
                <div>
                  <div className="fw-semibold small">{LIBELLES_ACTIONS_JOURNAL[entree.action] || entree.action}</div>
                  <div className="text-muted small">
                    {entree.user ? entree.user.name : 'Système / inconnu'}
                    {entree.entite ? ` · ${entree.entite}${entree.entite_id ? ` #${entree.entite_id}` : ''}` : ''}
                  </div>
                </div>
                <div className="text-muted small text-end">{formatDateHeure(entree.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card border-danger">
        <div className="card-body p-4">
          <h5 className="card-title text-danger mb-2">Zone très sensible</h5>
          <p className="text-muted small mb-3">
            Supprime définitivement TOUTES les données (utilisateurs, sols, membres, cotisations, avis).
            Cette action est irréversible et vous déconnectera aussi, puisque votre propre compte sera supprimé.
            {!estPrincipal && ' Nécessite l\'autorisation de l\'administrateur principal.'}
          </p>

          {!zoneReinitOuverte ? (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setZoneReinitOuverte(true)}
            >
              Réinitialiser toute la base de données
            </button>
          ) : (
            <div>
              <label className="form-label small">
                Tapez exactement <strong>{PHRASE_CONFIRMATION}</strong> pour confirmer
              </label>
              <input
                type="text"
                className="form-control mb-2"
                value={confirmationSaisie}
                onChange={(e) => setConfirmationSaisie(e.target.value)}
                placeholder={PHRASE_CONFIRMATION}
              />
              {reinitErreur && <div className="text-danger small mb-2">{reinitErreur}</div>}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleReinitialiser}
                  disabled={reinitEnvoi || (estPrincipal && confirmationSaisie !== PHRASE_CONFIRMATION)}
                >
                  {reinitEnvoi
                    ? t('common.chargement')
                    : !estPrincipal && !demandeApprouveePour('reinitialiser_base')
                      ? "Demander l'autorisation"
                      : 'Confirmer la suppression totale'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setZoneReinitOuverte(false); setConfirmationSaisie(''); setReinitErreur(null); }}
                >
                  {t('common.annuler')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
