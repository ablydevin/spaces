import * as React from 'react'
import Spaces, {type Space} from '@ably-labs/spaces';
import { Realtime } from 'ably';
import { nanoid } from 'nanoid';

import { getSpaceNameFromUrl } from '../utils/url';
import { getRandomName } from '../utils/fake-names';


const clientId = nanoid();

const ably = new Realtime.Promise({
  authUrl: `/api/ably-token-request?clientId=${clientId}`,
  clientId,
});

const spaces = new Spaces(ably);


const SpacesContext = React.createContext<Space | undefined>(undefined);

const SpaceContextProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [space, setSpace] = React.useState<Space | undefined>(undefined);

  React.useEffect(() => {
    let ignore: boolean = false;

    const init = async () => {
      if (ignore) {
        return;
      }

      const spaceInstance = await spaces.get(getSpaceNameFromUrl(), {
        offlineTimeout: 10_000,
      });
      
      if (spaceInstance && !space) {
        setSpace(spaceInstance)
      }
    }

    init();

    return () => {
      ignore = true;
    }
  })


  return <SpacesContext.Provider value={space}>
    {children}
  </SpacesContext.Provider>
}

export { SpaceContextProvider };
export default SpacesContext;