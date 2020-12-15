const axios = require('axios');
const setupCache = require('axios-cache-adapter').setupCache;

var Service, Characteristic;

const DEF_MIN_LUX = 0,
      DEF_MAX_LUX = 65535;

const DISPLAY_USAGE_SENSORS = 0;

const PLUGIN_NAME   = 'homebridge-solaredge-inverter';
const ACCESSORY_NAME = 'SolarEdge Inverter';

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory(PLUGIN_NAME, ACCESSORY_NAME, SolarEdgeInverter);
}

/**
 * Setup Cache For Axios to prevent additional requests
 */
const cache = setupCache({
  maxAge: 5 * 1000 //in ms
})

const api = axios.create({
  adapter: cache.adapter
})

function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

/**
 * Main API request with site overview data
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 */
const getInverterData = async(siteID, apiKey) => {
	try {
	    return await api.get('https://monitoringapi.solaredge.com/site/'+siteID+'/overview?api_key='+apiKey)
	} catch (error) {
	    console.error(error)
	}
}

/**
 * Gets and returns the accessory's value in the correct format.
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 * @param (log) access to the homebridge logfile
 * @return {bool} the value for the accessory
 */
const getAccessoryValue = async (siteID, apiKey, log, cachedInverterData, cachedTimestamp, interval, debug) => {

	if(cachedInverterData) {

//		log.info('Last update time', cachedTimestamp.toString());
//		log.info('Last update timestamp', cachedTimestamp);
		const currentTime = new Date();

//		log.info('Current time', currentTime.toString());
//		log.info('Current timestamp', currentTime);

//		log.info('Delta of timestamps is:', currentTime - cachedTimestamp);
		if((currentTime - cachedTimestamp) >= interval) {

			if (debug) {
				log.info('Calling API');
			}
			// To Do: Need to handle if no connection
			const inverterData = await getInverterData(siteID, apiKey)

			if(inverterData) {
				if (debug) {
					log.info('Data from API', inverterData.data.overview);
				}
				if(inverterData.data.overview) {
					const newTimestamp = new Date();
					return [inverterData.data.overview, inverterData, newTimestamp];
				}
				else {
					return null
				}
			} else {
				return null
			}
		} else {
			if (debug) {
				log.info('Returning cached Inverter Data.');
			}
			return [cachedInverterData.data.overview, cachedInverterData, cachedTimestamp];
		}

	} else {
		if (debug) {
			log.info('Calling API');
		}
		// To Do: Need to handle if no connection
		const inverterData = await getInverterData(siteID, apiKey)

		if(inverterData) {
			if (debug) {
				log.info('Data from API', inverterData.data.overview);
			}
			if(inverterData.data.overview) {
				const newTimestamp = new Date();
				return [inverterData.data.overview, inverterData, newTimestamp];
			}
			else {
				return null
			}
		} else {
			return null
		}
	}

}

/**
 * API request with power flow data
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 */
const getPowerFlowData = async(siteID, apiKey) => {
	try {
	    return await api.get('https://monitoringapi.solaredge.com/site/'+siteID+'/currentPowerFlow?api_key='+apiKey)
	} catch (error) {
	    console.error(error)
	}
}

/**
 * Gets and returns the battery's charge value in the correct format.
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 * @param (log) access to the homebridge logfile
 * @return {bool} the value for the accessory
 */
const getBatteryValues = async (siteID, apiKey, log, cachedFlowData, cachedTimestamp, interval, debug) => {

	if(cachedFlowData) {

		const currentTime = new Date();
		if((currentTime - cachedTimestamp) >= interval) {

			if (debug) {
				log.info('Calling Flow API');
			}
			// To Do: Need to handle if no connection
			const powerFlowData = await getPowerFlowData(siteID, apiKey)

			if(powerFlowData) {
				if (debug) {
					log.info('Data from Power Flow API', powerFlowData.data.siteCurrentPowerFlow);
				}
				if(powerFlowData.data.siteCurrentPowerFlow) {
					const newTimestamp = new Date();
					return [powerFlowData.data.siteCurrentPowerFlow, powerFlowData, newTimestamp];
				}
				else {
					return null
				}
			} else {
				return null
			}
		} else {
			if (debug) {
				log.info('Returning cached Power Flow Data.');
			}
			return [cachedFlowData.data.siteCurrentPowerFlow, cachedFlowData, cachedTimestamp];
		}

	} else {
		if (debug) {
			log.info('Calling API');
		}
	// To Do: Need to handle if no connection
		const powerFlowData = await getPowerFlowData(siteID, apiKey)

		if(powerFlowData) {
			if (debug) {
				log.info('Data from Power Flow API', powerFlowData.data.siteCurrentPowerFlow);
			}
			if(powerFlowData.data.siteCurrentPowerFlow) {
				const newTimestamp = new Date();
				return [powerFlowData.data.siteCurrentPowerFlow, powerFlowData, newTimestamp];
			}
			else {
				return null
			}
		}	else {
			return null
		}
	}
}

class SolarEdgeInverter {
	constructor(log, config) {
		this.log = log
		this.config = config
		this.display = this.config.display || {current:true};

		if(this.display.current) {
			this.currentPower = new Service.LightSensor("Current Power","Current Power")
		}

		if(this.display.last_day) {
			this.lastDayPower = new Service.LightSensor("Current Day", "Current Day")
		}

		if(this.display.last_month) {
			this.lastMonth = new Service.LightSensor("Last Month", "Last Month")
		}

		if(this.display.last_year) {
			this.lastYear = new Service.LightSensor("Last Year", "Last Year")
		}

		if(this.display.life_time) {
			this.lifeTime = new Service.LightSensor("Life Time", "Life Time")
		}

		if(this.display.battery) {
			this.battery = new Service.BatteryService("Battery Level", "Battery Level")
		}

		this.name = config["name"];
		this.manufacturer = config["manufacturer"] || "SolarEdge";
		this.model = config["model"] || "Inverter";
		this.serial = config["serial"] || "solaredge-inverter-1";
		this.site_id = config["site_id"];
		this.api_key = config["api_key"];
		this.update_interval = (config["update_interval"] || 15) * 60 * 1000;
		this.debug = config["debug"] || false;
		this.minLux = config["min_lux"] || DEF_MIN_LUX;
		this.maxLux = config["max_lux"] || DEF_MAX_LUX;
		this.inverterData =  null;
		this.inverterTimestamp = null;
		this.powerFlowData = null;
		this.powerTimestamp = null;
	}

	getServices () {
		const informationService = new Service.AccessoryInformation()
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serial)

		const services = [informationService]

		if(this.display.current) {
			this.currentPower.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			.on('get', this.getCurrentPowerHandler.bind(this))
			services.push(this.currentPower);
		}

		if(this.display.last_day) {
			this.lastDayPower.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			.on('get', this.getLastDayHandler.bind(this))
			services.push(this.lastDayPower);
		}

		if(this.display.last_month) {
			this.lastMonth.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			.on('get', this.getLastMonthHandler.bind(this))
			services.push(this.lastMonth);
		}

		if(this.display.last_year) {
			this.lastYear.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			.on('get', this.getLastYearHandler.bind(this))
			services.push(this.lastYear);
		}

		if(this.display.life_time) {
			this.lifeTime.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			.on('get', this.getLifeTimeHandler.bind(this))
			services.push(this.lifeTime);
		}

		if(this.display.battery) {
			this.battery.getCharacteristic(Characteristic.BatteryLevel)
				.on('get', this.getBatteryLevelCharacteristic.bind(this));
			this.battery.getCharacteristic(Characteristic.ChargingState)
				.on('get', this.getChargingStateCharacteristic.bind(this));
			this.battery.getCharacteristic(Characteristic.StatusLowBattery)
				.on('get', this.getLowBatteryCharacteristic.bind(this));
						services.push(this.battery);
		}

		return services
	}

	async getCurrentPowerHandler (callback) {
		const [result, cachedInverterData, newTimestamp] = await getAccessoryValue(this.site_id, this.api_key, this.log, this.inverterData, this.inverterTimestamp, this.update_interval, this.debug);
		this.inverterData = cachedInverterData;
		this.inverterTimestamp = newTimestamp;
		if (result) {
			if(parseFloat(result.currentPower.power) > 0) {
				const power = Math.abs(Math.round(((result.currentPower.power / 1000) + Number.EPSILON) *10) /10)
				callback(null, power);
			}
			else {
				callback(null, 0);
			}
		}
		else {
			callback(null, 0);
		}
	}

	async getLastDayHandler (callback) {
		const [result, cachedInverterData, newTimestamp] = await getAccessoryValue(this.site_id, this.api_key, this.log, this.inverterData, this.inverterTimestamp, this.update_interval, this.debug);
		this.inverterData = cachedInverterData;
		this.inverterTimestamp = newTimestamp;

		if (result) {
			const energy = Math.abs(Math.round(result.lastDayData.energy / 1000) + Number.EPSILON)
			callback(null, energy);
		}
		else {
			callback(null, 0);
		}
	}

	async getLastMonthHandler (callback) {
		const [result, cachedInverterData, newTimestamp] = await getAccessoryValue(this.site_id, this.api_key, this.log, this.inverterData, this.inverterTimestamp, this.update_interval, this.debug);
		this.inverterData = cachedInverterData;
		this.inverterTimestamp = newTimestamp;

		if (result) {
			const energy = Math.abs(Math.round(result.lastMonthData.energy / 1000) + Number.EPSILON)
			callback(null, energy);
		}
		else {
			callback(null, 0);
		}
	}

	async getLastYearHandler (callback) {
		const [result, cachedInverterData, newTimestamp] = await getAccessoryValue(this.site_id, this.api_key, this.log, this.inverterData, this.inverterTimestamp, this.update_interval, this.debug);
		this.inverterData = cachedInverterData;
		this.inverterTimestamp = newTimestamp;

		if (result) {
			const energy = Math.abs(Math.round(result.lastYearData.energy / 1000) + Number.EPSILON)
			callback(null, energy);
		}
		else {
			callback(null, 0);
		}
	}

	async getLifeTimeHandler (callback) {
		const [result, cachedInverterData, newTimestamp] = await getAccessoryValue(this.site_id, this.api_key, this.log, this.inverterData, this.inverterTimestamp, this.update_interval, this.debug);
		this.inverterData = cachedInverterData;
		this.inverterTimestamp = newTimestamp;

		if (result) {
			const energy = Math.abs(Math.round(result.lifeTimeData.energy / 1000) + Number.EPSILON)
			callback(null, energy);
		}
		else {
			callback(null, 0);
		}
	}

	async getBatteryLevelCharacteristic (callback) {
		const [result, cachedFlowData, newTimestamp] = await getBatteryValues(this.site_id, this.api_key, this.log, this.powerFlowData, this.powerFlowTimestamp, this.update_interval, this.debug);
		this.powerFlowData = cachedFlowData;
		this.powerFlowTimestamp = newTimestamp;

		if (!isEmptyObject(result)) {
			const chargeLevel = result.STORAGE.chargeLevel
			callback(null, chargeLevel);
		}
		else {
			callback(null, 0);
		}
	}

	async getChargingStateCharacteristic (callback) {
		const [result, cachedFlowData, newTimestamp] = await getBatteryValues(this.site_id, this.api_key, this.log, this.powerFlowData, this.powerFlowTimestamp, this.update_interval, this.debug);
		this.powerFlowData = cachedFlowData;
		this.powerFlowTimestamp = newTimestamp;

		if (!isEmptyObject(result)) {
			if (result.STORAGE.status == "Idle") {
				callback(null, 0);
			}
			else {
				result.connections.forEach(element => {
					if (element.to == "STORAGE"){
	//    		inProgress
						callback(null, 1)
					}
					else {
						callback(null, 0);
					}
				})
			}
		}
		else {
//    notChargeable
			callback(null, 2);
		}
	}

	async getLowBatteryCharacteristic (callback) {
		const [result, cachedFlowData, newTimestamp] = await getBatteryValues(this.site_id, this.api_key, this.log, this.powerFlowData, this.powerFlowTimestamp, this.update_interval, this.debug);
		this.powerFlowData = cachedFlowData;
		this.powerFlowTimestamp = newTimestamp;

		if (!isEmptyObject(result)) {
			const lowBattery = result.STORAGE.critical
			callback(null, lowBattery);
		}
		else {
			callback(null, false);
		}
	}
}
