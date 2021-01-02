# Changelog


## 0.2.3 (2021-01-02)

#### Changes

- Fixed bug at end of day, was not updating current power when current power is 0 (Issue #15).
- Fixed a README.md typo.

## 0.2.2 (2020-12-31)

#### Changes

- Entire re-write to a push vs. pull update model, minimizing SolarEdge API calls (Issue #11).
- Updated math rounding.
- Updated README.md.
- Good-bye 2020!

## 0.2.1 (2020-12-29)

#### Changes

- Bug fixed.  Was not displaying anything but current power.

## 0.2.0 (2020-12-23)

#### Changes

- New config.schema.json -- REQUIRES changes to the config to remove display section
- Added option to display Current Power in Watts vs. kW

## 0.1.7 (2020-12-14)

#### Changes

- Fixed debug logging

## 0.1.6 (2020-12-14)

#### Changes

- Fixed some fat-fingering :P

## 0.1.5 (2020-12-14)

#### Changes

- Modified config.schema.json
- Added update_interval to allow the use of cached data vs. API polling
- Added a debug option for logging (the default is silent)

## 0.1.4 (2020-11-09)

#### Changes

- Modified config.schema.json
- Added backwards compatibility if a user neglected to add *display* config section

## 0.1.3 (2020-11-03)

#### Changes

- Fixed a typo in config.schema.json

## 0.1.2 (2020-11-03)

#### Changes

- Added an optional BatteryLevel display

## 0.1.1 (2020-11-01)

#### Changes

- Modified the math to work in absolute values (my homebridge instance needed this)

## 0.1.0 (2020-11-01)

#### Changes contributed by tomrush

- Added additional LightSensor's for:
        Current Day
        Last Month
        Last Year
        Life Time
- Converted units to kW and limited at 2 decimal places.
- Updated Config schema to allow for new settings.
- Updated documentation
- Added Git ignore file

## 0.0.4 (2020-04-28)

#### Changes

- Cleaned up comments in index.js.
- Updated Changelog & Readme.

## 0.0.3 (2020-04-28)

#### Changes

- Added npm publish workflow.
- Updated packages.json.

## 0.0.2 (2020-04-27)

#### Changes

- Bug fix.
- Added information and sample config in Readme.
- Added shout-out in Readme.

## 0.0.1 (2020-04-27)

#### Initial Commit
