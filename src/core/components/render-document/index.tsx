import React from 'react';
import { marked } from '../../services/marked';
import frontMatter from 'front-matter';

type DocumentPiece = {
  type: 'react' | 'html' | 'markdown';
  value: string;
  component: string;
  module: string;
  renderView: React.ReactNode;
};

type Props = {
  modules?: any;
  markdown: string;
};

type RenderDocumentProps = Props & React.HTMLAttributes<HTMLDivElement>;

export type RenderDocumentType = React.FC<RenderDocumentProps>;

const RenderDocument: RenderDocumentType = ({
  modules,
  markdown,
  ...props
}) => {
  const [documentPieces, setDocumentPieces] = React.useState<DocumentPiece[]>(
    [],
  );

  React.useEffect(() => {
    (async () => {
      let rawMarkdown = markdown;

      if (rawMarkdown.startsWith('/') && rawMarkdown.endsWith('.md')) {
        rawMarkdown = await fetch(rawMarkdown).then((response) =>
          response.text(),
        );
      }

      // Remove metadata
      rawMarkdown = frontMatter(rawMarkdown).body;

      // Locate thon blocks
      const componentsCount = rawMarkdown.match(/```thon/g)?.length || 0;
      const componentKey = '```thon';

      let pieces: DocumentPiece[] = [];

      for (let i = 0; i < componentsCount; i++) {
        const startComponentIndex =
          rawMarkdown.indexOf(componentKey) + componentKey.length;
        const endComponentIndex =
          startComponentIndex +
          rawMarkdown.substring(startComponentIndex).indexOf('```');

        const componentData = JSON.parse(
          rawMarkdown.substring(startComponentIndex, endComponentIndex).trim(),
        );

        pieces.push({
          type: 'markdown',
          value: marked.parse(
            rawMarkdown
              .substring(0, startComponentIndex - componentKey.length)
              .trim(),
            null,
            null,
          ),
        } as DocumentPiece);
        pieces.push(componentData);

        rawMarkdown = rawMarkdown
          .substring(endComponentIndex + 3, rawMarkdown.length)
          .trim();
      }

      setDocumentPieces(pieces);
    })();
  }, [markdown]);

  function renderMarkdownPiece(document: DocumentPiece, index: number) {
    return (
      <div
        key={`${document.type}_${index}`}
        dangerouslySetInnerHTML={{ __html: document.value as string }}
      />
    );
  }

  function renderReactComponent(document: DocumentPiece, index: number) {
    return (
      <div key={`${document.type}_${index}`}>
        {modules[document.module][document.component]()}
      </div>
    );
  }

  return (
    <div {...props}>
      {documentPieces.map((document, index) => {
        switch (document.type) {
          case 'markdown':
            return renderMarkdownPiece(document, index);
          case 'react':
          default:
            return renderReactComponent(document, index);
        }
      })}
    </div>
  );
};

function renderDocumentWrapper({
  modules,
}: {
  modules: any;
}): RenderDocumentType {
  return (props: RenderDocumentProps) => {
    return <RenderDocument {...props} modules={modules} />;
  };
}

export default renderDocumentWrapper;
