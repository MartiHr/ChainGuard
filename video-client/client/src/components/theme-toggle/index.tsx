import type { ThemeProps } from './models';

export default function ThemeToggle({ dark, onToggle }: ThemeProps) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="toggle-track">
        <span className="toggle-icon sun">☀️</span>
        <span className="toggle-icon moon">🌙</span>
        <span className="toggle-thumb" />
      </span>
    </button>
  );
}
