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
const EXTRA_ASSIGNEES = ['Мария','Алексей','Жанна','Павел','Елена','Нурлан','Гульнар','Руслан','Тимур','Катерина'];

const DIFFICULTY = Array.from({ length: 10 }, (_, i) => String(i + 1));
const TYPES      = ['Отчёт', 'рисеч', 'кодинг', 'ТЗ', 'встреча', 'преза', 'анализ', 'КП'];

export default function QuickMenu({ x, y }) {
  const [hoverMain, setHoverMain] = useState(null); // 'title' | 'conditions' | 'assignee' | 'difficulty' | 'type' | null

  // ===== Название (lvl1) =====
  const [hoverTitleSub, setHoverTitleSub] = useState(false);
  const [titles, setTitles] = useState(BASE_TITLES);
  const extraIdxRef = useRef(0);
  const [pickedTitle, setPickedTitle] = useState(null);
  const [titleCancelled, setTitleCancelled] = useState(false);

  // ===== Каскад: Название → Условия → Исполнитель → Сложность → Тип =====
  const [hoverChainCond, setHoverChainCond]   = useState(false); // lvl2
  const [hoverChainAss,  setHoverChainAss]    = useState(false); // lvl3
  const [hoverChainDiff, setHoverChainDiff]   = useState(false); // lvl4 (узкий)
  const [hoverChainType, setHoverChainType]   = useState(false); // lvl5 (узкий)

  const showTitleSub  = (hoverMain === 'title') || hoverTitleSub || hoverChainCond || hoverChainAss || hoverChainDiff || hoverChainType;
  const showCondChain = hoverChainCond  || hoverChainAss || hoverChainDiff || hoverChainType;
  const showAssChain  = hoverChainAss   || hoverChainDiff || hoverChainType;
  const showDiffChain = hoverChainDiff  || hoverChainType;
  const showTypeChain = hoverChainType;

  const handleMoreTitles = () => {
    const chunk = 5;
    const start = extraIdxRef.current;
    const items = Array.from({ length: chunk }, (_, i) => EXTRA_TITLES[(start + i) % EXTRA_TITLES.length]);
    extraIdxRef.current = (start + chunk) % EXTRA_TITLES.length;
    setTitles(prev => Array.from(new Set([...prev, ...items])));
  };
  const onPickTitle   = t => { setPickedTitle(t); setTitleCancelled(false); };
  const onCancelTitle = () => { setPickedTitle(null); setTitleCancelled(true); };

  const titleItemClass = useMemo(() => [
    'quickmenu-item', 'has-sub',
    hoverMain === 'title' ? 'is-active' : '',
    pickedTitle ? 'is-picked' : '',
    !pickedTitle && titleCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedTitle, titleCancelled]);

  // ===== Условия (lvl2) =====
  const [pickedCond, setPickedCond] = useState(null);
  const [condCancelled, setCondCancelled] = useState(false);
  const onPickCond = c => { setPickedCond(c); setCondCancelled(false); };
  const onCancelCond = () => { setPickedCond(null); setCondCancelled(true); };

  const condItemClass = useMemo(() => [
    'quickmenu-item',
    hoverMain === 'conditions' ? 'is-active' : '',
    pickedCond ? 'is-picked' : '',
    !pickedCond && condCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedCond, condCancelled]);

  // ===== Исполнитель (lvl3) =====
  const [assignees, setAssignees] = useState(BASE_ASSIGNEES);
  const assExtraIdxRef = useRef(0);
  const [pickedAss, setPickedAss] = useState(null);
  const [assCancelled, setAssCancelled] = useState(false);

  const handleMoreAssignees = () => {
    const chunk = 5;
    const start = assExtraIdxRef.current;
    const items = Array.from({ length: chunk }, (_, i) => EXTRA_ASSIGNEES[(start + i) % EXTRA_ASSIGNEES.length]);
    assExtraIdxRef.current = (start + chunk) % EXTRA_ASSIGNEES.length;
    setAssignees(prev => Array.from(new Set([...prev, ...items])));
  };
  const onPickAss   = a => { setPickedAss(a); setAssCancelled(false); };
  const onCancelAss = () => { setPickedAss(null); setAssCancelled(true); };

  const assItemClass = useMemo(() => [
    'quickmenu-item',
    hoverMain === 'assignee' ? 'is-active' : '',
    pickedAss ? 'is-picked' : '',
    !pickedAss && assCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedAss, assCancelled]);

  // ===== Сложность (lvl4, narrow) =====
  const [pickedDiff, setPickedDiff] = useState(null);
  const [diffCancelled, setDiffCancelled] = useState(false);
  const onPickDiff   = d => { setPickedDiff(d); setDiffCancelled(false); };
  const onCancelDiff = () => { setPickedDiff(null); setDiffCancelled(true); };

  const diffItemClass = useMemo(() => [
    'quickmenu-item',
    hoverMain === 'difficulty' ? 'is-active' : '',
    pickedDiff ? 'is-picked' : '',
    !pickedDiff && diffCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedDiff, diffCancelled]);

  // ===== Тип (lvl5, narrow) =====
  const [pickedType, setPickedType] = useState(null);
  const [typeCancelled, setTypeCancelled] = useState(false);
  const onPickType   = t => { setPickedType(t); setTypeCancelled(false); };
  const onCancelType = () => { setPickedType(null); setTypeCancelled(true); };

  const typeItemClass = useMemo(() => [
    'quickmenu-item',
    hoverMain === 'type' ? 'is-active' : '',
    pickedType ? 'is-picked' : '',
    !pickedType && typeCancelled ? 'is-cancelled' : '',
  ].join(' '), [hoverMain, pickedType, typeCancelled]);

  // ===== Hover-commit для нижних кнопок =====
  const hc = useRef({
    moreTitles:false, cancelTitle:false,
    cancelCond:false,
    moreAss:false, cancelAss:false,
    cancelDiff:false, cancelType:false,
  });
  const enter = key => () => { hc.current[key] = true; };
  const leave = (key, fn) => () => { if (hc.current[key]) fn(); hc.current[key] = false; };

  return (
    <div className="quickmenu" style={{ left: x, top: y }}>
      {/* Сводка выбранного */}
      <ul className="quickmenu-summary">
        <li><span className="sm-label">Название:</span>     <strong className="sm-value">{pickedTitle || '—'}</strong></li>
        <li><span className="sm-label">Условия:</span>      <strong className="sm-value">{pickedCond  || '—'}</strong></li>
        <li><span className="sm-label">Исполнитель:</span>  <strong className="sm-value">{pickedAss   || '—'}</strong></li>
        <li><span className="sm-label">Сложность:</span>    <strong className="sm-value">{pickedDiff  || '—'}</strong></li>
        <li><span className="sm-label">Тип:</span>          <strong className="sm-value">{pickedType  || '—'}</strong></li>
      </ul>

      <div className="quickmenu-inner">
        {/* Название (lvl1) */}
        <div
          className={titleItemClass}
          onMouseEnter={() => setHoverMain('title')}
          onMouseLeave={() => setHoverMain(null)}
        >
          Название

          {showTitleSub && (
            <div
              className="quickmenu-sub level-1"
              onMouseEnter={() => setHoverTitleSub(true)}
              onMouseLeave={() => setHoverTitleSub(false)}
            >
              <div className="qm-col-list">
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

              {/* → Условия (lvl2) */}
              <div
                className="qm-next-col"
                title="Перейти к условиям →"
                onMouseEnter={() => setHoverChainCond(true)}
                onMouseLeave={() => setHoverChainCond(false)}
              >
                →
              </div>

              {showCondChain && (
                <div
                  className="quickmenu-sub level-2"
                  onMouseEnter={() => setHoverChainCond(true)}
                  onMouseLeave={() => setHoverChainCond(false)}
                >
                  <div className="qm-col-list">
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

                  {/* → Исполнитель (lvl3) */}
                  <div
                    className="qm-next-col"
                    title="Перейти к исполнителю →"
                    onMouseEnter={() => setHoverChainAss(true)}
                    onMouseLeave={() => setHoverChainAss(false)}
                  >
                    →
                  </div>

                  {showAssChain && (
                    <div
                      className="quickmenu-sub level-3"
                      onMouseEnter={() => setHoverChainAss(true)}
                      onMouseLeave={() => setHoverChainAss(false)}
                    >
                      <div className="qm-col-list">
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

                      {/* → Сложность (lvl4, narrow) */}
                      <div
                        className="qm-next-col"
                        title="Перейти к сложности →"
                        onMouseEnter={() => setHoverChainDiff(true)}
                        onMouseLeave={() => setHoverChainDiff(false)}
                      >
                        →
                      </div>

                      {showDiffChain && (
                        <div
                          className="quickmenu-sub level-4 narrow"
                          onMouseEnter={() => setHoverChainDiff(true)}
                          onMouseLeave={() => setHoverChainDiff(false)}
                        >
                          <div className="qm-col-list narrow">
                            {DIFFICULTY.map(d => (
                              <div
                                key={d}
                                className={'quickmenu-subitem ' + (pickedDiff === d ? 'is-picked' : '')}
                                onMouseEnter={() => onPickDiff(d)}
                                onClick={() => onPickDiff(d)}
                              >
                                {d}
                              </div>
                            ))}

                            <div className="quickmenu-sep" />
                            <div className="quickmenu-subfoot">
                              <span className="qm-foot-spacer" />
                              <button
                                className="qm-link danger"
                                onClick={onCancelDiff}
                                onMouseEnter={enter('cancelDiff')}
                                onMouseLeave={leave('cancelDiff', onCancelDiff)}
                              >
                                ❌ Отмена
                              </button>
                            </div>
                          </div>

                          {/* → Тип (lvl5, narrow) */}
                          <div
                            className="qm-next-col"
                            title="Перейти к типу →"
                            onMouseEnter={() => setHoverChainType(true)}
                            onMouseLeave={() => setHoverChainType(false)}
                          >
                            →
                          </div>

                          {showTypeChain && (
                            <div
                              className="quickmenu-sub level-5 narrow"
                              onMouseEnter={() => setHoverChainType(true)}
                              onMouseLeave={() => setHoverChainType(false)}
                            >
                              <div className="qm-col-list narrow">
                                {TYPES.map(t => (
                                  <div
                                    key={t}
                                    className={'quickmenu-subitem ' + (pickedType === t ? 'is-picked' : '')}
                                    onMouseEnter={() => onPickType(t)}
                                    onClick={() => onPickType(t)}
                                  >
                                    {t}
                                  </div>
                                ))}
                                <div className="quickmenu-sep" />
                                <div className="quickmenu-subfoot">
                                  <span className="qm-foot-spacer" />
                                  <button
                                    className="qm-link danger"
                                    onClick={onCancelType}
                                    onMouseEnter={enter('cancelType')}
                                    onMouseLeave={leave('cancelType', onCancelType)}
                                  >
                                    ❌ Отмена
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* центральные ярлыки можно оставить/убрать */}
     




{/* центральные ярлыки */}
<div
  className={condItemClass}
  onMouseEnter={() => setHoverMain('conditions')}
  onMouseLeave={() => setHoverMain(null)}
>
  Условия
</div>

<div
  className={assItemClass}
  onMouseEnter={() => setHoverMain('assignee')}
  onMouseLeave={() => setHoverMain(null)}
>
  Исполнитель
</div>

<div
  className={diffItemClass}
  onMouseEnter={() => setHoverMain('difficulty')}
  onMouseLeave={() => setHoverMain(null)}
>
  Сложность
</div>

<div
  className={typeItemClass}
  onMouseEnter={() => setHoverMain('type')}
  onMouseLeave={() => setHoverMain(null)}
>
  Тип
</div>





      </div>
    </div>
  );
}
