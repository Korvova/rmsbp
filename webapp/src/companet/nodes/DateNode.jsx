import * as React from 'react';
import { DecoratorNode, $applyNodeReplacement } from 'lexical';

export const INSERT_DATE_COMMAND = 'INSERT_DATE_COMMAND';

function fmt(d){ return new Date(d).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' }); }

function DateBadge({ value }){
  const date = value ? new Date(value) : new Date();
  return (
    <span style={{
      display:'inline-block', padding:'2px 6px', border:'1px solid #e5e7eb', borderRadius:6,
      background:'#f8fafc', fontSize:12
    }}>
      📅 {fmt(date)}
    </span>
  );
}

export class DateNode extends DecoratorNode {
  static getType(){ return 'date'; }
  static clone(n){ return new DateNode(n.__value, n.__key); }
  constructor(value, key){ super(key); this.__value = value || Date.now(); }
  createDOM(){ return document.createElement('span'); }
  updateDOM(){ return false; }
  exportJSON(){ return { type:'date', version:1, value:this.__value }; }
  static importJSON(json){ return new DateNode(json.value); }
  decorate(){ return <DateBadge value={this.__value}/>; }
}

export function $createDateNode(value){
  return $applyNodeReplacement(new DateNode(value));
}
