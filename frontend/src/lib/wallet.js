import { createConfig, http } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, rainbowWallet, base, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { defineChain } from 'viem';

export const robinhood = defineChain({
  id: Number(process.env.REACT_APP_ROBINHOOD_CHAIN_ID),
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.REACT_APP_ROBINHOOD_RPC_URL] } },
  blockExplorers: { default: { name: 'Robinhood Explorer', url: process.env.REACT_APP_ROBINHOOD_EXPLORER_URL } },
  testnet: true,
});
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error('WalletConnect Project ID is required.');
export const walletConfig = createConfig({
  chains: [robinhood],
  connectors: connectorsForWallets([
    { groupName: 'Recommended wallets', wallets: [metaMaskWallet, rainbowWallet, base] },
    { groupName: 'Other wallets', wallets: [injectedWallet, walletConnectWallet] },
  ], {
    appName: 'Frostfish', projectId,
    appDescription: 'A cozy fishing village on Robinhood Chain Testnet. Demo tokens only.',
    appUrl: process.env.REACT_APP_BACKEND_URL,
    appIcon: `${process.env.REACT_APP_BACKEND_URL}/frostfish-icon.svg`,
    walletConnectParameters: { disableProviderPing: true },
  }),
  transports: { [robinhood.id]: http(process.env.REACT_APP_ROBINHOOD_RPC_URL) },
});