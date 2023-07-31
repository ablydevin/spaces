import * as Ably from 'ably';
import { Types } from 'ably';

import type { SpaceOptions, Subset } from './Space.js';
import Space from './Space.js';

class Spaces {
  private spaces: Record<string, Space>;
  private channel: Types.RealtimeChannelPromise;
  ably: Types.RealtimePromise;

  readonly version = '0.0.11';

  constructor(optionsOrAbly: Types.RealtimePromise | Types.ClientOptions | string) {
    this.spaces = {};
    if (optionsOrAbly['options']) {
      this.ably = optionsOrAbly as Types.RealtimePromise;
      this.addAgent(this.ably['options'], false);
    } else {
      let options: Types.ClientOptions = typeof optionsOrAbly === 'string' ? { key: optionsOrAbly } : optionsOrAbly;
      this.addAgent(options, true);
      this.ably = new Ably.Realtime.Promise(options);
    }
    this.ably.time();
  }

  private addAgent(options: any, isDefault: boolean) {
    const agent = { 'ably-spaces': this.version, [isDefault ? 'space-default-client' : 'space-custom-client']: true };

    options.agents = { ...(options.agents ?? options.agents), ...agent };
  }

  async get(name: string, options?: Subset<SpaceOptions>): Promise<Space> {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Spaces must have a non-empty name');
    }

    if (this.spaces[name]) return this.spaces[name];

    if (this.ably.connection.state !== 'connected') {
      await this.ably.connection.once('connected');
    }

    const space = new Space(name, this.ably, options);
    this.spaces[name] = space;

    return space;
  }
}

export default Spaces;
