import { Mock } from 'moq.ts';

import { GardenaEventStreamServiceFactoryImpl } from '../../src/factories/gardenaEventStreamServiceFactory';
import { PlatformContainer } from '../../src/primitives/platformContainer';
import { PlatformLogger } from '../../src/diagnostics/platformLogger';
import { GardenaClientImpl } from '../../src/clients/gardena/gardenaClient';
import { AccessTokenManagerImpl } from '../../src/services/husqvarna/accessTokenManager';
import { TimerImpl } from '../../src/primitives/timer';
import { GardenaLocationEventStreamService } from '../../src/services/husqvarna/gardena/gardenaEventStreamService';

describe('GardenaEventStreamServiceFactoryImpl', () => {
    let container: Mock<PlatformContainer>;
    let log: Mock<PlatformLogger>;

    let target: GardenaEventStreamServiceFactoryImpl;

    beforeEach(() => {
        container = new Mock<PlatformContainer>();
        log = new Mock<PlatformLogger>();

        target = new GardenaEventStreamServiceFactoryImpl(container.object(), log.object());
    });

    it('should create a new service instance for the location specified', () => {
        const client = new Mock<GardenaClientImpl>();
        const tokenManager = new Mock<AccessTokenManagerImpl>();
        const timer = new Mock<TimerImpl>();

        container.setup(o => o.resolve(GardenaClientImpl)).returns(client.object());
        container.setup(o => o.resolve(AccessTokenManagerImpl)).returns(tokenManager.object());
        container.setup(o => o.resolve(TimerImpl)).returns(timer.object());

        const result = target.create('12345');

        expect(result).toBeInstanceOf(GardenaLocationEventStreamService);
    });
});