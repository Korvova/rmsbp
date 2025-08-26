import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { INSERT_EMBED_COMMAND, $createEmbedNode } from '../nodes/EmbedNode';

export default function EmbedPlugin(){
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_EMBED_COMMAND,
      (payload) => {
        editor.update(() => {
          const node = $createEmbedNode(payload);
          editor.insertNodes([node]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}
