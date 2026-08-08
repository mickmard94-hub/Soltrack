import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

function Contact() {
  const { user } = useAuth();
  const { t } = useLang();

  const email = 'Mickmard94@gmail.com';
  const telephone = '+509 4825 3134';

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to={user ? '/sols' : '/'} className="btn btn-sm btn-outline-secondary mb-3">
          ← {t('common.retour')}
        </Link>
        <br />
        <span className="hero-eyebrow">{t('nav.parametres')}</span>
        <h1 className="mt-1 mb-2">{t('contact.titre')}</h1>
        <p className="text-muted mb-4">{t('contact.intro')}</p>

        <div className="card mb-3">
          <div className="card-body d-flex align-items-center gap-3">
            <div className="theme-toggle" style={{ background: 'var(--bleu-moyen)', color: '#fff' }}>
              <FaEnvelope size={15} />
            </div>
            <div>
              <div className="text-muted small">{t('contact.email_label')}</div>
              <a href={`mailto:${email}`} className="fw-semibold">{email}</a>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body d-flex align-items-center gap-3">
            <div className="theme-toggle" style={{ background: 'var(--vert-paye)', color: '#fff' }}>
              <FaPhone size={13} />
            </div>
            <div>
              <div className="text-muted small">{t('contact.telephone_label')}</div>
              <a href={`tel:${telephone.replace(/\s/g, '')}`} className="fw-semibold">{telephone}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;