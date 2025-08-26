import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { INSERT_IMAGE_COMMAND, $createImageNode } from '../nodes/ImageNode';

export default function ImagePlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        editor.update(() => {
          const node = $createImageNode(payload);
          const selection = editor.getEditorState().read(() => null);
          // просто вставляем в текущий блок
          const root = editor.getRootElement();
          if (node) editor.insertNodes([node]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}
