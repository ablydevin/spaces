import { describe, it, TestContext } from 'vitest';
import Spaces from '../../src/Spaces.js';
import { Realtime } from 'ably';
import { createSandboxAblyAPIKey } from '../lib/ably_sandbox.js';
import { nanoid } from 'nanoid';
import { CursorUpdate, SpaceMember } from '../../src/types.js';
import { setTimeout } from 'node:timers/promises';

// this is so that we can have a shared key
const getSandboxKey = (() => {
  const sandboxKeyPromise = createSandboxAblyAPIKey({ logger: null });

  return async () => {
    return await sandboxKeyPromise;
  };
})();

async function assertTakesAtMost(milliseconds: number, context: TestContext, operation: () => Promise<void>) {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  context.expect(endTime).to.be.within(startTime, startTime + milliseconds);
}

describe.concurrent(
  'integration tests',
  () => {
    // TODO why is this test sometimes hanging

    it('space members', async (context) => {
      // TODO
      const sandboxKey = await getSandboxKey();

      const performerClientId = nanoid();
      const performerRealtime = new Realtime.Promise({
        environment: 'sandbox',
        key: sandboxKey,
        clientId: performerClientId,
      });
      const performerSpaces = new Spaces(performerRealtime);

      const observerClientId = nanoid();
      const observerRealtime = new Realtime.Promise({
        environment: 'sandbox',
        key: sandboxKey,
        clientId: observerClientId,
      });
      const observerSpaces = new Spaces(observerRealtime);

      const spaceName = nanoid();

      const performerSpace = await performerSpaces.get(spaceName);
      const observerSpace = await observerSpaces.get(spaceName, { offlineTimeout: 5 });

      // enter a space

      // TODO check event on members

      // TODO sort out this typing
      // TODO what happened to `once` returning a Promise?
      const enterUpdateEventDataPromise = new Promise<{ members: SpaceMember[] }>((resolve) => {
        observerSpace.once('update', resolve);
      });
      const membersEnterEventDataPromise = new Promise<SpaceMember>((resolve) => {
        observerSpace.members.once('enter', resolve);
      });

      await performerSpace.enter();

      const [enterUpdateEventData, membersEnterEventData] = await Promise.all([
        enterUpdateEventDataPromise,
        membersEnterEventDataPromise,
      ]);

      context.expect(enterUpdateEventData.members).toHaveLength(1);

      for (const member of [enterUpdateEventData.members[0], membersEnterEventData]) {
        context.expect(member.clientId).toEqual(performerClientId);
        context.expect(member.profileData).to.be.null;
        context.expect(member.isConnected).to.be.true;
      }

      // update profile data

      const updateProfileUpdateEventDataPromise = new Promise<{ members: SpaceMember[] }>((resolve) => {
        observerSpace.once('update', resolve);
      });
      const membersUpdateProfileEventPromise = new Promise<SpaceMember>((resolve) => {
        observerSpace.members.once('updateProfile', resolve);
      });

      await performerSpace.updateProfileData({ name: 'Luna Gomes' });

      const [updateProfileUpdateEventData, membersUpdateProfileEventData] = await Promise.all([
        updateProfileUpdateEventDataPromise,
        membersUpdateProfileEventPromise,
      ]);

      context.expect(updateProfileUpdateEventData.members).toHaveLength(1);

      for (const member of [updateProfileUpdateEventData.members[0], membersUpdateProfileEventData]) {
        context.expect(member.clientId).toEqual(performerClientId);
        context.expect(member.profileData).toEqual({ name: 'Luna Gomes' });
        context.expect(member.isConnected).to.be.true;
      }

      // leave space

      const leaveUpdateEventDataPromise = new Promise<{ members: SpaceMember[] }>((resolve) => {
        observerSpace.once('update', resolve);
      });
      const membersLeaveEventDataPromise = new Promise<SpaceMember>((resolve) => {
        observerSpace.members.once('leave', resolve);
      });

      // TODO what's the point of the profile data here? and what's leave vs remove
      await performerSpace.leave({ name: 'Luna Gomes', age: 25 });

      const [leaveUpdateEventData, membersLeaveEventData] = await Promise.all([
        leaveUpdateEventDataPromise,
        membersLeaveEventDataPromise,
      ]);

      context.expect(leaveUpdateEventData.members).toHaveLength(1);

      for (const member of [leaveUpdateEventData.members[0], membersLeaveEventData]) {
        context.expect(member.clientId).toEqual(performerClientId);
        context.expect(member.profileData).toEqual({ name: 'Luna Gomes', age: 25 });
        context.expect(member.isConnected).to.be.false;
      }

      // remove member
      const removeUpdateEventDataPromise = new Promise<{ members: SpaceMember[] }>((resolve) => {
        observerSpace.once('update', resolve);
      });
      const membersRemoveEventDataPromise = new Promise<SpaceMember>((resolve) => {
        observerSpace.members.once('remove', resolve);
      });

      // TODO why
      await setTimeout(6 /* TODO tie to offlineTimeout */);

      const [removeUpdateEventData, membersRemoveEventData] = await Promise.all([
        removeUpdateEventDataPromise,
        membersRemoveEventDataPromise,
      ]);

      context.expect(removeUpdateEventData.members).to.be.empty;

      context.expect(membersRemoveEventData.clientId).toEqual(performerClientId);
      context.expect(membersRemoveEventData.profileData).toEqual({ name: 'Luna Gomes', age: 25 });
      context.expect(membersRemoveEventData.isConnected).to.be.false;
    });

    it('cursors', async (context) => {
      const sandboxKey = await getSandboxKey();

      const performerClientId = nanoid();
      const performerRealtime = new Realtime.Promise({
        environment: 'sandbox',
        key: sandboxKey,
        clientId: performerClientId,
      });
      const performerSpaces = new Spaces(performerRealtime);

      const observerClientId = nanoid();
      const observerRealtime = new Realtime.Promise({
        environment: 'sandbox',
        key: sandboxKey,
        clientId: observerClientId,
      });
      const observerSpaces = new Spaces(observerRealtime);

      const spaceName = nanoid();

      const outboundBatchInterval = 50;
      const performerSpace = await performerSpaces.get(spaceName, {
        cursors: { outboundBatchInterval /* TODO why */ },
      });
      const observerSpace = await observerSpaces.get(spaceName);

      // needed in order to be able to send cursor updates
      await performerSpace.enter();

      // TODO the idea here is to get performerSpace.cursors listening for presence updates (to know that it should send events), and it seems the only way to do that is by sending an event
      await performerSpace.cursors.set({ position: { x: 0, y: 0 } });

      // be usre it publishes that first set so that it doesn't interfere later (TODO is that how it works; will this be dropped?)
      await setTimeout(2 * outboundBatchInterval);

      // TODO `on` didn't work, also how do you know when the channel is ready to recieve updates, also how do you know when presence enter has completed?
      // TODO resolve with data
      const cursorUpdatesPromise = new Promise<CursorUpdate[]>((resolve) => {
        const observedCursorEventsData: CursorUpdate[] = [];
        observerSpace.cursors.subscribe('update', (data) => {
          observedCursorEventsData.push(data);
          if (observedCursorEventsData.length === 4) {
            resolve(observedCursorEventsData);
          }
        });
      });

      await setTimeout(1000 /* long enough for presence enter to complete? */);

      // the data is copied from demo code
      // TODO explain - idea is that everything be done within a single batch
      assertTakesAtMost(outboundBatchInterval, context, async () => {
        await performerSpace.cursors.set({ position: { x: 0, y: 15 }, data: { state: 'move' } });
        await performerSpace.cursors.set({ position: { x: 30, y: 20 }, data: { state: 'move' } });
        await performerSpace.cursors.set({ position: { x: 40, y: 30 }, data: { state: 'move' } });
        await performerSpace.cursors.set({ position: { x: 50, y: 0 }, data: { state: 'leave' } });
      });

      const observedCursorEventsData = await cursorUpdatesPromise;

      context.expect(observedCursorEventsData).toHaveLength(4);

      context
        .expect(observedCursorEventsData[0])
        .toMatchObject({ clientId: performerClientId, position: { x: 0, y: 15 }, data: { state: 'move' } });
      context
        .expect(observedCursorEventsData[1])
        .toMatchObject({ clientId: performerClientId, position: { x: 30, y: 20 }, data: { state: 'move' } });
      context
        .expect(observedCursorEventsData[2])
        .toMatchObject({ clientId: performerClientId, position: { x: 40, y: 30 }, data: { state: 'move' } });
      context
        .expect(observedCursorEventsData[3])
        .toMatchObject({ clientId: performerClientId, position: { x: 50, y: 0 }, data: { state: 'leave' } });
    });

    // TODO locks?
    // TODO location?
  },
  { timeout: 60_000 },
);
