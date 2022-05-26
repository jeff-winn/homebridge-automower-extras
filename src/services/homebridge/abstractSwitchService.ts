import { API, Characteristic, CharacteristicEventTypes, 
    CharacteristicSetCallback, CharacteristicValue, PlatformAccessory, Service 
} from 'homebridge';

import { AutomowerContext } from '../../automowerAccessory';
import { AbstractAccessoryService } from './abstractAccessoryService';

/**
 * An abstract class which supports an accessory switch.
 */
export abstract class AbstractSwitchService extends AbstractAccessoryService {
    private switchService?: Service;
    protected on?: Characteristic;

    public constructor(protected name: string, accessory: PlatformAccessory<AutomowerContext>, api: API) {
        super(accessory, api);
    }
    
    public getUnderlyingService(): Service | undefined {
        return this.switchService;
    }

    public init(prepend: boolean): void {
        this.switchService = this.accessory.getServiceById(this.Service.Switch, this.name);
        if (this.switchService === undefined) {
            let displayName = this.name;
            if (prepend) {
                displayName = `${this.accessory.displayName} ${this.name}`;
            }

            this.switchService = this.createService(displayName);
            this.accessory.addService(this.switchService);
        }

        this.on = this.switchService.getCharacteristic(this.Characteristic.On)
            .on(CharacteristicEventTypes.SET, this.onSetCallback.bind(this));
    }

    protected onSetCallback(value: CharacteristicValue, callback: CharacteristicSetCallback): Promise<void> {
        const actualValue = value as boolean;
        return this.onSet(actualValue, callback);
    }

    protected abstract onSet(on: boolean, callback: CharacteristicSetCallback): Promise<void>;

    protected createService(displayName: string): Service {
        return new this.Service.Switch(displayName, this.name);
    }
}