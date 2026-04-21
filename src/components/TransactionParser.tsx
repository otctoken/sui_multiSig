import React, { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { SuiJsonRpcClient as SuiClient, getJsonRpcFullnodeUrl as getFullnodeUrl } from '@mysten/sui/jsonRpc';
import { fromBase64 } from '@mysten/sui/utils';
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';
import { PenTool, CheckCircle2, Send } from 'lucide-react';
import { MultiSigPublicKey } from '@mysten/sui/multisig';

interface Props {
  base64Input: string;
  setBase64Input: (val: string) => void;
  setParsedTx: (tx: any) => void;
  setDryRunEffects: (effects: any) => void;
  setError: (err: string | null) => void;
  network: 'mainnet' | 'testnet' | 'devnet';
}

export function TransactionParser({
  base64Input,
  setBase64Input,
  setParsedTx,
  setDryRunEffects,
  setError,
  network,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [signatureResult, setSignatureResult] = useState<any>(null);
  
  const [sig2Input, setSig2Input] = useState('');
  const [multiSigPubKeyInput, setMultiSigPubKeyInput] = useState('');
  const [executeResult, setExecuteResult] = useState<any>(null);

  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const handleParse = async () => {
    setError(null);
    setParsedTx(null);
    setDryRunEffects(null);
    setSignatureResult(null);
    setExecuteResult(null);

    if (!base64Input.trim()) {
      setError('Please provide a valid Base64 transaction string.');
      return;
    }

    setIsLoading(true);

    try {
      // Parse Base64 to TransactionBlock
      const tx = Transaction.from(base64Input);
      const txData = tx.getData();
      setParsedTx(txData);

      // Perform a dry run
      try {
          const client = new SuiClient({ url: getFullnodeUrl(network), network: network });
          // Note: using dryRunTransactionBlock requires Uint8Array of the tx block bytes
          const txBytes = fromBase64(base64Input);
          const effects = await client.dryRunTransactionBlock({
            transactionBlock: txBytes,
          });

          // Fetch coin metadata for better token display
          if (effects.balanceChanges && effects.balanceChanges.length > 0) {
            const coinTypes = Array.from(new Set(effects.balanceChanges.map(c => c.coinType)));
            const metadataPromises = coinTypes.map(async (type) => {
              try {
                const meta = await client.getCoinMetadata({ coinType: type });
                return { type, meta };
              } catch (e) {
                return { type, meta: null };
              }
            });
            const metadataResults = await Promise.all(metadataPromises);
            const metadataMap = metadataResults.reduce((acc: any, curr: any) => {
              if (curr.meta) acc[curr.type] = curr.meta;
              return acc;
            }, {});
            
            (effects as any).coinMetadata = metadataMap;
          }

          setDryRunEffects(effects);
      } catch (dryRunErr: any) {
          console.error("Dry run failed:", dryRunErr);
          // If dry run fails, we just don't set dryRunEffects
          // Don't fail the whole parsing process
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    setError(null);
    setSignatureResult(null);
    setExecuteResult(null);
    try {
      const tx = Transaction.from(base64Input);
      const result = await signTransaction({
        transaction: tx,
      });
      setSignatureResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign transaction.');
    }
  };

  const handleExecute = async () => {
    setError(null);
    setExecuteResult(null);
    if (!signatureResult || !sig2Input.trim() || !multiSigPubKeyInput.trim() || !base64Input.trim()) {
      setError('Missing parameters for Multisig Execution. Ensure you have signed (Sig 1), provided the other signature (Sig 2), and the MultiSig Public Key.');
      return;
    }

    setIsLoading(true);
    try {
      const client = new SuiClient({ url: getFullnodeUrl(network), network: network });
      const txBytes = fromBase64(base64Input);

      let multiSigPublicKey;
      try {
        multiSigPublicKey = new MultiSigPublicKey(multiSigPubKeyInput.trim());
      } catch (err) {
        throw new Error("Invalid MultiSig Public Key provided.");
      }

      const combinedSignature = multiSigPublicKey.combinePartialSignatures([
        signatureResult.signature,
        sig2Input.trim(),
      ]);

      const response = await client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: combinedSignature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log("转账成功！交易哈希 (Digest):", response.digest);
      if (response.effects?.status.status === "success") {
        console.log("交易在链上执行成功。");
      }
      setExecuteResult(response);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to execute multi-sig transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Base64 Transaction Data
        </label>
        <textarea
          className="w-full h-48 p-3 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono text-neutral-800 break-all placeholder:text-neutral-400 resize-none transition-all"
          placeholder="AA=="
          value={base64Input}
          onChange={(e) => {
            setBase64Input(e.target.value);
            setSignatureResult(null);
            setExecuteResult(null);
          }}
          spellCheck={false}
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleParse}
          disabled={isLoading || !base64Input.trim()}
          className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && !signatureResult && !executeResult ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Parse & Preview Effects'
          )}
        </button>

        <button
          onClick={handleSign}
          disabled={!currentAccount || !base64Input.trim() || isLoading}
          className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-900 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <PenTool size={18} />
          Sign Transaction
        </button>
      </div>

      {!currentAccount && base64Input.trim() && (
        <p className="text-xs text-neutral-500 text-right">Connect wallet to sign</p>
      )}

      {/* MultiSig Execution Section */}
      <div className="mt-6 p-4 border border-neutral-200 bg-white rounded-lg shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-neutral-800">Execute MultiSig Transaction</h3>
        
        {/* We assume the current user has already signed and generated `signatureResult` */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            MultiSig Public Key (Base64)
          </label>
          <input
            type="text"
            className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono"
            placeholder="Enter MultiSig PubKey"
            value={multiSigPubKeyInput}
            onChange={(e) => setMultiSigPubKeyInput(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Sig 2 Input (Other Signer's Signature)
          </label>
          <input
            type="text"
            className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono"
            placeholder="Enter second signature base64"
            value={sig2Input}
            onChange={(e) => setSig2Input(e.target.value)}
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={isLoading || !signatureResult || !sig2Input.trim() || !multiSigPubKeyInput.trim()}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && signatureResult ? (
            <div className="w-5 h-5 border-2 border-emerald-200 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} />
              Execute Transaction
            </>
          )}
        </button>
        
        {(!signatureResult) && (
          <p className="text-xs text-neutral-500 italic">Please sign the transaction first to generate Sig 1.</p>
        )}
      </div>

      {executeResult && (
        <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-blue-500" />
            Transaction Executed
          </h3>
          <p className="text-sm text-neutral-800">
            <strong>Digest:</strong>{' '}
            <a 
              href={`https://suiscan.xyz/${network}/tx/${executeResult.digest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {executeResult.digest}
            </a>
          </p>
          <p className="text-sm text-neutral-800 mt-1">
            <strong>Status:</strong> {executeResult.effects?.status.status}
          </p>
        </div>
      )}

      {signatureResult && (
        <div className="mt-4 p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
          <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Signature Generated Successfully
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Signature</p>
              <div className="p-2 bg-white border border-emerald-100 rounded text-xs font-mono text-neutral-800 break-all overflow-x-auto whitespace-pre-wrap">
                {signatureResult.signature}
              </div>
            </div>
            {signatureResult.bytes && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Transaction Bytes</p>
                <div className="p-2 bg-white border border-emerald-100 rounded text-xs font-mono text-neutral-800 break-all overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {signatureResult.bytes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
