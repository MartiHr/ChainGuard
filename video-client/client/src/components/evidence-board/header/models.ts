import type { WalletState } from '../../../types';

export interface HeaderProps {
  wallet: WalletState;
  onLogout: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}
