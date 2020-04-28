const axios = require('axios');
const setupCache = require('axios-cache-adapter').setupCache;

var Service, Characteristic;

const DEF_MIN_LUX = 0,
      DEF_MAX_LUX = 10000;

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

/**
 * Main API request with site overview data
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 */
const getInverterData = async(siteID, apiKey) => {
	try {
//	    return await api.get('https://'+inverterIp+'/solar_api/v1/GetPowerFlowRealtimeData.fcgi')
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
const getAccessoryValue = async (siteID, apiKey, log) => {

	// To Do: Need to handle if no connection
	const inverterData = await getInverterData(siteID, apiKey)

	if(inverterData) {
		log.info('Data from API', inverterData.data.overview.currentPower.power);
		if (inverterData.data.overview.currentPower.power == null) {
			return 0
		} else {
			// Return positive value
			return Math.abs(Math.round(inverterData.data.overview.currentPower.power, 1))
		}
	} else {
		// No response inverterData return 0
		return 0
	}
}

class SolarEdgeInverter {
    constructor(log, config) {
    	this.log = log
    	this.config = config

    	this.service = new Service.LightSensor(this.config.name)

    	this.name = config["name"];
    	this.manufacturer = config["manufacturer"] || "SolarEdge";
	    this.model = config["model"] || "Inverter";
	    this.serial = config["serial"] || "solaredge-inverter-1";
	    this.site_id = config["site_id"];
	    this.api_key = config["api_key"];
	    this.minLux = config["min_lux"] || DEF_MIN_LUX;
    	this.maxLux = config["max_lux"] || DEF_MAX_LUX;
    }

    getServices () {
    	const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
        .setCharacteristic(Characteristic.Model, this.model)
        .setCharacteristic(Characteristic.SerialNumber, this.serial)

        this.service.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
	      .on('get', this.getOnCharacteristicHandler.bind(this))

	    return [informationService, this.service]
    }

    async getOnCharacteristicHandler (callback) {
	    this.log(`calling getOnCharacteristicHandler`, await getAccessoryValue(this.site_id, this.api_key, this.log))

	    callback(null, await getAccessoryValue(this.site_id, this.api_key, this.log))
	}
}