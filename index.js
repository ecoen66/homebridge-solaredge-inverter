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
const getAccessoryValue = async(that) => {
	if (that.debug) {
		that.log.info('Calling API');
	}
	// To Do: Need to handle if no connection
	const inverterData = await getInverterData(that.siteID, that.apiKey)

	if(inverterData) {
		if (that.debug) {
			that.log.info('Data from API', inverterData.data.overview);
		}
		if(inverterData.data.overview) {
			return inverterData.data.overview;
		}
		else {
			return null
		}
	} else {
		return null
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
 */
const getBatteryValues = async (that) => {
	if (that.debug) {
		that.log.info('Calling Flow API');
	}
	// To Do: Need to handle if no connection
	const powerFlowData = await getPowerFlowData(that.siteID, that.apiKey)

	if(powerFlowData) {
		if (that.debug) {
			that.log.info('Data from Power Flow API', powerFlowData.data.siteCurrentPowerFlow);
		}
		if(powerFlowData.data.siteCurrentPowerFlow) {
			return powerFlowData.data.siteCurrentPowerFlow;
		}
		else {
			return null
		}
	} else {
		return null
	}
}

const update = async(that) => {
	if(that.currentPower || that.lastDayPower || that.lastMonth || that.lastYear || that.lifeTime) {
		const accessoryValue = await getAccessoryValue(that);
		let power = 0;
		if (accessoryValue) {
			if(that.currentPower) {
				if(parseFloat(accessoryValue.currentPower.power) > 0) {
					if(that.currentWatts) {
						power = Math.abs(Math.round((accessoryValue.currentPower.power + Number.EPSILON) *10) /10)
					} else {
						power = Math.abs(Math.round(((accessoryValue.currentPower.power / 1000) + Number.EPSILON) *10) /10)
					}
				}
				that.currentPower
					.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
					.updateValue(power)
			}
			if(that.lastDayPower) {
				power = Math.abs(Math.round(((accessoryValue.lastDayData.energy / 1000) + Number.EPSILON) *10) /10)
				that.lastDayPower
					.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
					.updateValue(power)
			}
			if(that.lastMonth) {
				power = Math.abs(Math.round(((accessoryValue.lastMonthData.energy / 1000) + Number.EPSILON) *10) /10)
				that.lastMonth
					.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
					.updateValue(power)
			}
			if(that.lastYear) {
				power = Math.abs(Math.round(((accessoryValue.lastYearData.energy / 1000) + Number.EPSILON) *10) /10)
				that.lastYear
					.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
					.updateValue(power)
			}
			if(that.lifeTime) {
				power = Math.abs(Math.round(((accessoryValue.lifeTimeData.energy / 1000) + Number.EPSILON) *10) /10)
				that.lifeTime
					.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
					.updateValue(power)
			}
		}
	}
	if(that.battery){
		const batteryValues = await getBatteryValues(that);
		let chargeLevel = 0;
		let chargingState = 2;
		let lowBattery = false;
		if (!isEmptyObject(batteryValues)) {
			chargeLevel = batteryValues.STORAGE.chargeLevel;
			lowBattery = batteryValues.STORAGE.critical;
			if (batteryValues.STORAGE.status == "Idle") {
				chargingState = 0;
			}
			else {
				batteryValues.connections.forEach(element => {
					if (element.to == "STORAGE"){
	//    		inProgress
						chargingState = 1;
					}
					else {
						chargingState = 0;
					}
				})
			}
		}
		that.battery
			.getCharacteristic(Characteristic.BatteryLevel)
				.updateValue(chargeLevel)
			.getCharacteristic(Characteristic.ChargingState)
				.updateValue(chargingState)
			.getCharacteristic(Characteristic.StatusLowBattery)
				.updateValue(lowBattery)
	}
}


class SolarEdgeInverter {
	constructor(log, config) {
		this.log = log
		this.config = config
		this.current = this.config.current;

		if(this.current) {
			this.currentPower = new Service.LightSensor("Current Power","Current Power");
			this.currentWatts = this.config.currentWatts;
		}

		if(this.config.last_day) {
			this.lastDayPower = new Service.LightSensor("Current Day", "Current Day")
		}

		if(this.config.last_month) {
			this.lastMonth = new Service.LightSensor("Last Month", "Last Month")
		}

		if(this.config.last_year) {
			this.lastYear = new Service.LightSensor("Last Year", "Last Year")
		}

		if(this.config.life_time) {
			this.lifeTime = new Service.LightSensor("Life Time", "Life Time")
		}

		if(this.config.battery) {
			this.battery = new Service.BatteryService("Battery Level", "Battery Level")
		}

		this.name = this.config.name;
		this.manufacturer = this.config.manufacturer || "SolarEdge";
		this.model = this.config.model || "Inverter";
		this.serial = this.config.serial || "solaredge-inverter-1";
		this.siteID = this.config.site_id;
		this.apiKey = this.config.api_key;
		this.update_interval = (this.config.update_interval || 15) * 60 * 1000;
		this.debug = this.config.debug || false;
		this.minLux = this.config.min_lux || DEF_MIN_LUX;
		this.maxLux = this.config.max_lux || DEF_MAX_LUX;

		if(this.currentPower || this.lastDayPower || this.lastMonth || this.lastYear || this.lifeTime || this.battery) {
			update(this);
			setInterval ( async() => {
				if(this.currentPower || this.lastDayPower || this.lastMonth || this.lastYear || this.lifeTime) {
					const accessoryValue = await getAccessoryValue(this);
					let power = 0;
					if (accessoryValue) {
						if(this.currentPower) {
							if(parseFloat(accessoryValue.currentPower.power) > 0) {
								if(this.currentWatts) {
									power = Math.abs(Math.round((accessoryValue.currentPower.power + Number.EPSILON) *10) /10)
								} else {
									power = Math.abs(Math.round(((accessoryValue.currentPower.power / 1000) + Number.EPSILON) *10) /10)
								}
							}
							this.currentPower
								.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
								.updateValue(power)
						}
						if(this.lastDayPower) {
							power = Math.abs(Math.round(((accessoryValue.lastDayData.energy / 1000) + Number.EPSILON) *10) /10)
							this.lastDayPower
								.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
								.updateValue(power)
						}
						if(this.lastMonth) {
							power = Math.abs(Math.round(((accessoryValue.lastMonthData.energy / 1000) + Number.EPSILON) *10) /10)
							this.lastMonth
								.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
								.updateValue(power)
						}
						if(this.lastYear) {
							power = Math.abs(Math.round(((accessoryValue.lastYearData.energy / 1000) + Number.EPSILON) *10) /10)
							this.lastYear
								.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
								.updateValue(power)
						}
						if(this.lifeTime) {
							power = Math.abs(Math.round(((accessoryValue.lifeTimeData.energy / 1000) + Number.EPSILON) *10) /10)
							this.lifeTime
								.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
								.updateValue(power)
						}
					}
				}
				if(this.battery){
					const batteryValues = await getBatteryValues(this);
					let chargeLevel = 0;
					let chargingState = 2;
					let lowBattery = false;
					if (!isEmptyObject(batteryValues)) {
						chargeLevel = batteryValues.STORAGE.chargeLevel;
						lowBattery = batteryValues.STORAGE.critical;
						if (batteryValues.STORAGE.status == "Idle") {
							chargingState = 0;
						}
						else {
							batteryValues.connections.forEach(element => {
								if (element.to == "STORAGE"){
				//    		inProgress
									chargingState = 1;
								}
								else {
									chargingState = 0;
								}
							})
						}
					}
					this.battery
						.getCharacteristic(Characteristic.BatteryLevel)
							.updateValue(chargeLevel)
						.getCharacteristic(Characteristic.ChargingState)
							.updateValue(chargingState)
						.getCharacteristic(Characteristic.StatusLowBattery)
							.updateValue(lowBattery)
				}
			}, this.update_interval)
		}
	}

	getServices () {
		const informationService = new Service.AccessoryInformation()
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serial)

		const services = [informationService]

		if(this.current) {
			this.currentPower.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			services.push(this.currentPower);
		}

		if(this.lastDayPower) {
			this.lastDayPower.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			services.push(this.lastDayPower);
		}

		if(this.lastMonth) {
			this.lastMonth.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			services.push(this.lastMonth);
		}

		if(this.lastYear) {
			this.lastYear.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			services.push(this.lastYear);
		}

		if(this.lifeTime) {
			this.lifeTime.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			services.push(this.lifeTime);
		}

		if(this.battery) {
			this.battery.getCharacteristic(Characteristic.BatteryLevel)
			this.battery.getCharacteristic(Characteristic.ChargingState)
			this.battery.getCharacteristic(Characteristic.StatusLowBattery)
						services.push(this.battery);
		}

		return services
	}
}
