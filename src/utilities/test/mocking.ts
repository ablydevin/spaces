import { vi } from 'vitest';
import { Types } from 'ably/promises';
import { createPresenceMessage } from './fakes.js';

/**
 * Mocks `presence`’s `subscribe` function (the overload which accepts one or more actions and a listener) to immediately call the listener with a PresenceMessage of (arbitarily-chosen) action `ENTER`.
 */
export function mockSubscribeForSpaceEnter(presence: Types.RealtimePresencePromise) {
  const subscribeImplementation: (typeof presence)['subscribe'] = async (
    _,
    listener?: (presenceMessage: Types.PresenceMessage) => void,
  ) => {
    listener!(createPresenceMessage('enter'));
  };
  vi.spyOn(presence, 'subscribe').mockImplementation(subscribeImplementation);
}
