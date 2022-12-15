# Homebridge Automower Platform
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

[![build](https://github.com/jeff-winn/homebridge-automower-platform/actions/workflows/build.yml/badge.svg)](https://github.com/jeff-winn/homebridge-automower-platform/actions/workflows/build.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=homebridge-automower-platform&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=homebridge-automower-platform) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=homebridge-automower-platform&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=homebridge-automower-platform) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=homebridge-automower-platform&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=homebridge-automower-platform) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=homebridge-automower-platform&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=homebridge-automower-platform)

[Homebridge](https://homebridge.io) plugin for controlling [Husqvarna Automower](https://www.husqvarna.com/us/robotic-lawn-mowers/) as [Apple HomeKit](https://www.apple.com/ios/home/) accessories using the [Husqvarna Group](https://developer.husqvarnagroup.cloud) cloud services.

Be advised, because this plug-in uses cloud services, service disruptions or outages are possible as it relies solely on the aforementioned cloud services to manage the communication with your mowers(s).

#### Hardware Requirements
The following hardware requirements are necessary for the proper operation of the plug-in. If you are unsure whether your mower is supported by the plug-in, you can find the compatibility matrix [HERE](https://jeff-winn.github.io/homebridge-automower-platform/extras/compatibility-matrix).

- The Automower *must* have an Automower Connect module installed, Bluetooth only models will require an upgrade. For more information, please contact your local Husqvarna Automower dealer.

#### Known Issues
- Starting with iOS 16, Apple has changed their naming scheme within HomeKit such that all services for an accessory use the accessory name. If all the switches and sensors are named after your mower, and are using 1.4.0 or later of the plug-in, removing the mower using the instructions found [HERE](https://jeff-winn.github.io/homebridge-automower-platform/extras/removing-mower) should correct the issue.

#### Supported Capabilities
- A switch to control whether each mower (based on configuration - see documentation):
  - *should* mow the property.
  - or *has* the on-board schedule enabled or disabled.
- A pause switch to control whether each mower:
  - *should* pause while mowing on the property, and resume once the switch is turned off.
- A motion sensor to indicate whether each mower:
  - *is* moving about the property.
  - *has* been tampered with (requires the Husqvarna app to troubleshoot) and needs assistance. **
  - *has* encountered a fault (requires the Husqvarna app to troubleshoot) and needs assistance. **
- A contact sensor to indicate when each mower:
  - *is* going to the charge station, by indicating open contact state.
  - *has* arrived home, or resumed operation, by indicating closed contact state.
- A contact sensor to indicate when each mower:
  - *is* leaving the charge station, by indicating open contact state.
  - *has* left home, or returned home, by indicating closed contact state.

** These features are not directly supported within the Apple HomeKit app and will require a 3rd party application (such as Controller for HomeKit) to use for any automations.

#### Additional Capabilities:
- Streams events from Husqvarna rather than polling for changes. This allows you to run automations without having to worry about the timing of when a change is noticed, it should be within a few seconds.
- Does not cause logout of Husqvarna mobile application.
- Multiple languages may be supported in logs (need help with translations).

For help installing and configuring the plugin, please see the documentation found at:
https://jeff-winn.github.io/homebridge-automower-platform

#### Disclaimer
This plug-in is in no way affiliated with Husqvarna, the Husqvarna Group, or any of its subsidiaries or partners. Any trademarks used here-in are property of Husqvarna and/or the Husqvarna Group.
