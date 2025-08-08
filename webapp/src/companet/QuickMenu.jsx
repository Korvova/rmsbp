// src/companet/QuickMenu.jsx
import { useRef, useState, useMemo, useEffect } from 'react';
import './quickmenu.css';

const BASE_TITLES = [
  'Оптимизация загрузки страницы',
  'Рефакторинг API-клиента',
  'Интеграция платежного шлюза',
  'UI для фильтрации данных',
  'Автотесты для авторизации',
];
const EXTRA_TITLES = [
  'Миграция на Vite',
  'Кэширование ответов API',
  'Линтеры и форматирование',
  'Адаптивная вёрстка каталога',
  'Модульные тесты корзины',
  'Логирование ошибок клиента',
  'Реализация SSO',
  'Поддержка тёмной темы',
  'Оптимизация изображений',
  'Механизм ролей и прав',
];

const CONDITIONS = [
  { id: '',               label: 'Без условия' },
  { id: 'afterAny',       label: 'После завершения любой связанной' },
  { id: 'afterAll',       label: 'После завершения всех связанных' },
  { id: 'afterSelected',  label: 'После выбранных связей' },
  { id: 'atDate',         label: 'В дату (📅)' },
  { id: 'afterAnyDelay',  label: 'Через X дней (⏰)' },
];

const BASE_ASSIGNEES = ['Иван', 'Ольга', 'Сергей', 'Айжан', 'Дмитрий'];
const EXTRA_ASSIGNEES = ['Мария','Алексей','Жанна','Павел','Елена','Нурлан','Гульнар','Руслан','Тимур','Катерина'];

const DIFFICULTY = Array.from({ length: 10 }, (_, i) => String(i + 1));
const TYPES      = ['Отчёт', 'рисеч', 'кодинг', 'ТЗ', 'встреча', 'преза', 'анализ', 'КП'];

export default function QuickMenu({ x, y, onDraftChange }) {
  // не даём клику «пробиваться» до React Flow
  const stopAll = (e) => { e.stopPropagation(); e.preventDefault(); };

  // раскрытые дропдауны (эксклюзивно — один открыт)
  const [open, setOpen] = useState({ title:false, conditions:false, assignee:false, difficulty:false, type:false });
  const toggleOnly = (key) => () =>
    setOpen(o => {
      const isOpen = !!o[key];
      return { title:false, conditions:false, assignee:false, difficulty:false, type:false, [key]: !isOpen };
    });

  // ===== Название =====
  const [titles, setTitles] = useState(BASE_TITLES);
  const extraIdxRef = useRef(0);
  const [pickedTitle, setPickedTitle] = useState(null);

  const handleMoreTitles = () => {
    const chunk = 5;
    const start = extraIdxRef.current;
    const items = Array.from({ length: chunk }, (_, i) => EXTRA_TITLES[(start + i) % EXTRA_TITLES.length]);
    extraIdxRef.current = (start + chunk) % EXTRA_TITLES.length;
    setTitles(prev => Array.from(new Set([...prev, ...items])));
  };

  // ===== Условия =====
  const [pickedCond, setPickedCond] = useState(null); // {id,label} | null

  // ===== Исполнитель =====
  const [assignees, setAssignees] = useState(BASE_ASSIGNEES);
  const assExtraIdxRef = useRef(0);
  const [pickedAss, setPickedAss] = useState(null);
  const moreAssignees = () => {
    const chunk = 5;
    const start = assExtraIdxRef.current;
    const items = Array.from({ length: chunk }, (_, i) => EXTRA_ASSIGNEES[(start + i) % EXTRA_ASSIGNEES.length]);
    assExtraIdxRef.current = (start + chunk) % EXTRA_ASSIGNEES.length;
    setAssignees(prev => Array.from(new Set([...prev, ...items])));
  };

  // ===== Сложность =====
  const [pickedDiff, setPickedDiff] = useState(null);

  // ===== Тип =====
  const [pickedType, setPickedType] = useState(null);

  // summary наверх
  useEffect(() => {
    onDraftChange?.({
      title: pickedTitle || null,
      conditionId: pickedCond?.id || '',
      conditionLabel: pickedCond?.label || '',
      assignee: pickedAss || null,
      difficulty: pickedDiff || null,
      type: pickedType || null,
    });
  }, [pickedTitle, pickedCond, pickedAss, pickedDiff, pickedType, onDraftChange]);

  // классы для ярлыков
  const itemClass = (key, picked) =>
    [
      'quickmenu-item',
      'has-sub',
      open[key] ? 'is-active' : '',
      picked ? 'is-picked' : '',
    ].join(' ');

  return (
    <div
      className="quickmenu"
      style={{ left: x, top: y }}
      onPointerDown={stopAll}
      onMouseDown={stopAll}
      onClick={stopAll}
    >
      <ul className="quickmenu-summary">
        <li><span className="sm-label">Название:</span>     <strong className="sm-value">{pickedTitle || '—'}</strong></li>
        <li><span className="sm-label">Условия:</span>      <strong className="sm-value">{pickedCond?.label  || '—'}</strong></li>
        <li><span className="sm-label">Исполнитель:</span>  <strong className="sm-value">{pickedAss   || '—'}</strong></li>
        <li><span className="sm-label">Сложность:</span>    <strong className="sm-value">{pickedDiff  || '—'}</strong></li>
        <li><span className="sm-label">Тип:</span>          <strong className="sm-value">{pickedType  || '—'}</strong></li>
      </ul>

      <div className="quickmenu-inner">
        {/* ===== Название ===== */}
        <div className={itemClass('title', !!pickedTitle)} onClick={toggleOnly('title')}>
          Название
          {open.title && (
            <div className="quickmenu-sub dropdown level-1" onClick={stopAll}>
              <div className="qm-col-list">
                {titles.map(t => (
                  <div
                    key={t}
                    className={'quickmenu-subitem ' + (pickedTitle === t ? 'is-picked' : '')}
                    onClick={() => setPickedTitle(t)}
                  >
                    {t}
                  </div>
                ))}
                <div className="quickmenu-sep" />
                <div className="quickmenu-subfoot">
                  <button className="qm-link" onClick={handleMoreTitles}>➕ Ещё</button>
                  <button className="qm-link danger" onClick={() => setPickedTitle(null)}>❌ Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Условия ===== */}
        <div className={itemClass('conditions', !!pickedCond)} onClick={toggleOnly('conditions')}>
          Условия
          {open.conditions && (
            <div className="quickmenu-sub dropdown level-2" onClick={stopAll}>
              <div className="qm-col-list">
                {CONDITIONS.map(c => (
                  <div
                    key={c.id}
                    className={'quickmenu-subitem ' + (pickedCond?.id === c.id ? 'is-picked' : '')}
                    onClick={() => setPickedCond(c)}
                  >
                    {c.label}
                  </div>
                ))}
                <div className="quickmenu-sep" />
                <div className="quickmenu-subfoot">
                  <span className="qm-foot-spacer" />
                  <button className="qm-link danger" onClick={() => setPickedCond(null)}>❌ Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Исполнитель ===== */}
        <div className={itemClass('assignee', !!pickedAss)} onClick={toggleOnly('assignee')}>
          Исполнитель
          {open.assignee && (
            <div className="quickmenu-sub dropdown level-3" onClick={stopAll}>
              <div className="qm-col-list">
                {assignees.map(a => (
                  <div
                    key={a}
                    className={'quickmenu-subitem ' + (pickedAss === a ? 'is-picked' : '')}
                    onClick={() => setPickedAss(a)}
                  >
                    {a}
                  </div>
                ))}
                <div className="quickmenu-sep" />
                <div className="quickmenu-subfoot">
                  <button className="qm-link" onClick={moreAssignees}>➕ Ещё</button>
                  <button className="qm-link danger" onClick={() => setPickedAss(null)}>❌ Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Сложность ===== */}
        <div className={itemClass('difficulty', !!pickedDiff)} onClick={toggleOnly('difficulty')}>
          Сложность
          {open.difficulty && (
            <div className="quickmenu-sub dropdown level-4 narrow" onClick={stopAll}>
              <div className="qm-col-list narrow">
                {DIFFICULTY.map(d => (
                  <div
                    key={d}
                    className={'quickmenu-subitem ' + (pickedDiff === d ? 'is-picked' : '')}
                    onClick={() => setPickedDiff(d)}
                  >
                    {d}
                  </div>
                ))}
                <div className="quickmenu-sep" />
                <div className="quickmenu-subfoot">
                  <span className="qm-foot-spacer" />
                  <button className="qm-link danger" onClick={() => setPickedDiff(null)}>❌ Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Тип ===== */}
        <div className={itemClass('type', !!pickedType)} onClick={toggleOnly('type')}>
          Тип
          {open.type && (
            <div className="quickmenu-sub dropdown level-5 narrow" onClick={stopAll}>
              <div className="qm-col-list narrow">
                {TYPES.map(t => (
                  <div
                    key={t}
                    className={'quickmenu-subitem ' + (pickedType === t ? 'is-picked' : '')}
                    onClick={() => setPickedType(t)}
                  >
                    {t}
                  </div>
                ))}
                <div className="quickmenu-sep" />
                <div className="quickmenu-subfoot">
                  <span className="qm-foot-spacer" />
                  <button className="qm-link danger" onClick={() => setPickedType(null)}>❌ Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ pointerEvents:'auto', marginTop:6, textAlign:'center', color:'#ddd', fontSize:11 }}>
        Кликните по пустому месту — карточка будет создана с этим набором
      </div>
    </div>
  );
}
