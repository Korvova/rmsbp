import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { INSERT_EQUATION_COMMAND, $createEquationNode } from '../nodes/EquationNode';

export default function EquationPlugin(){
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_EQUATION_COMMAND,
      (payload) => {
        editor.update(() => {
          editor.insertNodes([$createEquationNode(payload)]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}
