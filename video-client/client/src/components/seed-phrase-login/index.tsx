import { useState, useRef } from 'react';
import { walletFromMnemonic } from '../../blockchain.ts';
import ThemeToggle from '../theme-toggle/index.tsx';

import chainGuardLogo from '../assets/ChainGuard.png';
import type { SeedPhraseLoginProps } from './models.ts';

export default function SeedPhraseLogin({
  onLogin,
  dark,
  onToggleTheme,
}: SeedPhraseLoginProps) {
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addWords = (raw: string) => {
    const parts = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return;
    setWords((prev) => {
      const combined = [...prev, ...parts];
      return combined.slice(0, 12);
    });
    setCurrentWord('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addWords(currentWord);
    }
    if (e.key === 'Backspace' && currentWord === '' && words.length > 0) {
      e.preventDefault();
      setWords((prev) => prev.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // If pasted text contains spaces, split into words immediately
    if (val.includes(' ')) {
      addWords(val);
    } else {
      setCurrentWord(val);
    }
  };

  const removeWord = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Include any pending word the user hasn't confirmed yet
    if (currentWord.trim() !== '') {
      addWords(currentWord);
      return; // state will update; user clicks again with all words confirmed
    }

    if (words.length !== 12) {
      setError(`Enter exactly 12 words (${words.length}/12 entered).`);
      return;
    }

    const finalWords = words;

    try {
      setLoading(true);
      const wallet = walletFromMnemonic(finalWords.join(' '));
      onLogin(wallet);
    } catch {
      setError('Invalid seed phrase. Please check your words and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-theme-toggle">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="shield-icon">
            <img src={chainGuardLogo} alt="ChainGuard" className="logo-img" />
          </div>
          <h1>ChainGuard</h1>
          <p className="subtitle">Tamper-Proof Evidence Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="seed-word">
            Enter your 12-word seed phrase ({words.length}/12)
          </label>

          <input
            ref={inputRef}
            id="seed-word"
            type="text"
            className="word-input"
            placeholder={
              words.length >= 12
                ? 'All 12 words entered ✓'
                : `Word ${words.length + 1} of 12`
            }
            value={currentWord}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            disabled={loading || words.length >= 12}
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Deriving wallet…' : 'Unlock Evidence Vault'}
          </button>
        </form>

        <p className="login-note">
          Your private key is derived locally and <strong>never</strong>{' '}
          transmitted or stored.
        </p>
      </div>

      {/* Floating bubbles below the card */}
      {words.length > 0 && (
        <div className="bubble-trail">
          {words.map((w, i) => (
            <span
              key={i}
              className="word-bubble"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => !loading && removeWord(i)}
              title="Click to remove"
            >
              <span className="bubble-index">{i + 1}</span>
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
