import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';

function ChampMotDePasse({ value, onChange, name, placeholder, className = 'form-control', id, autoFocus }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="position-relative">
      <input
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ paddingRight: '2.75rem' }}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-1 p-1 border-0"
        style={{ background: 'transparent', color: 'var(--texte-muted)' }}
        tabIndex={-1}
      >
        {visible ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>
    </div>
  );
}

export default ChampMotDePasse;