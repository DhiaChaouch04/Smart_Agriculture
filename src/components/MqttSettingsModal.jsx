import React, { useState } from 'react';
import { X, Copy, Check, Radio, Terminal } from 'lucide-react';

export function MqttSettingsModal({
  isOpen,
  onClose,
  config,
  setConfig,
  onConnect,
  connectionStatus,
  connectionError,
  rawLogs,
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const base = (localConfig.baseTopic || 'smartagri').replace(/\/$/, '');
  const samplePayload = JSON.stringify(
    {
      temperature: 25.4,
      soilMoisture: 44.5,
      luminosity: 720,
      pump: false,
    },
    null,
    2
  );

  const handleSaveAndConnect = (e) => {
    e.preventDefault();
    setConfig(localConfig);
    onConnect(localConfig);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(samplePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-800/70 bg-[#0b1f17] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-900/70 pb-4">
          <div className="flex items-center gap-2.5">
            <Radio className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">
              Configuration Broker MQTT (WebSockets)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-200/70 hover:bg-emerald-900/50 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveAndConnect} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-emerald-100">
                URL du Broker WebSocket (ws:// ou wss://)
              </label>
              <input
                type="text"
                value={localConfig.brokerUrl}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, brokerUrl: e.target.value })
                }
                placeholder="ws://localhost:9001 ou wss://broker.hivemq.com:8884/mqtt"
                className="w-full rounded-xl border border-emerald-800/70 bg-[#06130e] px-3.5 py-2 text-sm text-white placeholder-emerald-200/40 focus:border-emerald-400 focus:outline-none"
                required
              />
              <p className="mt-1 text-[11px] text-emerald-200/60">
                Exemples : <code className="text-emerald-300">ws://192.168.1.X:9001</code> (Mosquitto local) ou{' '}
                <code className="text-emerald-300">wss://broker.hivemq.com:8884/mqtt</code>
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-emerald-100">
                Topic de base (abonnement à {base}/#)
              </label>
              <input
                type="text"
                value={localConfig.baseTopic}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, baseTopic: e.target.value })
                }
                placeholder="smartagri"
                className="w-full rounded-xl border border-emerald-800/70 bg-[#06130e] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-emerald-100">
                Client ID
              </label>
              <input
                type="text"
                value={localConfig.clientId}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, clientId: e.target.value })
                }
                className="w-full rounded-xl border border-emerald-800/70 bg-[#06130e] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-emerald-100">
                Utilisateur (optionnel)
              </label>
              <input
                type="text"
                value={localConfig.username}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, username: e.target.value })
                }
                placeholder="Laisser vide si public"
                className="w-full rounded-xl border border-emerald-800/70 bg-[#06130e] px-3.5 py-2 text-sm text-white placeholder-emerald-200/40 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-emerald-100">
                Mot de passe (optionnel)
              </label>
              <input
                type="password"
                value={localConfig.password}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, password: e.target.value })
                }
                placeholder="••••••••"
                className="w-full rounded-xl border border-emerald-800/70 bg-[#06130e] px-3.5 py-2 text-sm text-white placeholder-emerald-200/40 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {connectionError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
              {connectionError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-emerald-800/70 px-4 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-900/50 cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              {connectionStatus === 'connecting'
                ? 'Connexion...'
                : 'Enregistrer & Connecter'}
            </button>
          </div>
        </form>

        {/* ESP32 Payload Reference */}
        <div className="mt-6 rounded-xl border border-emerald-900/70 bg-[#06130e]/90 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">
              Format attendu depuis l&apos;ESP32 / Arduino
            </span>
            <button
              type="button"
              onClick={copyPayload}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-800/70 px-2.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-900/50 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copier JSON
                </>
              )}
            </button>
          </div>
          <p className="mb-2 text-[11px] text-emerald-200/70">
            Publiez un JSON sur <code className="text-emerald-300">{base}/sensors</code> (ou des valeurs simples sur{' '}
            <code className="text-white">{base}/temperature</code>,{' '}
            <code className="text-white">{base}/soil</code>,{' '}
            <code className="text-white">{base}/luminosity</code>,{' '}
            <code className="text-white">{base}/actuators/pump/status</code>) :
          </p>
          <pre className="overflow-x-auto rounded-lg bg-[#0b1f17] p-3 text-[11px] font-mono text-emerald-300">
            {samplePayload}
          </pre>
        </div>

        {/* Live MQTT Console */}
        <div className="mt-4 rounded-xl border border-emerald-900/70 bg-[#06130e]/90 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white">
            <Terminal className="h-4 w-4 text-emerald-400" />
            Journal MQTT en direct ({rawLogs.length})
          </div>
          <div className="max-h-36 space-y-1 overflow-y-auto font-mono text-[11px]">
            {rawLogs.length === 0 ? (
              <p className="text-emerald-200/50">Aucun message MQTT échangé pour le moment.</p>
            ) : (
              rawLogs.map((log) => (
                <div key={log.id} className="flex gap-2 text-emerald-100">
                  <span className="text-emerald-200/50">{log.time}</span>
                  <span
                    className={
                      log.dir === 'TX' ? 'text-amber-400' : 'text-emerald-400'
                    }
                  >
                    [{log.dir}]
                  </span>
                  <span className="text-sky-300">{log.topic}</span>
                  <span className="truncate text-emerald-200/70">{log.payload}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
