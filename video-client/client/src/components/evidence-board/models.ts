import type { WalletState } from '../../types';

export interface EvidenceBoardProps {
  wallet: WalletState;
  onLogout: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}
