import type { WalletState } from '../../types';

export interface SeedPhraseLoginProps {
  onLogin: (wallet: WalletState) => void;
  dark: boolean;
  onToggleTheme: () => void;
}
