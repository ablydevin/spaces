import { vi } from 'vitest';
import { Types } from 'ably/promises';
import { createPresenceMessage } from './fakes.js';

/**
 * Mocks `presence`’s `subscribe` function (the overload which accepts one or more actions and a listener) to immediately call the listener with a PresenceMessage of:
 *
 * - action `ENTER` (arbitrarily-chosen)
 * - connectionId '1' (to match that used by the ably-js auto-mock)
 * - clientId 'MOCK_CLIENT_ID' (to match that used by the ably-js auto-mock)
 */
export function mockSubscribeForSpaceEnter(presence: Types.RealtimePresencePromise) {
  const subscribeImplementation: (typeof presence)['subscribe'] = async (
    _,
    listener?: (presenceMessage: Types.PresenceMessage) => void,
  ) => {
    listener!(createPresenceMessage('enter', { clientId: 'MOCK_CLIENT_ID', connectionId: '1' }));
  };
  vi.spyOn(presence, 'subscribe').mockImplementation(subscribeImplementation);
}
