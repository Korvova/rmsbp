import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { INSERT_DATE_COMMAND } from '../nodes/DateNode';
import { $createDateNode } from '../nodes/DateNode';

export default function DatePlugin(){
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_DATE_COMMAND,
      (payload) => {
        editor.update(() => {
          editor.insertNodes([$createDateNode(payload?.value)]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}
