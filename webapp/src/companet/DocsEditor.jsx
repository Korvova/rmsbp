// src/companet/DocsEditor.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import {
  $getRoot, $createParagraphNode, $createTextNode, $insertNodes,
  UNDO_COMMAND, REDO_COMMAND, FORMAT_ELEMENT_COMMAND,
  $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND
} from 'lexical';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';

// rich text helpers
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { CodeNode, $createCodeNode } from '@lexical/code';

// lists
import {
  ListNode, ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND
} from '@lexical/list';

// links
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';

// horizontal rule
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';

// tables
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import {
  TableNode, TableRowNode, TableCellNode,
  INSERT_TABLE_COMMAND, $createTableNodeWithDimensions
} from '@lexical/table';

// кастомные ноды/плагины (как у тебя были)
import { ImageNode, INSERT_IMAGE_COMMAND } from './nodes/ImageNode';
import ImagePlugin from './plugins/ImagePlugin';

import { EmbedNode, INSERT_EMBED_COMMAND } from './nodes/EmbedNode';
import EmbedPlugin from './plugins/EmbedPlugin';

import { EquationNode, INSERT_EQUATION_COMMAND } from './nodes/EquationNode';
import EquationPlugin from './plugins/EquationPlugin';

import { DateNode, INSERT_DATE_COMMAND } from './nodes/DateNode';
import DatePlugin from './plugins/DatePlugin';

import { StickyNode } from './nodes/StickyNode';
import StickyPlugin from './plugins/StickyPlugin';

import { loadDoc, saveDoc } from '../service/docsStorage';
import 'katex/dist/katex.min.css';

// ======= Toolbar =======
function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const btn = (label, onClick, title) => (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, padding:'6px 8px', cursor:'pointer' }}
    >{label}</button>
  );

  const applyBlock = (maker) => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) $setBlocksType(sel, maker);
    });
  };

  const applyInlineStyle = (styleObj) => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) $patchStyleText(sel, styleObj);
    });
  };

  const fileInputRef = useRef(null);

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
      {/* Undo / Redo */}
      {btn('↶', () => editor.dispatchCommand(UNDO_COMMAND), 'Undo')}
      {btn('↷', () => editor.dispatchCommand(REDO_COMMAND), 'Redo')}

      {/* Inline */}
      {btn('B', () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'), 'Bold')}
      {btn('I', () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'), 'Italic')}
      {btn('U', () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'), 'Underline')}
      {btn('S', () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'), 'Strikethrough')}
      {btn('<>', () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'), 'Inline code')}

      {/* Font family */}
      <select
        onChange={(e)=>applyInlineStyle({'font-family': e.target.value})}
        defaultValue=""
        style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}
        title="Font family"
      >
        <option value="">Font</option>
        <option value="Arial, Helvetica, sans-serif">Arial</option>
        <option value="'Times New Roman', Times, serif">Times New Roman</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="'Courier New', Courier, monospace">Courier New</option>
        <option value="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">Inter</option>
      </select>

      {/* Font size */}
      <select
        onChange={(e)=>applyInlineStyle({'font-size': `${e.target.value}px`})}
        defaultValue=""
        style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}
        title="Font size"
      >
        <option value="">Size</option>
        {[12,13,14,15,16,18,20,24].map(n => <option key={n} value={n}>{n}</option>)}
      </select>

      {/* Block type */}
      <select
        onChange={(e)=>{
          const v = e.target.value;
          if (v === 'paragraph') applyBlock(() => $createParagraphNode());
          if (v === 'h1')       applyBlock(() => $createHeadingNode('h1'));
          if (v === 'h2')       applyBlock(() => $createHeadingNode('h2'));
          if (v === 'h3')       applyBlock(() => $createHeadingNode('h3'));
          if (v === 'quote')    applyBlock(() => $createQuoteNode());
          if (v === 'codeblock')applyBlock(() => $createCodeNode());
        }}
        defaultValue=""
        style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', background:'#fff' }}
        title="Block type"
      >
        <option value="">Block</option>
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="quote">Quote</option>
        <option value="codeblock">Code block</option>
      </select>

      {/* Lists */}
      {btn('• List', () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined), 'Bulleted list')}
      {btn('1. List', () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined), 'Numbered list')}
      {btn('× List', () => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined), 'Remove list')}

      {/* Align */}
      {btn('⟸', () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'), 'Align left')}
      {btn('⇔',  () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'), 'Align center')}
      {btn('⟹', () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'), 'Align right')}
      {btn('=≡=',() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'), 'Justify')}

      {/* Link */}
      {btn('Link', () => {
        const url = prompt('URL:');
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url && url.trim() ? url.trim() : null);
      }, 'Insert/remove link')}

      {/* Insert */}
      <div style={{ display:'inline-flex', gap:6, marginLeft:6 }}>
        {btn('HR', () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined), 'Horizontal rule')}

        {btn('Table 3x3', () => {
          editor.update(() => {
            const table = $createTableNodeWithDimensions(3, 3, false);
            $insertNodes([table]);
          });
        }, 'Insert table 3x3')}

        {btn('Columns 2', () => {
          editor.update(() => {
            const table = $createTableNodeWithDimensions(1, 2, false);
            $insertNodes([table]);
          });
        }, 'Two columns')}
      </div>

      {/* Images */}
      {btn('Image', () => fileInputRef.current?.click(), 'Insert image')}
      {btn('Inline Img', () => {
        const url = prompt('Image URL:');
        if (url) editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src:url, alt:'', inline:true });
      }, 'Inline image')}
      {btn('GIF', () => {
        const url = prompt('GIF URL (.gif):');
        if (url) editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src:url, alt:'gif', inline:false });
      }, 'Insert GIF')}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display:'none' }}
        onChange={(e)=>{
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: reader.result, alt: f.name, inline:false });
          };
          reader.readAsDataURL(f);
          e.target.value = '';
        }}
      />

      {/* Embeds */}
      {btn('YouTube', () => {
        const url = prompt('YouTube URL:');
        if (url) editor.dispatchCommand(INSERT_EMBED_COMMAND, { embedType:'youtube', url });
      })}
      {btn('Tweet', () => {
        const url = prompt('Tweet URL:');
        if (url) editor.dispatchCommand(INSERT_EMBED_COMMAND, { embedType:'tweet', url });
      })}
      {btn('Figma', () => {
        const url = prompt('Figma file URL:');
        if (url) editor.dispatchCommand(INSERT_EMBED_COMMAND, { embedType:'figma', url });
      })}
      {btn('Excalidraw', () => {
        const url = prompt('Excalidraw URL (optional):') || 'https://excalidraw.com';
        editor.dispatchCommand(INSERT_EMBED_COMMAND, { embedType:'excalidraw', url });
      })}

      {/* Equation */}
      {btn('∑ inline', () => {
        const latex = prompt('LaTeX:');
        if (latex != null) editor.dispatchCommand(INSERT_EQUATION_COMMAND, { latex, inline:true });
      })}
      {btn('∑ block', () => {
        const latex = prompt('LaTeX:');
        if (latex != null) editor.dispatchCommand(INSERT_EQUATION_COMMAND, { latex, inline:false });
      })}

      {/* Date / Sticky */}
      {btn('Date', () => {
        const v  = prompt('Дата (YYYY-MM-DD) или пусто для сегодня:');
        const ts = v ? Date.parse(v) : Date.now();
        editor.dispatchCommand(INSERT_DATE_COMMAND, { value: Number.isFinite(ts) ? ts : Date.now() });
      })}
      {btn('Sticky', () => {
        const t = prompt('Текст стикера:') || 'Заметка';
        editor.dispatchCommand('INSERT_STICKY_COMMAND', { text: t });
      })}
    </div>
  );
}

// ======= Editor =======
export default function DocsEditor({ docId }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  const initial = useMemo(() => (docId ? loadDoc(docId) : null), [docId]);
  useEffect(() => setTitle(initial?.title || 'Без названия'), [initial]);

  const initialConfig = useMemo(() => ({
    namespace: 'docs-editor',
    onError: (e) => console.error(e),
    // ⚠️ ТЕМА: добавили классы для таблиц, чтобы они были видимы
    theme: {
      table: 'lx-table',         // применится к <table>
      tableCell: 'lx-td',        // применится к <td>
      tableCellHeader: 'lx-th',  // применится к <th>
    },
    nodes: [
      ListNode, ListItemNode,
      LinkNode,
      CodeNode,
      TableNode, TableRowNode, TableCellNode,
      HorizontalRuleNode,
      ImageNode, EmbedNode, EquationNode, DateNode, StickyNode,
    ],
    editorState: (editor) => {
      const isLexical = initial?.raw && initial.raw.root && initial.raw.root.type === 'root';
      if (isLexical) {
        try {
          const parsed = editor.parseEditorState(initial.raw);
          editor.setEditorState(parsed);
          return;
        } catch (err) {
          console.warn('Failed to parse editor state, starting empty', err);
        }
      }
      editor.update(() => {
        const root = $getRoot();
        const p = $createParagraphNode();
        p.append($createTextNode(''));
        root.append(p);
      });
    },
  }), [initial]);

  const onChange = (editorState) => {
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const raw = editorState.toJSON();
      saveDoc(docId, { title, raw });
      setSaving(false);
    }, 400);
  };

  if (!docId) {
    return <div style={{ padding: 16, opacity:.6 }}>Выберите документ или создайте новый.</div>;
  }

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center',
        gap:12, padding:'10px 12px', borderBottom:'1px solid #e5e7eb', background:'#fff'
      }}>
        <input
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          placeholder="Название документа"
          style={{ fontSize:16, fontWeight:600, border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px' }}
        />
        <span style={{ fontSize:12, color:'#6b7280' }}>{saving ? 'Сохранение…' : 'Сохранено'}</span>
      </div>

      <LexicalComposer key={docId} initialConfig={initialConfig}>
        <div style={{ display:'grid', gridTemplateRows:'auto 1fr', height:'100%' }}>
          <div style={{ padding:'8px 12px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
            <Toolbar />
          </div>

          <div style={{ overflow:'auto', padding:12, background:'#fafbff' }}>
            <div style={{ maxWidth:900, margin:'0 auto', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
              <RichTextPlugin
                contentEditable={<ContentEditable style={{ minHeight:'60vh', outline:'none', padding:'8px 10px' }} />}
                placeholder={<div style={{ opacity:.5, padding:'8px 10px' }}>Начните писать документацию…</div>}
              />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <OnChangePlugin onChange={onChange} />
              <TablePlugin />
              <HorizontalRulePlugin />
              <ImagePlugin />
              <EmbedPlugin />
              <EquationPlugin />
              <DatePlugin />
              <StickyPlugin />
            </div>
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
