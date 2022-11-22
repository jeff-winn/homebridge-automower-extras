import { API, Characteristic, PlatformAccessory, Service } from 'homebridge';
import { AutomowerContext } from '../automowerAccessory';
import { Activity, Battery, MowerState, Statistics } from '../model';
import { Localization } from '../primitives/localization';
import { AbstractAccessoryService } from './homebridge/abstractAccessoryService';

/**
 * A mechanism which manages the battery state.
 */
export interface BatteryInformation {
    /**
     * Initializes the service.
     */
    init(): void;

    /**
     * Sets the battery level.
     * @param battery The battery information.
     */
    setBatteryLevel(battery: Battery): void;    

    /**
     * Sets the charging state.
     * @param state The state of the mower.
     */
    setChargingState(state: MowerState): void;

    /**
     * Sets the statistics.
     * @param statistics The statistics of the mower.
     */
    setStatistics(statistics: Statistics): void;
}

export class BatteryInformationImpl extends AbstractAccessoryService implements BatteryInformation {        
    private batteryService?: Service;
    private lowBattery?: Characteristic;
    private batteryLevel?: Characteristic;
    private chargingState?: Characteristic;
    private chargingCycles?: Characteristic;
    private chargingTime?: Characteristic;

    public constructor(private locale: Localization, accessory: PlatformAccessory<AutomowerContext>, api: API) {
        super(accessory, api);
    }

    public getUnderlyingService(): Service | undefined {
        return this.batteryService;
    }

    public init(): void {
        this.batteryService = this.accessory.getService(this.Service.Battery);
        if (this.batteryService === undefined) {
            this.batteryService = this.accessory.addService(this.Service.Battery);
        }

        this.lowBattery = this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery);
        this.batteryLevel = this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel);
        this.chargingState = this.batteryService.getCharacteristic(this.Characteristic.ChargingState);

        if (this.batteryService.testCharacteristic(this.CustomCharacteristic.ChargingCycles)) {
            this.chargingCycles = this.batteryService.getCharacteristic(this.CustomCharacteristic.ChargingCycles);
        } else {
            const characteristic = new this.CustomCharacteristic.ChargingCycles();
            characteristic.localize(this.locale);

            this.chargingCycles = this.batteryService.addCharacteristic(characteristic);
        }

        if (this.batteryService.testCharacteristic(this.CustomCharacteristic.TotalChargingTime)) {
            this.chargingTime = this.batteryService.getCharacteristic(this.CustomCharacteristic.TotalChargingTime);
        } else {
            const characteristic = new this.CustomCharacteristic.TotalChargingTime();
            characteristic.localize(this.locale);

            this.chargingTime = this.batteryService.addCharacteristic(characteristic);
        }
    }
    
    public setChargingState(state: MowerState) {  
        if (this.chargingState === undefined) {        
            throw new Error('The service has not been initialized.');
        }

        if (state.activity === Activity.CHARGING) {
            this.chargingState.updateValue(this.Characteristic.ChargingState.CHARGING);
        } else {
            this.chargingState.updateValue(this.Characteristic.ChargingState.NOT_CHARGING);
        }
    }

    public setBatteryLevel(battery: Battery): void {
        if (this.batteryLevel === undefined || this.lowBattery === undefined) {
            throw new Error('The service has not been initialized.');
        }

        this.batteryLevel.updateValue(battery.batteryPercent);          

        if (battery.batteryPercent <= 20) {
            this.lowBattery.updateValue(this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW);
        } else {
            this.lowBattery.updateValue(this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
        }
    }

    public setStatistics(statistics: Statistics): void {
        if (this.chargingCycles === undefined || this.chargingTime === undefined) {
            throw new Error('The service has not been initialized.');
        }

        this.chargingCycles.updateValue(statistics.numberOfChargingCycles);
        this.chargingTime.updateValue(statistics.totalChargingTime);
    }
}