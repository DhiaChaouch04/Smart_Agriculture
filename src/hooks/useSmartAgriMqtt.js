import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';

const MAX_HISTORY = 30;

const DEFAULT_CONFIG = {
  brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
  baseTopic: 'smartagri',
  clientId: `agrisense_${Math.random().toString(16).slice(2, 8)}`,
  username: '',
  password: '',
};

const DEFAULT_THRESHOLDS = {
  soilMoistureMin: 35,
  temperatureMax: 32,
  luminosityMin: 200,
};

function formatTime(date = new Date()) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function useSmartAgriMqtt() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [connectionError, setConnectionError] = useState('');
  const [lastMessageAt, setLastMessageAt] = useState(null);
  const [rawLogs, setRawLogs] = useState([]);

  const [sensors, setSensors] = useState({
    temperature: null,
    soilMoisture: null,
    luminosity: null,
  });

  const [history, setHistory] = useState([]);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [pumpOn, setPumpOn] = useState(false);
  const [pumpPending, setPumpPending] = useState(false);
  const [autoIrrigation, setAutoIrrigation] = useState(true);
  const [alerts, setAlerts] = useState([]);

  const clientRef = useRef(null);
  const lastAlertRef = useRef({});
  const lastAutoCmdRef = useRef(0);
  const sensorsRef = useRef(sensors);
  const thresholdsRef = useRef(thresholds);
  const pumpOnRef = useRef(pumpOn);
  const autoIrrigationRef = useRef(autoIrrigation);

  useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  useEffect(() => {
    thresholdsRef.current = thresholds;
  }, [thresholds]);

  useEffect(() => {
    pumpOnRef.current = pumpOn;
  }, [pumpOn]);

  useEffect(() => {
    autoIrrigationRef.current = autoIrrigation;
  }, [autoIrrigation]);

  const pushAlert = useCallback((key, level, title, message) => {
    const now = Date.now();
    if (lastAlertRef.current[key] && now - lastAlertRef.current[key] < 15000) {
      return;
    }
    lastAlertRef.current[key] = now;
    setAlerts((prev) => [
      {
        id: `${key}_${now}`,
        level,
        title,
        message,
        time: formatTime(new Date(now)),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const publishCommand = useCallback(
    (subTopic, payload) => {
      if (clientRef.current && clientRef.current.connected) {
        const topic = `${config.baseTopic.replace(/\/$/, '')}/${subTopic}`;
        clientRef.current.publish(topic, String(payload), { qos: 0 });
        setRawLogs((prev) => [
          {
            id: `${Date.now()}_${Math.random()}`,
            dir: 'TX',
            topic,
            payload: String(payload),
            time: formatTime(),
          },
          ...prev.slice(0, 29),
        ]);
      }
    },
    [config.baseTopic]
  );

  const applySensorReading = useCallback(
    (nextSensors) => {
      setSensors(nextSensors);

      if (
        nextSensors.temperature !== null ||
        nextSensors.soilMoisture !== null ||
        nextSensors.luminosity !== null
      ) {
        setHistory((prev) => [
          ...prev.slice(-(MAX_HISTORY - 1)),
          {
            time: formatTime(),
            temperature:
              nextSensors.temperature !== null
                ? +Number(nextSensors.temperature).toFixed(1)
                : null,
            soilMoisture:
              nextSensors.soilMoisture !== null
                ? +Number(nextSensors.soilMoisture).toFixed(1)
                : null,
            luminosity:
              nextSensors.luminosity !== null
                ? Math.round(Number(nextSensors.luminosity))
                : null,
          },
        ]);
      }

      const th = thresholdsRef.current;
      const isAuto = autoIrrigationRef.current;
      const isPumpOn = pumpOnRef.current;

      if (nextSensors.soilMoisture !== null) {
        if (nextSensors.soilMoisture < th.soilMoistureMin) {
          pushAlert(
            'soil_low',
            'critical',
            'Sol trop sec',
            `Humidité du sol à ${nextSensors.soilMoisture.toFixed(1)}% (seuil min : ${th.soilMoistureMin}%).`
          );
          const now = Date.now();
          if (isAuto && !isPumpOn && now - lastAutoCmdRef.current > 10000) {
            lastAutoCmdRef.current = now;
            setPumpPending(true);
            publishCommand('actuators/pump', 'ON');
            pushAlert(
              'pump_auto_on',
              'info',
              'Commande irrigation envoyée',
              'Ordre ON envoyé à la pompe (en attente de confirmation ESP32).'
            );
          }
        } else if (
          isAuto &&
          isPumpOn &&
          nextSensors.soilMoisture >= th.soilMoistureMin + 12
        ) {
          const now = Date.now();
          if (now - lastAutoCmdRef.current > 10000) {
            lastAutoCmdRef.current = now;
            setPumpPending(true);
            publishCommand('actuators/pump', 'OFF');
            pushAlert(
              'pump_auto_off',
              'info',
              'Commande arrêt envoyée',
              `Humidité du sol rétablie à ${nextSensors.soilMoisture.toFixed(1)}%. Ordre OFF envoyé.`
            );
          }
        }
      }

      if (
        nextSensors.temperature !== null &&
        nextSensors.temperature > th.temperatureMax
      ) {
        pushAlert(
          'temp_high',
          'warning',
          'Température élevée (DHT22)',
          `Température à ${nextSensors.temperature.toFixed(1)}°C (seuil max : ${th.temperatureMax}°C).`
        );
      }

      if (
        nextSensors.luminosity !== null &&
        nextSensors.luminosity < th.luminosityMin
      ) {
        pushAlert(
          'light_low',
          'warning',
          'Faible luminosité',
          `Éclairement mesuré à ${Math.round(nextSensors.luminosity)} lux (seuil min : ${th.luminosityMin} lux).`
        );
      }
    },
    [pushAlert, publishCommand]
  );

  const togglePump = useCallback(
    (nextState) => {
      if (!clientRef.current || !clientRef.current.connected) {
        pushAlert(
          'mqtt_not_connected',
          'warning',
          'Broker MQTT déconnecté',
          'Connectez le broker MQTT pour commander la pompe.'
        );
        return;
      }
      const target = typeof nextState === 'boolean' ? nextState : !pumpOn;
      setPumpPending(true);
      publishCommand('actuators/pump', target ? 'ON' : 'OFF');
    },
    [pumpOn, publishCommand, pushAlert]
  );

  const toggleAutoIrrigation = useCallback(
    (nextState) => {
      const target = typeof nextState === 'boolean' ? nextState : !autoIrrigation;
      setAutoIrrigation(target);
      publishCommand('actuators/mode', target ? 'AUTO' : 'MANUAL');
    },
    [autoIrrigation, publishCommand]
  );

  const disconnectMqtt = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    setConnectionStatus('disconnected');
    setPumpOn(false);
    setPumpPending(false);
  }, []);

  const connectMqtt = useCallback(
    (overrideConfig) => {
      const activeConfig = overrideConfig || config;
      disconnectMqtt();
      setConnectionStatus('connecting');
      setConnectionError('');

      try {
        const options = {
          clientId:
            activeConfig.clientId ||
            `agrisense_${Math.random().toString(16).slice(2, 8)}`,
          clean: true,
          reconnectPeriod: 4000,
          connectTimeout: 8000,
        };
        if (activeConfig.username) options.username = activeConfig.username;
        if (activeConfig.password) options.password = activeConfig.password;

        const client = mqtt.connect(activeConfig.brokerUrl, options);
        clientRef.current = client;

        client.on('connect', () => {
          setConnectionStatus('connected');
          setConnectionError('');
          const base = activeConfig.baseTopic.replace(/\/$/, '');
          client.subscribe(`${base}/#`, (err) => {
            if (err) {
              setConnectionError(`Erreur d'abonnement : ${err.message}`);
            }
          });
        });

        client.on('message', (topic, messageBuffer) => {
          const payloadStr = messageBuffer.toString().trim();
          const nowTime = formatTime();
          setLastMessageAt(nowTime);
          setRawLogs((prev) => [
            {
              id: `${Date.now()}_${Math.random()}`,
              dir: 'RX',
              topic,
              payload: payloadStr,
              time: nowTime,
            },
            ...prev.slice(0, 29),
          ]);

          const updated = { ...sensorsRef.current };
          let changed = false;

          if (payloadStr.startsWith('{')) {
            try {
              const data = JSON.parse(payloadStr);
              if (typeof data.temperature === 'number') {
                updated.temperature = data.temperature;
                changed = true;
              }
              if (
                typeof data.soilMoisture === 'number' ||
                typeof data.soil === 'number'
              ) {
                updated.soilMoisture = data.soilMoisture ?? data.soil;
                changed = true;
              }
              if (
                typeof data.luminosity === 'number' ||
                typeof data.lux === 'number' ||
                typeof data.light === 'number'
              ) {
                updated.luminosity =
                  data.luminosity ?? data.lux ?? data.light;
                changed = true;
              }
              const rawPump = data.pump ?? data.pumpOn ?? data.pumpState;
              if (rawPump !== undefined) {
                const isOn =
                  rawPump === true ||
                  rawPump === 1 ||
                  String(rawPump).trim().toUpperCase() === 'ON' ||
                  String(rawPump).trim().toLowerCase() === 'true';
                setPumpOn(isOn);
                setPumpPending(false);
              }
            } catch {
              // Ignore malformed JSON
            }
          } else {
            const lowerTopic = topic.toLowerCase();
            if (
              lowerTopic.includes('pump') &&
              (lowerTopic.includes('status') ||
                lowerTopic.includes('state') ||
                lowerTopic.includes('etat'))
            ) {
              const upper = payloadStr.toUpperCase();
              if (upper === 'ON' || upper === '1' || upper === 'TRUE') {
                setPumpOn(true);
                setPumpPending(false);
              } else if (upper === 'OFF' || upper === '0' || upper === 'FALSE') {
                setPumpOn(false);
                setPumpPending(false);
              }
            } else {
              const num = parseFloat(payloadStr);
              if (!Number.isNaN(num)) {
                if (lowerTopic.includes('temp')) {
                  updated.temperature = num;
                  changed = true;
                } else if (
                  lowerTopic.includes('soil') ||
                  lowerTopic.includes('sol')
                ) {
                  updated.soilMoisture = num;
                  changed = true;
                } else if (
                  lowerTopic.includes('lum') ||
                  lowerTopic.includes('lux') ||
                  lowerTopic.includes('light')
                ) {
                  updated.luminosity = num;
                  changed = true;
                }
              }
            }
          }

          if (changed) {
            applySensorReading(updated);
          }
        });

        client.on('error', (err) => {
          setConnectionStatus('error');
          setConnectionError(
            err?.message || 'Erreur de connexion au broker WebSocket'
          );
        });

        client.on('close', () => {
          setConnectionStatus((prev) =>
            prev === 'error' ? 'error' : 'disconnected'
          );
        });
      } catch (err) {
        setConnectionStatus('error');
        setConnectionError(err?.message || 'URL WebSocket invalide');
      }
    },
    [config, disconnectMqtt, applySensorReading]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
      }
    };
  }, []);

  return {
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
    clearAlerts: () => setAlerts([]),
  };
}
