# API
## Installation
### Clone this repository
```
git clone https://github.com/VaporMontey/API-projectwork-2019.git

```
### Additional installation instructions
Prerequisiti:

- Vedi prerequisiti *Sensors* (https://github.com/VaporMontey/Sensor-projectwork-2019/blob/redis/README.md)
- Pacchetto di influx db che contiene *Influx* e *Chronograf*
- *Node.js*

## Configuration
Premessa: tutte le impostazioni vanno cambiate nel file config.txt

1. Settare l'indirizzo IP  del database per *InfluxDB* 
2. Settare nome del database
3. Username (default *admin*)
4. Password (default *admin*)

## Operating
1. Avviare le API tramite *Node.js*
2. Avviare i demoni di *InfluxDB* 
  - *Influxd.exe* tramite cmd
  - *Chronograf.exe* tramite cmd
3. Connettersi tramite browser all'indirizzo [localhost:8888] per poter visualizzare il database

## Troubleshooting
Browse issues: https://github.com/VaporMontey/API-projectwork-2019/issues
## Changelog
https://github.com/VaporMontey/API-projectwork-2019/releases
## Licence
Licence: None
