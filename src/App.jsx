import React, { useState } from 'react';
import {
  Sprout,
  Thermometer,
  Droplets,
  Sun,
  Wifi,
  WifiOff,
  Settings,
  Power,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
} from 'lucide-react';
import { useSmartAgriMqtt } from './hooks/useSmartAgriMqtt';
import { SensorCard } from './components/SensorCard';
import { SensorChart } from './components/SensorChart';
import { MqttSettingsModal } from './components/MqttSettingsModal';

export default function App() {
  const {
    config,
    setConfig,
    connectionStatus,
    connectionError,
    connectMqtt,
    disconnectMqtt,
    lastMessageAt,
    rawLogs,
    sensors,
    history,
    thresholds,
    setThresholds,
    pumpOn,
    pumpPending,
    togglePump,
    autoIrrigation,
    toggleAutoIrrigation,
    alerts,
    clearAlerts,
  } = useSmartAgriMqtt();

  const [mqttModalOpen, setMqttModalOpen] = useState(false);

  const tempStatus =
    sensors.temperature === null
      ? 'idle'
      : sensors.temperature > thresholds.temperatureMax || sensors.temperature < 10
      ? 'warning'
      : 'normal';

  const soilStatus =
    sensors.soilMoisture === null
      ? 'idle'
      : sensors.soilMoisture < thresholds.soilMoistureMin
      ? 'critical'
      : sensors.soilMoisture < thresholds.soilMoistureMin + 8
      ? 'warning'
      : 'normal';

  const lightStatus =
    sensors.luminosity === null
      ? 'idle'
      : sensors.luminosity < thresholds.luminosityMin
      ? 'warning'
      : 'normal';

  const statusPill = () => {
    if (connectionStatus === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
          <Wifi className="h-3.5 w-3.5" />
          MQTT Connecté
        </span>
      );
    }
    if (connectionStatus === 'connecting') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
          <Wifi className="h-3.5 w-3.5 animate-pulse" />
          Connexion...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-300">
        <WifiOff className="h-3.5 w-3.5" />
        Déconnecté
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#06130e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-emerald-900/70 bg-[#06130e]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/15 text-emerald-300">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                AgriSense IoT
              </h1>
              <p className="text-xs text-emerald-200/60">
                Supervision Serre &amp; Irrigation Intelligente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {statusPill()}

            {lastMessageAt && (
              <span className="hidden text-xs text-emerald-200/60 md:inline">
                MàJ : <span className="font-mono text-white">{lastMessageAt}</span>
              </span>
            )}

            {connectionStatus === 'connected' || connectionStatus === 'connecting' ? (
              <button
                type="button"
                onClick={disconnectMqtt}
                className="rounded-xl border border-rose-500/35 bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/25 cursor-pointer"
              >
                Déconnecter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connectMqtt()}
                className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                Connecter MQTT
              </button>
            )}

            <button
              type="button"
              onClick={() => setMqttModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/70 bg-[#0b1f17] px-3 py-2 text-xs font-medium text-white hover:bg-emerald-900/40 cursor-pointer"
            >
              <Settings className="h-4 w-4 text-emerald-300" />
              <span className="hidden sm:inline">Config MQTT</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* MQTT error banner */}
        {connectionError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <span>Erreur MQTT : {connectionError}</span>
            <button
              type="button"
              onClick={() => setMqttModalOpen(true)}
              className="rounded-lg bg-rose-500/20 px-3 py-1 font-medium text-white hover:bg-rose-500/30 cursor-pointer"
            >
              Vérifier la config
            </button>
          </div>
        )}

        {/* 3 Sensor Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SensorCard
            title="Température de l'air"
            sensorModel="DHT22"
            value={sensors.temperature !== null ? sensors.temperature.toFixed(1) : null}
            unit="°C"
            icon={Thermometer}
            min={0}
            max={50}
            status={tempStatus}
            accentClass="bg-orange-500/15 text-orange-300"
            barClass="bg-orange-400"
            subtitle={`Max : ${thresholds.temperatureMax}°C`}
          />
          <SensorCard
            title="Humidité du sol"
            sensorModel="Capteur Sol"
            value={sensors.soilMoisture !== null ? sensors.soilMoisture.toFixed(1) : null}
            unit="%"
            icon={Droplets}
            min={0}
            max={100}
            status={soilStatus}
            accentClass="bg-emerald-500/15 text-emerald-300"
            barClass={
              soilStatus === 'critical'
                ? 'bg-rose-500'
                : soilStatus === 'warning'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }
            subtitle={`Seuil min : ${thresholds.soilMoistureMin}%`}
          />
          <SensorCard
            title="Luminosité"
            sensorModel="LDR / BH1750"
            value={sensors.luminosity !== null ? Math.round(sensors.luminosity) : null}
            unit="lux"
            icon={Sun}
            min={0}
            max={1200}
            status={lightStatus}
            accentClass="bg-amber-500/15 text-amber-300"
            barClass="bg-amber-400"
            subtitle={`Min : ${thresholds.luminosityMin} lux`}
          />
        </section>

        {/* Chart + Controls & Alerts */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SensorChart history={history} />
          </div>

          <div className="space-y-6">
            {/* Irrigation Control */}
            <div className="rounded-2xl border border-emerald-900/70 bg-[#0b1f17] p-5 shadow-lg shadow-black/25">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Contrôle d&apos;irrigation
                  </h2>
                  <p className="text-xs text-emerald-200/60">
                    Pompe à eau &amp; seuils automatiques
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    pumpOn
                      ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : 'border border-emerald-800/70 bg-[#06130e] text-emerald-200/60'
                  }`}
                >
                  {pumpOn ? 'POMPE ON' : 'POMPE OFF'}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <button
                  type="button"
                  onClick={() => togglePump()}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    pumpOn
                      ? 'border border-rose-500/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  <Power className="h-4 w-4" />
                  {pumpOn ? 'Arrêter la pompe' : "Démarrer l'irrigation"}
                </button>

                {pumpPending && (
                  <p className="text-center text-[11px] text-amber-300">
                    Commande envoyée, en attente de confirmation de l&apos;ESP32...
                  </p>
                )}

                <div className="flex items-center justify-between rounded-xl border border-emerald-900/70 bg-[#06130e]/70 px-3.5 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-white">
                      Mode automatique
                    </p>
                    <p className="text-[11px] text-emerald-200/60">
                      Active la pompe si sol &lt; {thresholds.soilMoistureMin}%
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAutoIrrigation()}
                    className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                      autoIrrigation ? 'bg-emerald-500' : 'bg-emerald-950 border border-emerald-800'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        autoIrrigation ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-emerald-100">Seuil humidité du sol</span>
                    <span className="font-mono font-semibold text-emerald-300">
                      {thresholds.soilMoistureMin}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={65}
                    value={thresholds.soilMoistureMin}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        soilMoistureMin: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Alerts Log */}
            <div className="rounded-2xl border border-emerald-900/70 bg-[#0b1f17] p-5 shadow-lg shadow-black/25">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  Alertes ({alerts.length})
                </h2>
                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAlerts}
                    className="inline-flex items-center gap-1 text-xs text-emerald-200/60 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Effacer
                  </button>
                )}
              </div>

              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-900/70 bg-[#06130e]/70 p-3 text-xs text-emerald-200/70">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    Aucune alerte. Tous les paramètres sont normaux.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                        alert.level === 'critical'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                          : alert.level === 'warning'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      }`}
                    >
                      {alert.level === 'info' ? (
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{alert.title}</span>
                          <span className="font-mono text-[10px] opacity-75">
                            {alert.time}
                          </span>
                        </div>
                        <p className="mt-0.5 opacity-90">{alert.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MqttSettingsModal
        isOpen={mqttModalOpen}
        onClose={() => setMqttModalOpen(false)}
        config={config}
        setConfig={setConfig}
        onConnect={(cfg) => {
          connectMqtt(cfg);
        }}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
        rawLogs={rawLogs}
      />
    </div>
  );
}
