import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { INSERT_EXCALIDRAW_COMMAND, $createExcalidrawNode } from '../nodes/ExcalidrawNode';

export default function ExcalidrawPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_EXCALIDRAW_COMMAND,
      (payload) => {
        editor.update(() => {
          const node = $createExcalidrawNode(payload || {});
          editor.insertNodes([node]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
