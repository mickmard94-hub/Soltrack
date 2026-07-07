import { FaLinkedin, FaInstagram, FaXTwitter } from 'react-icons/fa6';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p className="mb-1 fw-bold">SolTrack</p>
        <small className="d-block mb-3">Gestion numérique de sols &middot; © 2026</small>
        <div className="footer-socials">
          <a
            href="https://www.linkedin.com/in/michel-mardochée-bb3111217?utm_source=share_via&utm_content=profile&utm_medium=member_android"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={20} />
          </a>

          <a
            href="https://www.instagram.com/mick_mard20?utm_source=qr&igsh=MXVtNjNxZmZ5aTQwOQ=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram size={20} />
          </a>

         <a
            href="https://x.com/mickmard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
          >
            <FaXTwitter size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;