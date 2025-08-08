import { useRef, useState, useMemo } from 'react';
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
  'Без условия',
  'После завершения любой связанной',
  'После завершения всех связанных',
  'После выбранных связей',
  'В дату (📅)',
  'Через X дней (⏰)',
];

const BASE_ASSIGNEES = ['Иван', 'Ольга', 'Сергей', 'Айжан', 'Дмитрий'];
const EXTRA_ASSIGNEES = [
  'Мария', 'Алексей', 'Жанна', 'Павел', 'Елена',
  'Нурлан', 'Гульнар', 'Руслан', 'Тимур', 'Катерина',
];

export default function QuickMenu({ x, y }) {
  const [hoverMain, setHoverMain] = useState(null); // 'title' | 'conditions' | 'assignee' | null

  /* ===== Название ===== */
  const [hoverTitleSub, setHoverTitleSub] = useState(false);
  const [titles, setTitles] = useState(BASE_TITLES);
  const extraIdxRef = useRef(0);
  const [pickedTitle, setPickedTitle] = useState(null);
  const [titleCancelled, setTitleCancelled] = useState(false);
  const showTitleSub = hoverMain === 'title' || hoverTitleSub;

  const handleMoreTitles = () => {
    const chunk = 5;
    const start = extraIdxRef.current;
    const items = Array.from({ length: chunk }, (_, i) =>
      EXTRA_TITLES[(start + i) % EXTRA_TITLES.length]
    );
    extraIdxRef.current = (start + chunk) % EXTRA_TITLES.length;
    setTitles(prev => Array.from(new Set([...prev, ...items])));
  };
  const onPickTitle = t => { setPickedTitle(t); setTitleCancelled(false); };
  const onCancelTitle = () => { setPickedTitle(null); setTitleCancelled(true); };

  const titleItemClass = useMemo(() => [
    'quickmenu-item', 'has-sub',
    hoverMain === 'title' ? 'is-active' : '',
    pickedTitle ? 'is-picked' : '',
    !pickedTitle && titleCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedTitle, titleCancelled]);

  /* ===== Условия ===== */
  const [hoverCondSub, setHoverCondSub] = useState(false);
  const [pickedCond, setPickedCond] = useState(null);
  const [condCancelled, setCondCancelled] = useState(false);
  const showCondSub = hoverMain === 'conditions' || hoverCondSub;

  const onPickCond = c => { setPickedCond(c); setCondCancelled(false); };
  const onCancelCond = () => { setPickedCond(null); setCondCancelled(true); };

  const condItemClass = useMemo(() => [
    'quickmenu-item', 'has-sub',
    hoverMain === 'conditions' ? 'is-active' : '',
    pickedCond ? 'is-picked' : '',
    !pickedCond && condCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedCond, condCancelled]);

  /* ===== Исполнитель ===== */
  const [hoverAssSub, setHoverAssSub] = useState(false);
  const [assignees, setAssignees] = useState(BASE_ASSIGNEES);
  const assExtraIdxRef = useRef(0);
  const [pickedAss, setPickedAss] = useState(null);
  const [assCancelled, setAssCancelled] = useState(false);
  const showAssSub = hoverMain === 'assignee' || hoverAssSub;

  const handleMoreAssignees = () => {
    const chunk = 5;
    const start = assExtraIdxRef.current;
    const items = Array.from({ length: chunk }, (_, i) =>
      EXTRA_ASSIGNEES[(start + i) % EXTRA_ASSIGNEES.length]
    );
    assExtraIdxRef.current = (start + chunk) % EXTRA_ASSIGNEES.length;
    setAssignees(prev => Array.from(new Set([...prev, ...items])));
  };
  const onPickAss = a => { setPickedAss(a); setAssCancelled(false); };
  const onCancelAss = () => { setPickedAss(null); setAssCancelled(true); };

  const assItemClass = useMemo(() => [
    'quickmenu-item', 'has-sub',
    hoverMain === 'assignee' ? 'is-active' : '',
    pickedAss ? 'is-picked' : '',
    !pickedAss && assCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedAss, assCancelled]);

  /* ===== Hover-commit для кнопок внизу ===== */
  const hc = useRef({
    moreTitles:false, cancelTitle:false,
    cancelCond:false,
    moreAss:false, cancelAss:false,
  });

  const enter = key => () => { hc.current[key] = true; };
  const leave = (key, fn) => () => {
    if (hc.current[key]) fn();
    hc.current[key] = false;
  };

  return (
    <div className="quickmenu" style={{ left: x, top: y }}>
      {/* сводка выбранных значений — ТРИ СТРОКИ */}
      <ul className="quickmenu-summary">
        <li><span className="sm-label">Название:</span>     <strong className="sm-value">{pickedTitle || '—'}</strong></li>
        <li><span className="sm-label">Условия:</span>      <strong className="sm-value">{pickedCond  || '—'}</strong></li>
        <li><span className="sm-label">Исполнитель:</span>  <strong className="sm-value">{pickedAss   || '—'}</strong></li>
      </ul>

      <div className="quickmenu-inner">
        {/* Название */}
        <div
          className={titleItemClass}
          onMouseEnter={() => setHoverMain('title')}
          onMouseLeave={() => setHoverMain(null)}
        >
          Название

          {showTitleSub && (
            <div
              className="quickmenu-sub below"
              onMouseEnter={() => setHoverTitleSub(true)}
              onMouseLeave={() => setHoverTitleSub(false)}
            >
              {titles.map(t => (
                <div
                  key={t}
                  className={'quickmenu-subitem ' + (pickedTitle === t ? 'is-picked' : '')}
                  onMouseEnter={() => onPickTitle(t)}
                  onClick={() => onPickTitle(t)}
                >
                  {t}
                </div>
              ))}

              <div className="quickmenu-sep" />

              <div className="quickmenu-subfoot">
                <button
                  className="qm-link"
                  onClick={handleMoreTitles}
                  onMouseEnter={enter('moreTitles')}
                  onMouseLeave={leave('moreTitles', handleMoreTitles)}
                >
                  ➕ Ещё
                </button>
                <button
                  className="qm-link danger"
                  onClick={onCancelTitle}
                  onMouseEnter={enter('cancelTitle')}
                  onMouseLeave={leave('cancelTitle', onCancelTitle)}
                >
                  ❌ Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Условия */}
        <div
          className={condItemClass}
          onMouseEnter={() => setHoverMain('conditions')}
          onMouseLeave={() => setHoverMain(null)}
        >
          Условия

          {showCondSub && (
            <div
              className="quickmenu-sub below"
              onMouseEnter={() => setHoverCondSub(true)}
              onMouseLeave={() => setHoverCondSub(false)}
            >
              {CONDITIONS.map(c => (
                <div
                  key={c}
                  className={'quickmenu-subitem ' + (pickedCond === c ? 'is-picked' : '')}
                  onMouseEnter={() => onPickCond(c)}
                  onClick={() => onPickCond(c)}
                >
                  {c}
                </div>
              ))}

              <div className="quickmenu-sep" />

              <div className="quickmenu-subfoot">
                <span className="qm-foot-spacer" />
                <button
                  className="qm-link danger"
                  onClick={onCancelCond}
                  onMouseEnter={enter('cancelCond')}
                  onMouseLeave={leave('cancelCond', onCancelCond)}
                >
                  ❌ Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Исполнитель */}
        <div
          className={assItemClass}
          onMouseEnter={() => setHoverMain('assignee')}
          onMouseLeave={() => setHoverMain(null)}
        >
          Исполнитель

          {showAssSub && (
            <div
              className="quickmenu-sub below"
              onMouseEnter={() => setHoverAssSub(true)}
              onMouseLeave={() => setHoverAssSub(false)}
            >
              {assignees.map(a => (
                <div
                  key={a}
                  className={'quickmenu-subitem ' + (pickedAss === a ? 'is-picked' : '')}
                  onMouseEnter={() => onPickAss(a)}
                  onClick={() => onPickAss(a)}
                >
                  {a}
                </div>
              ))}

              <div className="quickmenu-sep" />

              <div className="quickmenu-subfoot">
                <button
                  className="qm-link"
                  onClick={handleMoreAssignees}
                  onMouseEnter={enter('moreAss')}
                  onMouseLeave={leave('moreAss', handleMoreAssignees)}
                >
                  ➕ Ещё
                </button>
                <button
                  className="qm-link danger"
                  onClick={onCancelAss}
                  onMouseEnter={enter('cancelAss')}
                  onMouseLeave={leave('cancelAss', onCancelAss)}
                >
                  ❌ Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
