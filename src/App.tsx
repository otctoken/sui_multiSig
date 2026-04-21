/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '@mysten/dapp-kit/dist/index.css';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createNetworkConfig, SuiClientProvider, WalletProvider, ConnectButton } from '@mysten/dapp-kit';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';

import { NetworkSelector } from './components/NetworkSelector';
import { TransactionParser } from './components/TransactionParser';
import { TransactionDetails } from './components/TransactionDetails';
import { LayoutDashboard, FileJson, Activity } from 'lucide-react';

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet'), network: 'mainnet' },
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' },
  devnet: { url: getJsonRpcFullnodeUrl('devnet'), network: 'devnet' },
});

const queryClient = new QueryClient();

export default function App() {
  const [network, setNetwork] = useState<'mainnet' | 'testnet' | 'devnet'>('mainnet');

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} network={network}>
        <WalletProvider>
          <AppContent network={network} setNetwork={setNetwork} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

function AppContent({
  network,
  setNetwork
}: {
  network: 'mainnet' | 'testnet' | 'devnet',
  setNetwork: (network: 'mainnet' | 'testnet' | 'devnet') => void
}) {
  const [base64Input, setBase64Input] = useState('');
  const [parsedTx, setParsedTx] = useState<any>(null);
  const [dryRunEffects, setDryRunEffects] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <LayoutDashboard size={20} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Sui Multi-Sig Explorer</h1>
        </div>
        <div className="flex items-center gap-4">
          <NetworkSelector network={network} setNetwork={setNetwork} />
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
             <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 p-6">
               <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
                 <FileJson size={18} className="text-blue-500" />
                 Transaction Input
               </h2>
               <TransactionParser
                 base64Input={base64Input}
                 setBase64Input={setBase64Input}
                 setParsedTx={setParsedTx}
                 setDryRunEffects={setDryRunEffects}
                 setError={setError}
                 network={network}
               />
               
               {error && (
                 <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 break-words">
                   <p className="font-semibold mb-1">Error parsing transaction:</p>
                   {error}
                 </div>
               )}
             </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {parsedTx ? (
              <TransactionDetails 
                 parsedTx={parsedTx} 
                 dryRunEffects={dryRunEffects} 
              />
            ) : (
              <div className="bg-neutral-100/50 rounded-xl border border-neutral-200 border-dashed h-96 flex flex-col items-center justify-center text-neutral-400">
                <Activity size={48} className="mb-4 opacity-50" />
                <p>Enter a base64 transaction to view its details and effects</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
