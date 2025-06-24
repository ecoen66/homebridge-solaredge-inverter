# homebridge-solaredge-inverter
A [SolarEdge](https://www.solaredge.com) Inverter plugin for
[Homebridge](https://github.com/nfarina/homebridge).  This creates a a set of Light Sensors in homekit,
 where the LUX reading is actually the  power generation in KiloWatts.  There is also an option to display battery level if applicable.

This code is heavily based on the work of Stog's [homebridge-fronius-inverter](https://github.com/Stog/homebridge-fronius-inverter) accessory.

# API Key Access
You will need access to generate an API key, or have one generated from you.
I have found that the easiest way to do this is to open a ticket with SolarEdge's support helpdesk located at [SolarEdge Helpdesk](https://www.solaredge.com/us/service/support/cases).

Further, I also opened a chat dialogue with them after I created the ticket. The live support person was able to give my account access to the api key, and to regenerate the api key as well, as documented on their [API Documentation](https://www.solaredge.com/sites/default/files/se_monitoring_api.pdf).
Make sure to let the service representative on the chat that you specifically need access to get an API key!

# Installation
Run these commands:

    % sudo npm install -g homebridge
    % sudo npm install -g homebridge-solaredge-inverter


NB: If you install homebridge like this:

    sudo npm install -g --unsafe-perm homebridge

Then all subsequent installations must be like this:

    sudo npm install -g --unsafe-perm homebridge-solaredge-inverter

# Configuration

Example accessory config (needs to be added to the homebridge config.json):
 ...

		"accessories": [
			{
				"name": "SolarEdge Inverter",
				"manufacturer": "SolarEdge",
				"model": "SE10000H-US000BNU4",
				"serial": "myserialno",
				"site_id": "mysiteid",
				"api_key": "longapikey",
				"update_interval": 15,
				"accessory": "SolarEdge Inverter",
				"current": true,
				"currentWatts": true,
				"last_day": false,
				"last_month": false,
				"last_year": false,
				"life_time": true.
				"battery": false.
				"debug": false
			}
		]
 ...

### Config Explanation:

Field           						| Description
----------------------------|------------
**accessory**   						| (required) Must always be "SolarEdge Inverter".
**name**										| (required) The name you want to use for for the power level widget.
**site_id**  								| (required) The Site ID for your SolarEdge installation.
**api_key**		  						| (required) The API Key for the administration of your SolarEdge site.
**manufacturer**						| (optional) This shows up in the homekit accessory Characteristics.
**model**										| (optional) This shows up in the homekit accessory Characteristics.
**serial**									| (optional) This shows up in the homekit accessory Characteristics.
**update_interval**					| (optional) The frequency to poll the SolarEdge API in minutes (defaults to 15).
**debug**										| (optional) Enables additional logging.
**current**									| (required) Display current power (kW).
**currentWatts**						| (optional) Display current power in W vs. kW.
**last_day**								| (required) Display Last Day power (kW).
**last_month**							| (required) Display Last Month power (kW).
**last_year**								| (required) Display Last Year power (kW).
**life_time**								| (required) Display Life Time power (kW).
**battery**									| (required) Display Battery Level (%).

