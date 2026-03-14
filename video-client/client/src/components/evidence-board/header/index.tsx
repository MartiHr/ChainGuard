import ThemeToggle from '../../ThemeToggle';
import type { HeaderProps } from './models';

export function Header({ wallet, onLogout, dark, onToggleTheme }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <span className="logo">ChainGuard</span>
        <span className="header-divider">|</span>
        <span className="header-subtitle">Evidence Dashboard</span>
      </div>
      <div className="header-right">
        <span className="wallet-address" title={wallet.address}>
          {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
        </span>
        <button className="btn-logout" onClick={onLogout}>
          Lock &amp; Logout
        </button>
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
