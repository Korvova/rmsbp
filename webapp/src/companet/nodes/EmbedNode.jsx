import * as React from 'react';
import { DecoratorNode, $applyNodeReplacement } from 'lexical';

export const INSERT_EMBED_COMMAND = 'INSERT_EMBED_COMMAND';

function buildEmbed({ type, url }) {
  if (type === 'youtube') {
    // ожидаем https://www.youtube.com/watch?v=ID
    const id = (url.match(/[?&]v=([^&]+)/) || [])[1] || url;
    return <iframe title="YouTube" src={`https://www.youtube.com/embed/${id}`} width="560" height="315" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>;
  }
  if (type === 'tweet') {
    // обёртка через twitframe
    return <iframe title="Tweet" src={`https://twitframe.com/show?url=${encodeURIComponent(url)}`} width="560" height="400" frameBorder="0"/>;
  }
  if (type === 'figma') {
    return <iframe title="Figma" src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`} width="800" height="450" allowFullScreen/>;
  }
  if (type === 'excalidraw') {
    return <iframe title="Excalidraw" src={url || 'https://excalidraw.com'} width="800" height="600" />;
  }
  return <a href={url} target="_blank" rel="noreferrer">{url}</a>;
}

export class EmbedNode extends DecoratorNode {
  static getType(){ return 'embed'; }
  static clone(node){ return new EmbedNode(node.__embedType, node.__url, node.__key); }

  constructor(embedType, url, key){
    super(key);
    this.__embedType = embedType;
    this.__url = url;
  }
  createDOM(){ const div = document.createElement('div'); div.style.margin='8px 0'; return div; }
  updateDOM(){ return false; }

  exportJSON(){
    return { type:'embed', version:1, embedType: this.__embedType, url: this.__url };
  }
  static importJSON(json){
    return new EmbedNode(json.embedType, json.url);
  }

  decorate(){
    return (
      <div style={{ display:'flex', justifyContent:'center' }}>
        {buildEmbed({ type:this.__embedType, url:this.__url })}
      </div>
    );
  }
}

export function $createEmbedNode({ embedType, url }) {
  return $applyNodeReplacement(new EmbedNode(embedType, url));
}
