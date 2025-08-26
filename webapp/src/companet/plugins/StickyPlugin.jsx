import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { INSERT_STICKY_COMMAND } from '../nodes/StickyNode';
import { $createStickyNode } from '../nodes/StickyNode';

export default function StickyPlugin(){
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_STICKY_COMMAND,
      (payload) => {
        editor.update(() => { editor.insertNodes([$createStickyNode(payload?.text || 'Sticky')]); });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}
