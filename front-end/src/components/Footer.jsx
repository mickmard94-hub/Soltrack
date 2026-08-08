import { Link } from 'react-router-dom';
import { FaLinkedin, FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { useLang } from '../contexts/LangContext';

function Footer() {
  const { t } = useLang();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p className="mb-1 fw-bold">Sòl Ansanm</p>
        <small className="d-block mb-3">{t('footer.tagline')} &middot; © 2026</small>

        <div className="d-flex justify-content-center gap-3 mb-3 small">
          <Link to="/contact" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {t('contact.titre')}
          </Link>
          <Link to="/avis" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {t('avis.titre')}
          </Link>
        </div>

        <div className="footer-socials">
          <a href="https://www.linkedin.com/in/michel-mardochée-bb3111217?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FaLinkedin size={20} />
          </a>
          <a href="https://www.instagram.com/mick_mard20?utm_source=qr&igsh=MXVtNjNxZmZ5aTQwOQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaInstagram size={20} />
          </a>
          <a href="https://x.com/mickmard" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <FaXTwitter size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;