import React, { useState } from 'react';
import { Layers, List, Wallet, Coins, ArrowRightLeft, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  parsedTx: any;
  dryRunEffects: any;
}

export function TransactionDetails({ parsedTx, dryRunEffects }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'commands' | 'effects'>('overview');

  const sender = parsedTx.sender;
  const gasData = parsedTx.gasData;
  const commands = parsedTx.commands || [];
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="flex border-b border-neutral-200 px-2 pt-2 bg-neutral-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'overview' 
              ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg' 
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Layers size={16} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('commands')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'commands' 
              ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg' 
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <List size={16} />
          Transactions ({commands.length})
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'effects' 
              ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg' 
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <ArrowRightLeft size={16} />
          Effects {dryRunEffects ? '(Available)' : '(Unavailable)'}
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200 pb-8">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                icon={<Wallet size={16} />}
                label="Sender"
                value={sender}
                copyable
              />
              <InfoCard
                icon={<Cpu size={16} />}
                label="Gas Budget"
                value={gasData?.budget ? `${Number(gasData.budget) / 1e9} SUI` : 'N/A'}
              />
              <InfoCard
                icon={<Coins size={16} />}
                label="Gas Price"
                value={gasData?.price ? `${gasData.price} MIST` : 'N/A'}
              />
              <InfoCard
                icon={<ShieldAlert size={16} />}
                label="Expiration"
                value={parsedTx.expiration ? JSON.stringify(parsedTx.expiration) : 'None'}
              />
              <div className="md:col-span-2">
                 <InfoCard
                   icon={<Wallet size={16} />}
                   label="Gas Payment Setup"
                   value={
                     gasData?.payment && gasData.payment.length > 0 
                       ? `${gasData.payment.length} object(s)` 
                       : 'Sponsor / Direct / None set'
                   }
                 />
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-100 mt-6">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wider">Inputs</h3>
              {parsedTx.inputs && parsedTx.inputs.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {parsedTx.inputs.map((input: any, i: number) => (
                    <div key={i} className="text-sm flex flex-col md:flex-row gap-2 bg-white p-3 rounded-md border border-neutral-200">
                      <span className="font-mono text-neutral-500 min-w-[30px]">#{i}</span>
                      <div className="font-mono text-neutral-800 break-all overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(input)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm italic">No inputs found in this transaction.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="space-y-4 animate-in fade-in duration-200 pb-8">
            {commands.length === 0 ? (
              <p className="text-neutral-500 italic text-center py-10">No transactions in this block.</p>
            ) : (
              commands.map((cmd: any, idx: number) => (
                <CommandCard key={idx} index={idx} command={cmd} />
              ))
            )}
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="space-y-6 animate-in fade-in duration-200 pb-8">
            {!dryRunEffects ? (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-lg text-center">
                <ShieldAlert size={32} className="mx-auto mb-3 opacity-50 text-orange-500" />
                <h3 className="font-semibold text-lg mb-1">Dry Run Failed or Not Performed</h3>
                <p className="text-sm text-orange-700 leading-relaxed max-w-lg mx-auto">
                  The RPC node could not dry-run this transaction. This usually happens if the transaction is missing a valid gas payment object, sender, or if the referenced objects do not exist on the selected network.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                 {dryRunEffects.effects?.status?.status === 'success' ? (
                   <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                     <span className="font-medium text-sm">Transaction Dry Run Succeeded</span>
                   </div>
                 ) : (
                   <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
                       <span className="font-medium text-sm">Expected Failure in Dry Run</span>
                     </div>
                     <p className="font-mono text-xs">{dryRunEffects.effects?.status?.error}</p>
                   </div>
                 )}
                 
                 {dryRunEffects.balanceChanges && dryRunEffects.balanceChanges.length > 0 && (
                   <div>
                     <h3 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wider">Balance Changes</h3>
                     <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                       <table className="w-full text-sm text-left">
                         <thead className="bg-neutral-50 border-b border-neutral-200">
                           <tr>
                             <th className="px-4 py-3 font-medium text-neutral-600">Owner</th>
                             <th className="px-4 py-3 font-medium text-neutral-600">Coin Type</th>
                             <th className="px-4 py-3 font-medium text-neutral-600">Amount</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-neutral-100 bg-white">
                           {dryRunEffects.balanceChanges.map((bc: any, i: number) => {
                              const isPositive = !bc.amount.startsWith('-');
                              const meta = dryRunEffects.coinMetadata?.[bc.coinType];
                              const isSui = bc.coinType.includes('0x2::sui::SUI');
                              const decimals = meta?.decimals ?? (isSui ? 9 : 0);
                              const symbol = meta?.symbol || (isSui ? 'SUI' : bc.coinType.split('::').pop());
                              
                              const displayAmount = formatTokenAmount(bc.amount, decimals);
                              
                              return (
                               <tr key={i}>
                                 <td className="px-4 py-3 font-mono text-xs truncate max-w-[150px]" title={bc.owner?.AddressOwner || 'Unknown'}>
                                   {bc.owner?.AddressOwner || 'Unknown'}
                                 </td>
                                 <td className="px-4 py-3 font-mono text-xs text-blue-600 truncate max-w-[200px]" title={bc.coinType}>
                                   {symbol}
                                 </td>
                                 <td className={`px-4 py-3 font-medium text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                   {isPositive ? '+' : '-'}{displayAmount} {symbol}
                                 </td>
                               </tr>
                              )
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}

                 {dryRunEffects.objectChanges && dryRunEffects.objectChanges.length > 0 && (
                   <div className="pt-2">
                     <h3 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wider">Object Changes</h3>
                     <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                       <table className="w-full text-sm text-left">
                         <thead className="bg-neutral-50 border-b border-neutral-200">
                           <tr>
                             <th className="px-4 py-3 font-medium text-neutral-600">Type</th>
                             <th className="px-4 py-3 font-medium text-neutral-600">Object ID</th>
                             <th className="px-4 py-3 font-medium text-neutral-600">Object Type</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-neutral-100 bg-white">
                           {dryRunEffects.objectChanges.map((oc: any, i: number) => {
                              let typeColor = 'text-neutral-600';
                              if (oc.type === 'mutated') typeColor = 'text-blue-600';
                              if (oc.type === 'created') typeColor = 'text-emerald-600';
                              if (oc.type === 'deleted') typeColor = 'text-red-600';

                              return (
                               <tr key={i}>
                                 <td className={`px-4 py-3 font-semibold text-xs uppercase ${typeColor}`}>
                                   {oc.type}
                                 </td>
                                 <td className="px-4 py-3 font-mono text-xs truncate max-w-[150px]" title={oc.objectId}>
                                   {oc.objectId}
                                 </td>
                                 <td className="px-4 py-3 font-mono text-xs text-purple-600 truncate max-w-[200px]" title={oc.objectType}>
                                   {oc.objectType?.split('::').pop() || 'N/A'}
                                 </td>
                               </tr>
                              )
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}

                 {/* Further expansion could include raw payload */}
                 <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wider">Raw Effects Payload</h3>
                    <div className="bg-neutral-900 rounded-lg p-4 overflow-auto max-h-[400px]">
                      <pre className="text-[11px] font-mono leading-relaxed text-emerald-400">
                        {JSON.stringify(dryRunEffects, null, 2)}
                      </pre>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, copyable }: { icon: React.ReactNode, label: string, value: string | undefined | null, copyable?: boolean }) {
  return (
    <div className="bg-neutral-50 rounded-lg p-4 flex flex-col border border-neutral-100">
      <div className="flex items-center gap-2 text-neutral-500 mb-1.5">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      {value ? (
        <span className={`text-sm text-neutral-800 ${copyable ? 'font-mono' : 'font-medium'} break-all`}>
          {value}
        </span>
      ) : (
        <span className="text-sm text-neutral-400 italic">Not specified</span>
      )}
    </div>
  );
}

function CommandCard({ index, command }: { index: number, command: any, key?: React.Key }) {
  const kind = command.$kind || Object.keys(command)[0];
  const data = command[kind] || command;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <span className="bg-white border border-neutral-200 font-mono text-xs w-6 h-6 flex items-center justify-center rounded-md font-medium text-neutral-500 shadow-sm">
          {index}
        </span>
        <span className="text-sm font-semibold text-neutral-800">{String(kind)}</span>
      </div>
      <div className="p-4 bg-white overflow-x-auto">
        <pre className="text-xs font-mono text-neutral-600 leading-relaxed whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function formatTokenAmount(amountStr: string, decimals: number): string {
    let isNegative = String(amountStr).startsWith('-');
    let absStr = isNegative ? String(amountStr).slice(1) : String(amountStr);
    if (decimals === 0) return absStr;
    
    absStr = absStr.padStart(decimals + 1, '0');
    const integers = absStr.slice(0, absStr.length - decimals);
    const decimalsPart = absStr.slice(absStr.length - decimals).replace(/0+$/, '');
    return decimalsPart ? `${integers}.${decimalsPart}` : integers;
}