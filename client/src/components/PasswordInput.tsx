import { useState } from "react";
import "./PasswordInput.css";

type PasswordInputProps = {
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
};

function PasswordInput({ value, placeholder, autoComplete, onChange }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        className="line-input"
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        className="password-eye"
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 20 20 4" />}
        </svg>
      </button>
    </div>
  );
}

export default PasswordInput;
