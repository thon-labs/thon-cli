import React from 'react';
import { ThonContext } from '../../providers/thon-provider';

function useThon(): React.ComponentProps<typeof ThonContext.Provider>['value'] {
  const thonContext = React.useContext(ThonContext);

  return thonContext;
}

export default useThon;
