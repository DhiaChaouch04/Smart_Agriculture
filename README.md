# AgriSense IoT — Dashboard Smart Agriculture

Dashboard de supervision en temps réel pour un prototype IoT de serre / agriculture intelligente (projet universitaire).

## Fonctionnalités

- **Capteurs temps réel via MQTT (WebSockets)** :
  - Température de l'air (`DHT22`, °C)
  - Humidité du sol (`Capteur Sol`, %)
  - Luminosité (`LDR / BH1750`, lux)
- **Graphiques historiques en direct** (`Recharts`)
- **Contrôle d'irrigation** :
  - Commande manuelle (`ON` / `OFF`) et mode automatique basé sur le seuil d'humidité du sol
  - Affichage de l'état réel de la pompe confirmé par l'ESP32
- **Alertes & Journal MQTT** : seuils configurables et console RX/TX en direct

## Installation

```bash
npm install
npm run dev
```

## Topics MQTT

- **Souscription** : `smartagri/#`
- **Données capteurs (ESP32 → Dashboard)** sur `smartagri/sensors` :
  ```json
  {
    "temperature": 25.4,
    "soilMoisture": 44.5,
    "luminosity": 720,
    "pump": false
  }
  ```
- **Commandes pompe (Dashboard → ESP32)** : `smartagri/actuators/pump` (`ON` / `OFF`) et `smartagri/actuators/mode` (`AUTO` / `MANUAL`).
- **Confirmation état pompe (ESP32 → Dashboard)** : champ `"pump"` dans le JSON ou topic `smartagri/actuators/pump/status` (`ON` / `OFF`).
