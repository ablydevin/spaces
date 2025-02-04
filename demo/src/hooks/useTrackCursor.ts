import { useContext, RefObject, useEffect } from 'react';
import { SpacesContext } from '../components';

export const CURSOR_MOVE = 'move';
export const CURSOR_ENTER = 'enter';
export const CURSOR_LEAVE = 'leave';

export const useTrackCursor = (containerRef: RefObject<HTMLDivElement>, selfConnectionId?: string) => {
  const space = useContext(SpacesContext);

  useEffect(() => {
    if (!containerRef.current || !space) return;

    const { current: cursorContainer } = containerRef;

    const cursorHandlers = {
      enter: (event: MouseEvent) => {
        if (!selfConnectionId) return;
        const { top, left } = cursorContainer.getBoundingClientRect();
        space.cursors.set({
          position: { x: event.clientX - left, y: event.clientY - top },
          data: { state: CURSOR_ENTER },
        });
      },
      move: (event: MouseEvent) => {
        if (!selfConnectionId) return;
        const { top, left } = cursorContainer.getBoundingClientRect();
        space.cursors.set({
          position: { x: event.clientX - left, y: event.clientY - top },
          data: { state: CURSOR_MOVE },
        });
      },
      leave: (event: MouseEvent) => {
        if (!selfConnectionId) return;
        const { top, left } = cursorContainer.getBoundingClientRect();
        space.cursors.set({
          position: { x: event.clientX - left, y: event.clientY - top },
          data: { state: CURSOR_LEAVE },
        });
      },
    };

    cursorContainer.addEventListener('mouseenter', cursorHandlers.enter);
    cursorContainer.addEventListener('mousemove', cursorHandlers.move);
    cursorContainer.addEventListener('mouseleave', cursorHandlers.leave);

    return () => {
      space.cursors.unsubscribe();
      cursorContainer.removeEventListener('mouseenter', cursorHandlers.enter);
      cursorContainer.removeEventListener('mousemove', cursorHandlers.move);
      cursorContainer.removeEventListener('mouseleave', cursorHandlers.leave);
    };
  }, [space, containerRef, selfConnectionId]);
};
