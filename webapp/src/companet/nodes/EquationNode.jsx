import * as React from 'react';
import katex from 'katex';
import { DecoratorNode, $applyNodeReplacement } from 'lexical';

export const INSERT_EQUATION_COMMAND = 'INSERT_EQUATION_COMMAND';

function EquationView({ latex, inline }){
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex || '', ref.current, { throwOnError:false, displayMode: !inline });
      } catch {}
    }
  }, [latex, inline]);
  return <span ref={ref} style={inline ? {} : { display:'block', padding:'6px 0' }} />;
}

export class EquationNode extends DecoratorNode {
  static getType(){ return 'equation'; }
  static clone(n){ return new EquationNode(n.__latex, n.__inline, n.__key); }
  constructor(latex, inline=false, key){ super(key); this.__latex=latex; this.__inline=inline; }
  createDOM(){ const el = document.createElement(this.__inline ? 'span':'div'); return el; }
  updateDOM(){ return false; }
  exportJSON(){ return { type:'equation', version:1, latex:this.__latex, inline:this.__inline }; }
  static importJSON(json){ return new EquationNode(json.latex || '', !!json.inline); }
  decorate(){ return <EquationView latex={this.__latex} inline={this.__inline}/>; }
}

export function $createEquationNode({ latex, inline=false }){
  return $applyNodeReplacement(new EquationNode(latex, inline));
}
