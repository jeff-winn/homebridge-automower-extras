import * as model from '../../../model';

import { 
    CommonServiceDataItem, DeviceDataItem, DeviceLink, GardenaClient, LocationLink, LocationResponse, MowerActivity, MowerError, 
    MowerServiceDataItem, ServiceState, ItemType, RFLinkState 
} from '../../../clients/gardena/gardenaClient';
import { PlatformLogger } from '../../../diagnostics/platformLogger';
import { NotAuthorizedError } from '../../../errors/notAuthorizedError';
import { AccessTokenManager } from '../accessTokenManager';
import { GetMowersService } from '../discoveryService';

/**
 * Describes the model information parsed from the model data.
 */
interface ModelInformation {
    manufacturer: string;
    model: string;
}

export class GardenaGetMowersService implements GetMowersService {
    public constructor(private tokenManager: AccessTokenManager, private client: GardenaClient, private log: PlatformLogger) { }
    
    public async getMowers(): Promise<model.Mower[]> {
        this.notifyPreviewFeatureIsBeingUsed();
        
        try {
            const token = await this.tokenManager.getCurrentToken();

            const refs = await this.getLocationsForAccount(token);
            for (const ref of refs) {
                const location = await this.client.getLocation(ref.id, token);
                if (location !== undefined) {
                    return this.findMowersAtLocation(location);
                }
            }

            return [];
        } catch (e) {
            if (e instanceof NotAuthorizedError) {
                this.tokenManager.flagAsInvalid();
            }

            throw (e);
        }
    }

    protected async getLocationsForAccount(token: model.AccessToken): Promise<LocationLink[]> {
        const locations = await this.client.getLocations(token);
        if (locations === undefined || locations.data === undefined || locations.data.length === 0) {
            return [];
        }

        const result: LocationLink[] = [];

        for (const location of locations.data) {
            result.push(location);
        }

        return result;
    }

    protected findMowersAtLocation(location: LocationResponse): model.Mower[] {
        const result: model.Mower[] = [];
        const devices = this.findDevicesAtLocation(location);

        for (const device of devices) {
            const services = this.findDeviceServicesAtLocation(device, location);

            // Check if the device has the mower service available.
            const mower = services.filter(o => o.type === ItemType.MOWER).shift() as MowerServiceDataItem | undefined;
            if (mower !== undefined) {
                this.log.debug('GARDENA_MOWER_DETECTED', mower.id);
                
                const common = services.filter(o => o.type === ItemType.COMMON).shift() as CommonServiceDataItem | undefined; // The common service is always required.
                if (common === undefined) {
                    this.log.warn('GARDENA_MISSING_REQUIRED_COMMON_SERVICE', mower.id);
                } else {
                    const mowerInstance = this.createMower(mower, common, location.data);
                    result.push(mowerInstance);    
                }
            }
        }

        return result;
    }

    protected findDevicesAtLocation(location: LocationResponse): DeviceDataItem[] {
        const result: DeviceDataItem[] = [];

        const refs = location.data.relationships.devices.data.filter(device => device.type === ItemType.DEVICE).flat();

        for (const ref of refs) {
            const device = location.included.filter(o => o.id === ref.id && o.type === ItemType.DEVICE).shift() as DeviceDataItem | undefined;
            if (device !== undefined) {
                result.push(device);
            }
        }
        
        return result;
    }
    
    protected findDeviceServicesAtLocation(device: DeviceDataItem, location: LocationResponse): DeviceLink[] {
        const result: DeviceLink[] = [];

        for (const ref of device.relationships.services.data) {
            const service = location.included.filter(o => o.id === ref.id && o.type === ref.type).shift();
            if (service !== undefined) {
                result.push(service);
            }
        }

        return result;
    }

    protected createMower(mower: MowerServiceDataItem, common: CommonServiceDataItem, location: LocationLink): model.Mower {
        const modelInformation = this.parseModelInformation(common.attributes.modelType.value);

        return {
            id: mower.id,
            attributes: {
                location: {
                    id: location.id
                },
                battery: {
                    level: common.attributes.batteryLevel.value,                    
                },
                connection: {
                    connected: common.attributes.rfLinkState.value === RFLinkState.ONLINE
                },
                metadata: {
                    manufacturer: modelInformation.manufacturer,
                    model: modelInformation.model,
                    name: common.attributes.name.value,
                    serialNumber: common.attributes.serial.value
                },
                mower: {
                    activity: this.convertMowerActivity(mower),
                    state: this.convertMowerState(mower),
                    enabled: this.isMowerEnabled(mower)
                }                
            }
        };
    }

    protected isMowerEnabled(mower: MowerServiceDataItem): boolean {
        if (mower.attributes.lastErrorCode.value === MowerError.OFF_DISABLED) {
            return false;
        }

        return mower.attributes.activity.value !== MowerActivity.PARKED_PARK_SELECTED;
    }

    protected convertMowerActivity(mower: MowerServiceDataItem): model.Activity {
        switch (mower.attributes.activity.value) {
            case MowerActivity.OK_CHARGING:
                return model.Activity.CHARGING;

            case MowerActivity.OK_CUTTING:
            case MowerActivity.OK_CUTTING_TIMER_OVERRIDDEN:
            case MowerActivity.PAUSED:
                return model.Activity.MOWING;

            case MowerActivity.OK_LEAVING:
                return model.Activity.LEAVING_HOME;

            case MowerActivity.OK_SEARCHING:
                return model.Activity.GOING_HOME;

            case MowerActivity.PARKED_AUTOTIMER:
            case MowerActivity.PARKED_PARK_SELECTED:
            case MowerActivity.PARKED_TIMER:
                return model.Activity.PARKED;

            case MowerActivity.NONE:
                return model.Activity.UNKNOWN;

            default:
                this.log.debug('VALUE_NOT_SUPPORTED', mower.attributes.activity.value);
                return model.Activity.UNKNOWN;
        }
    }

    protected convertMowerState(mower: MowerServiceDataItem): model.State {
        if (mower.attributes.activity.value === MowerActivity.PAUSED) {
            return model.State.PAUSED;
        }

        switch (mower.attributes.lastErrorCode.value) {
            case MowerError.OFF_DISABLED:
            case MowerError.OFF_HATCH_CLOSED:
            case MowerError.OFF_HATCH_OPEN:
                return model.State.OFF;
            
            case MowerError.ALARM_MOWER_LIFTED:
            case MowerError.LIFTED:
            case MowerError.TEMPORARILY_LIFTED:
                return model.State.TAMPERED;

            case MowerError.TRAPPED:
            case MowerError.UPSIDE_DOWN:
                return model.State.FAULTED;

            default:                
                switch (mower.attributes.state.value) {
                    case ServiceState.OK:
                        return model.State.READY;
        
                    case ServiceState.WARNING:
                    case ServiceState.ERROR:
                        return model.State.FAULTED;
        
                    case ServiceState.UNAVAILABLE:
                        return model.State.UNKNOWN;

                    default:
                        return model.State.UNKNOWN;
                }
        }
    }
    
    private parseModelInformation(value: string): ModelInformation {
        const firstIndex = value.indexOf(' ');

        return {
            manufacturer: value.substring(0, firstIndex),
            model: value.substring(firstIndex + 1)
        };
    }

    /**
     * Notifies the user that the preview feature is currently being used, to ensure they're aware.
     */
    protected notifyPreviewFeatureIsBeingUsed(): void {
        this.log.warn('GARDENA_PREVIEW_IN_USE');
    }
}