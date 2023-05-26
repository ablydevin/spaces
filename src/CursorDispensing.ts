import { Types } from 'ably';

import Cursors, { type CursorUpdate } from './Cursors';
import type { StrictCursorsOptions } from './options/CursorsOptions';

export default class CursorDispensing {
  private buffer: Record<string, CursorUpdate[]> = {};
  private handlerRunning: boolean = false;
  private bufferHasData: boolean = false;
  private timerIds: NodeJS.Timeout[] = [];

  constructor(readonly cursors: Cursors, readonly inboundBatchInterval: StrictCursorsOptions['inboundBatchInterval']) {}

  emitFromBatch() {
    if (!this.bufferHasData) {
      this.handlerRunning = false;
      return;
    }

    this.handlerRunning = true;

    const processBuffer = () => {
      let bufferLengths: number[] = [];

      for (let connectionId in this.buffer) {
        const buffer = this.buffer[connectionId];
        const update = buffer.shift();

        bufferLengths.push(buffer.length);

        if (!update) continue;
        this.cursors.emit('cursorsUpdate', update);

        const cursor = this.cursors.cursors[update.name];
        if (!cursor) continue;
        cursor.emit('cursorUpdate', update);
      }

      if (bufferLengths.some((bufferLength) => bufferLength > 0)) {
        this.emitFromBatch();
      } else {
        this.handlerRunning = false;
        this.bufferHasData = false;
      }

      this.timerIds.shift();
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.timerIds.forEach((id) => clearTimeout(id));
      this.timerIds = [];
      processBuffer();
    } else {
      this.timerIds.push(setTimeout(processBuffer, this.inboundBatchInterval));
    }
  }

  processBatch(message: Types.Message) {
    let updatesCounter = 0;

    Object.keys(message.data).forEach((name) => {
      const updates = message.data[name] || [];

      updatesCounter += updates.length;

      updates.forEach((update) => {
        const enhancedMsg = {
          name,
          clientId: message.clientId,
          connectionId: message.connectionId,
          position: update.position,
          data: update.data,
        };

        if (this.buffer[enhancedMsg.connectionId]) {
          this.buffer[enhancedMsg.connectionId].push(enhancedMsg);
        } else {
          this.buffer[enhancedMsg.connectionId] = [enhancedMsg];
        }
      });
    });

    if (updatesCounter > 0) {
      this.bufferHasData = true;
    }

    if (!this.handlerRunning && this.bufferHasData) {
      this.emitFromBatch();
    }
  }
}
