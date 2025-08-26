import * as React from 'react';
import { DecoratorNode, $applyNodeReplacement, $getNodeByKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Excalidraw } from '@excalidraw/excalidraw';

 import "@excalidraw/excalidraw/index.css";

export const INSERT_EXCALIDRAW_COMMAND = 'INSERT_EXCALIDRAW_COMMAND';

export class ExcalidrawNode extends DecoratorNode {
  static getType() { return 'excalidraw'; }
  static clone(node) {
    return new ExcalidrawNode(node.__data, node.__width, node.__height, node.__key);
  }

  constructor(data = { elements: [], appState: {}, files: {} }, width = 800, height = 500, key) {
    super(key);
    this.__data = data;
    this.__width = width;
    this.__height = height;
  }

  // helpers
  setData(next) {
    const w = this.getWritable();
    w.__data = next;
  }

  createDOM() {
    const div = document.createElement('div');
    div.style.margin = '8px 0';
    return div;
  }
  updateDOM() { return false; }

  exportJSON() {
    return {
      type: 'excalidraw',
      version: 1,
      data: this.__data,
      width: this.__width,
      height: this.__height,
    };
  }
  static importJSON(json) {
    return new ExcalidrawNode(json.data || { elements: [], appState: {}, files: {} }, json.width || 800, json.height || 500);
  }

  decorate() {
    return (
      <ExcalidrawView
        nodeKey={this.getKey()}
        data={this.__data}
        width={this.__width}
        height={this.__height}
      />
    );
  }
}

function ExcalidrawView({ nodeKey, data, width, height }) {
  const [editor] = useLexicalComposerContext();

  const onChange = React.useCallback((elements, appState, files) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof ExcalidrawNode) {
        node.setData({ elements, appState, files });
      }
    });
  }, [editor, nodeKey]);

  return (
    <div style={{ display:'flex', justifyContent:'center' }}>
      <div style={{ width, height, border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
        <Excalidraw
          initialData={data}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export function $createExcalidrawNode(payload = {}) {
  const { data, width, height } = payload;
  return $applyNodeReplacement(new ExcalidrawNode(
    data || { elements: [], appState: {}, files: {} },
    width || 800,
    height || 500,
  ));
}
