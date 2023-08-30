import type { Types } from 'ably';

import type { EventKey, EventListener, EventMap } from './EventEmitter.js';
import type { ProfileData, Lock } from '../types.js';

export type PresenceMember = {
  data: {
    profileUpdate: {
      id: string | null;
      current: ProfileData;
    };
    locationUpdate: {
      id: string | null;
      previous: unknown;
      current: unknown;
    };
  };
  extras?: {
    locks: Lock[];
  };
} & Omit<Types.PresenceMessage, 'data'>;

export type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object ? Subset<K[attr]> : K[attr];
};

export interface Provider<ProviderEventMap extends EventMap> {
  subscribe<K extends EventKey<ProviderEventMap>>(
    listenerOrEvents?: K | K[] | EventListener<ProviderEventMap[K]>,
    listener?: EventListener<ProviderEventMap[K]>,
  ): void;

  unsubscribe<K extends EventKey<ProviderEventMap>>(
    listenerOrEvents?: K | K[] | EventListener<ProviderEventMap[K]>,
    listener?: EventListener<ProviderEventMap[K]>,
  ): void;
}

export type RealtimeMessage = Omit<Types.Message, 'connectionId'> & {
  connectionId: string;
};
