import * as React from 'react';
import { DecoratorNode, $applyNodeReplacement } from 'lexical';
export const INSERT_STICKY_COMMAND = 'INSERT_STICKY_COMMAND';

function Sticky({ text }){
  return (
    <div style={{
      background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, padding:12,
      boxShadow:'0 2px 12px rgba(0,0,0,.06)', maxWidth:360
    }}>{text}</div>
  );
}

export class StickyNode extends DecoratorNode {
  static getType(){ return 'sticky'; }
  static clone(n){ return new StickyNode(n.__text, n.__key); }
  constructor(text, key){ super(key); this.__text = text || 'Sticky'; }
  createDOM(){ const d=document.createElement('div'); d.style.margin='8px 0'; return d; }
  updateDOM(){ return false; }
  exportJSON(){ return { type:'sticky', version:1, text:this.__text }; }
  static importJSON(json){ return new StickyNode(json.text || ''); }
  decorate(){ return <Sticky text={this.__text}/>; }
}
export function $createStickyNode(text){ return $applyNodeReplacement(new StickyNode(text)); }
