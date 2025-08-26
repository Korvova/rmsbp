import * as React from 'react';
import { DecoratorNode, $applyNodeReplacement } from 'lexical';

export const INSERT_IMAGE_COMMAND = 'INSERT_IMAGE_COMMAND';

export class ImageNode extends DecoratorNode {
  static getType() { return 'image'; }
  static clone(node) { return new ImageNode(node.__src, node.__alt, node.__inline, node.__key); }

  constructor(src, alt = '', inline = false, key) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__inline = inline;
  }

  createDOM() {
    const el = document.createElement(this.__inline ? 'span' : 'div');
    if (!this.__inline) el.style.display = 'block';
    return el;
  }
  updateDOM() { return false; }

  exportJSON() {
    return { type: 'image', version: 1, src: this.__src, alt: this.__alt, inline: this.__inline };
  }
  static importJSON(json) {
    const node = new ImageNode(json.src, json.alt || '', !!json.inline);
    return node;
  }

  decorate() {
    const style = this.__inline ? { maxHeight: 22, verticalAlign: 'middle' } : { maxWidth: '100%', borderRadius: 8 };
    return <img src={this.__src} alt={this.__alt} style={style} />;
  }
}

export function $createImageNode({ src, alt = '', inline = false }) {
  return $applyNodeReplacement(new ImageNode(src, alt, inline));
}
