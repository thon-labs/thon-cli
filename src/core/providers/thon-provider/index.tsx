import React from 'react';
import renderDocumentWrapper, {
  RenderDocumentType,
} from '../../components/render-document';

export interface IThonContext {
  RenderDocument: RenderDocumentType;
}

/* istanbul ignore next */
export const ThonContext = React.createContext<IThonContext>({
  RenderDocument: null,
});

type Props = {
  modules: any;
  children: React.ReactNode;
};

export const ThonProvider: React.FC<Props> = ({ modules, children }) => {
  const RenderDocument = renderDocumentWrapper({ modules });

  return (
    <ThonContext.Provider value={{ RenderDocument }}>
      {children}
    </ThonContext.Provider>
  );
};

export default ThonProvider;
