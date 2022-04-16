import { API, Logging } from 'homebridge';
import { container, InjectionToken } from 'tsyringe';
import { OAuthTokenManagerImpl } from './authentication/impl/oauthTokenManagerImpl';
import { AutomowerPlatformConfig } from './automowerPlatformConfig';
import { AuthenticationClientImpl } from './clients/impl/authenticationClientImpl';
import { AutomowerClientImpl } from './clients/impl/automowerClientImpl';
import { AutomowerEventStreamImpl } from './clients/impl/automowerEventStreamImpl';
import { DefaultAccessoryFactory } from './primitives/defaultAccessoryFactory';
import { GetMowersServiceImpl } from './services/automower/impl/getMowersServiceImpl';
import { DiscoveryServiceImpl } from './services/impl/discoveryServiceImpl';
import * as constants from './constants';

export class AutomowerPlatformContainer {
    constructor(private log: Logging, private config: AutomowerPlatformConfig, private api: API) { }

    registerEverything(): void {
        this.log.debug('Registering classes to the DI container...');

        container.registerInstance(OAuthTokenManagerImpl, new OAuthTokenManagerImpl(
            new AuthenticationClientImpl(this.config.appKey, constants.AUTHENTICATION_API_BASE_URL),
            this.config,
            this.log));

        container.register(AutomowerClientImpl, {
            useValue: new AutomowerClientImpl(
                this.config.appKey,
                constants.AUTOMOWER_CONNECT_API_BASE_URL
            )
        });

        container.register(GetMowersServiceImpl, {
            useFactory: (context) => new GetMowersServiceImpl(
                context.resolve(OAuthTokenManagerImpl),
                context.resolve(AutomowerClientImpl)
            )
        });

        container.register(DefaultAccessoryFactory, {
            useFactory: () => new DefaultAccessoryFactory(this.api)
        });

        container.register(DiscoveryServiceImpl, {
            useFactory: (context) => new DiscoveryServiceImpl(
                context.resolve(GetMowersServiceImpl),                
                this.log,
                context.resolve(DefaultAccessoryFactory))
        });

        container.register(AutomowerEventStreamImpl, {
            useFactory: () => new AutomowerEventStreamImpl(constants.AUTOMOWER_STREAM_API_BASE_URL)
        });
        
        this.log.debug('Completed DI container registrations.');
    }

    resolve<T>(token: InjectionToken<T>): T {
        return container.resolve(token);
    }
}