// src/page/CalendarPage.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ru from 'date-fns/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { loadFlow, saveFlow } from '../service/storage';
import '../companet/calendar.css';

const locales = { ru };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

function colorForStatus(task, fallback = '#fcf9e9') {
  const st = task?.data?.status;
  if (st === 'working') return '#2196F3';
  if (st === 'done')    return '#8BC34A';
  if (st === 'cancel')  return '#F44336';
  if (st === 'frozen')  return '#B0BEC5';
  return task?.data?.color || fallback;
}

export default function CalendarPage() {
  const { groupId = 'default' } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const focusTaskId = search.get('task') || '';

  // === store ===
  const initial = useMemo(() => loadFlow(groupId), [groupId]);
  const [nodes, setNodes]   = useState(initial.nodes || []);
  const [edges]             = useState(initial.edges || []);
  const [stages]            = useState(initial.stages || []);
  const [events, setEvents] = useState(initial.events || []);


useEffect(() => {
  const prev = loadFlow(groupId);
  const budgets = Array.isArray(prev?.budgets) ? prev.budgets : [];
  saveFlow(groupId, { nodes, edges, stages, events, budgets });
}, [groupId, nodes, edges, stages, events]);



  // === calendar control ===
  const defaultDate = useMemo(() => {
    if (!focusTaskId) return new Date();
    const ev = events.find(e => e.taskId === focusTaskId);
    return ev?.start ? new Date(ev.start) : new Date();
  }, [events, focusTaskId]);

  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(defaultDate);
  useEffect(() => { setDate(defaultDate); }, [defaultDate]);

  // === rbc events ===
  const rbcEvents = useMemo(() =>
    (events || []).map(e => {
      const task = nodes.find(n => n.id === e.taskId);
      return {
        id: e.id || e.taskId,
        title: task?.data?.label || 'Задача',
        start: new Date(e.start),
        end:   new Date(e.end),
        allDay: false,
        resource: { taskId: e.taskId },
      };
    }),
  [events, nodes]);

  const eventPropGetter = (event) => {
    const task = nodes.find(n => n.id === event.resource?.taskId);
    const selected = event.resource?.taskId === focusTaskId;
    return {
      style: {
        backgroundColor: colorForStatus(task),
        border: '1px solid rgba(0,0,0,.15)',
        color: '#0f172a',
        // лёгкий акцент выбранному (поверх — ещё рамка в спотлайте)
        boxShadow: selected ? '0 0 0 2px rgba(96,165,250,.35)' : undefined,
      },
      className: selected ? 'cal-ev cal-ev--selected' : 'cal-ev',
    };
  };

  // автоскролл к выбранному событию (после рендера)
  useEffect(() => {
    if (!focusTaskId) return;
    const t = setTimeout(() => {
      const inner = document.querySelector(`.calendar-event[data-task-id="${focusTaskId}"]`);
      const outer = inner?.closest('.rbc-event') || inner;
      outer?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
    return () => clearTimeout(t);
  }, [focusTaskId, rbcEvents, view, date]);

  // снять фокус (= убрать ?task)
  const clearFocus = useCallback(() => {
    navigate(`/groups/${groupId}/calendar`, { replace: true });
  }, [groupId, navigate]);

  // === modal state ===
  const [pickerOpen, setPickerOpen] = useState(false);
  const [slotRange, setSlotRange]   = useState({ start: null, end: null });
  const [query, setQuery]           = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [newTitle, setNewTitle]     = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = nodes || [];
    if (!q) return list;
    return list.filter(n => (n.data?.label || '').toLowerCase().includes(q));
  }, [nodes, query]);

  const openPicker = (start, end) => {
    setSlotRange({ start, end });
    setQuery(''); setSelectedTaskId(''); setNewTitle('');
    setPickerOpen(true);
  };
  const closePicker = () => setPickerOpen(false);

  const onSelectSlot = ({ start, end }) => {
    if (focusTaskId) { attachEvent(focusTaskId, start, end); return; }
    openPicker(start, end);
  };

  const goToCard = (taskId) => navigate(`/groups/${groupId}?task=${taskId}`);

  const onEventDrop   = ({ event, start, end }) => { const id = event.resource?.taskId; if (id) attachEvent(id, start, end); };
  const onEventResize = ({ event, start, end }) => { const id = event.resource?.taskId; if (id) attachEvent(id, start, end); };

  function attachEvent(taskId, start, end) {
    setEvents(prev => {
      const other = prev.filter(e => e.taskId !== taskId);
      return [...other, { id: taskId, taskId, start, end }];
    });
    setNodes(prev => prev.map(n => n.id === taskId ? ({ ...n, data:{ ...n.data, calendar:{ start, end } } }) : n));
    closePicker();
  }
  const removeEvent = (taskId) => {
    setEvents(prev => prev.filter(e => e.taskId !== taskId));
    setNodes(prev => prev.map(n => n.id === taskId ? ({ ...n, data:{ ...n.data, calendar:null } }) : n));
  };

  const EventItem = ({ event }) => {
    const taskId = event.resource?.taskId;
    return (
      <div className="calendar-event"
           data-task-id={taskId}
           style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span
          style={{ cursor:'pointer', textDecoration:'underline' }}
          title="Открыть карточку на схеме"
          onClick={(e) => { e.stopPropagation(); goToCard(taskId); }}
        >
          {event.title}
        </span>
        <span style={{ display:'flex', gap:6 }}>
          <button
            title="Открыть на схеме"
            onClick={(e) => { e.stopPropagation(); goToCard(taskId); }}
            style={{ background:'transparent', border:'none', cursor:'pointer' }}
          >↗</button>
          <button
            title="Удалить событие"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Удалить привязку события «${event.title}»?`)) removeEvent(taskId);
            }}
            style={{ background:'transparent', border:'none', cursor:'pointer' }}
          >🗑</button>
        </span>
      </div>
    );
  };

  const createAndAttach = () => {
    const title = newTitle.trim();
    if (!title || !slotRange.start || !slotRange.end) return;
    const newNode = makeNode(title, groupId);
    setNodes(prev => [...prev, newNode]);
    attachEvent(newNode.id, slotRange.start, slotRange.end);
  };
  const attachSelected = () => {
    if (!selectedTaskId || !slotRange.start || !slotRange.end) return;
    attachEvent(selectedTaskId, slotRange.start, slotRange.end);
  };

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px' }}>
        <button onClick={() => navigate(`/groups/${groupId}`)}>⟵ К схеме</button>
        <div style={{ fontWeight:600, opacity:.75 }}>Календарь — группа: {groupId}</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={() => navigate(`/groups/${groupId}/kanban`)}>🧮 Канбан</button>
        </div>
      </div>

      <DndProvider backend={HTML5Backend}>
        <DnDCalendar
          localizer={localizer}
          selectable
          views={{ month: true, week: true, day: true, agenda: true }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          step={30}
          timeslots={2}
          style={{ height:'100%' }}
          events={rbcEvents}
          eventPropGetter={eventPropGetter}
          onSelectSlot={onSelectSlot}
          resizable
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          longPressThreshold={250}
          popup
          components={{ event: EventItem }}
        />
      </DndProvider>

      {/* ——— Spotlight поверх календаря ——— */}
      {!!focusTaskId && (
        <FocusSpotlight
          taskId={focusTaskId}
          onClose={clearFocus}
          deps={[view, date, rbcEvents.length]}
        />
      )}

      {/* === Modal: выбрать/создать задачу === */}
      {pickerOpen && (
        <div
          style={{
            position:'fixed', inset:0, background:'rgba(2,6,23,.45)',
            display:'grid', placeItems:'center', zIndex:50
          }}
          onClick={closePicker}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:'min(720px, 95vw)', background:'#fff', border:'1px solid #e5e7eb',
              borderRadius:12, boxShadow:'0 30px 80px rgba(2,6,23,.35)', padding:16
            }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0 }}>Привязать к задаче</h3>
              <button onClick={closePicker} title="Закрыть" style={{ border:'1px solid #e5e7eb', borderRadius:8 }}>✖</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {/* Список задач */}
              <div>
                <div style={{ marginBottom:8, fontWeight:600, opacity:.75 }}>Выбрать из существующих</div>
                <input
                  placeholder="Поиск по названию…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8 }}
                />
                <div style={{ maxHeight:260, overflow:'auto', border:'1px solid #f1f5f9', borderRadius:8 }}>
                  {filtered.map(n => (
                    <label key={n.id} style={{
                      display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                      borderBottom:'1px solid #f8fafc', cursor:'pointer'
                    }}>
                      <input
                        type="radio"
                        name="task"
                        checked={selectedTaskId === n.id}
                        onChange={() => setSelectedTaskId(n.id)}
                      />
                      <span style={{ fontWeight:600 }}>{n.data?.label || 'Без названия'}</span>
                      <span style={{ fontSize:12, opacity:.7, marginLeft:'auto' }}>{n.data?.status || 'pending'}</span>
                    </label>
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ padding:12, opacity:.6 }}>Нет задач по фильтру</div>
                  )}
                </div>
                <div style={{ marginTop:8, display:'flex', gap:8 }}>
                  <button
                    className="btn btn--primary"
                    onClick={attachSelected}
                    disabled={!selectedTaskId || !slotRange.start || !slotRange.end}
                    style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#4f46e5', color:'#fff' }}
                  >
                    Привязать выбранную
                  </button>
                </div>
              </div>

              {/* Создать новую */}
              <div>
                <div style={{ marginBottom:8, fontWeight:600, opacity:.75 }}>Создать новую задачу</div>
                <input
                  placeholder="Название новой задачи"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8 }}
                />
                <div style={{ fontSize:12, opacity:.75, marginBottom:8 }}>
                  Диапазон: {slotRange.start ? format(slotRange.start, 'dd.MM.yyyy HH:mm') : '—'} — {slotRange.end ? format(slotRange.end, 'dd.MM.yyyy HH:mm') : '—'}
                </div>
                <button
                  onClick={createAndAttach}
                  disabled={!newTitle.trim() || !slotRange.start || !slotRange.end}
                  style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#10b981', color:'#fff' }}
                >
                  Создать и привязать
                </button>
              </div>
            </div>

            <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
              <button onClick={closePicker} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#f3f4f6' }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ——— “дырявый” спотлайт вокруг события календаря ———
function FocusSpotlight({ taskId, onClose, deps = [] }) {
  const [rect, setRect] = useState(null);

  const compute = useCallback(() => {
    if (!taskId) { setRect(null); return; }
    const inner = document.querySelector(`.calendar-event[data-task-id="${taskId}"]`);
    if (!inner) { setRect(null); return; }
    const outer = inner.closest('.rbc-event') || inner;
    const r = outer.getBoundingClientRect();
    setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [taskId]);

  useEffect(() => {
    // первичный расчёт + после макета
    compute();
    const raf = requestAnimationFrame(compute);
    const t = setTimeout(compute, 50);

    // ресайз окна
    const onResize = () => compute();
    window.addEventListener('resize', onResize);

    // скролл внутри календаря
    const scrollers = Array.from(document.querySelectorAll('.rbc-time-content, .rbc-month-view, .rbc-agenda-view'));
    scrollers.forEach(s => s.addEventListener('scroll', onResize, { passive: true }));

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      scrollers.forEach(s => s.removeEventListener('scroll', onResize));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compute, taskId, ...deps]);

  if (!rect) return null;

  const pad = 10;
  const x = Math.max(0, rect.x - pad);
  const y = Math.max(0, rect.y - pad);
  const w = rect.w + pad * 2;
  const h = rect.h + pad * 2;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const dim = { position:'fixed', background:'rgba(2,6,23,.55)', zIndex: 9999 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'auto' }}>
      {/* 4 тёмных зоны */}
      <div onClick={onClose} style={{ ...dim, left:0, top:0, width:'100vw', height:y }} />
      <div onClick={onClose} style={{ ...dim, left:0, top:y+h, width:'100vw', height: Math.max(0, vh - (y+h)) }} />
      <div onClick={onClose} style={{ ...dim, left:0, top:y, width:x, height:h }} />
      <div onClick={onClose} style={{ ...dim, left:x+w, top:y, width: Math.max(0, vw - (x+w)), height:h }} />

      {/* подсветка рамкой */}
      <div
        style={{
          position:'fixed',
          left:x, top:y, width:w, height:h,
          border:'2px solid #60a5fa',
          borderRadius:12,
          boxShadow:'0 0 0 6px rgba(96,165,250,.25)',
          zIndex:10000,
          pointerEvents:'none'
        }}
      />
      {/* кликабельная “дырка”, чтобы тоже закрывать */}
      <button
        onClick={onClose}
        title="Снять фокус"
        style={{
          position:'fixed', left:x, top:y, width:w, height:h,
          background:'transparent', border:'none', zIndex:10001, cursor:'default'
        }}
      />
    </div>
  );
}

// ——— helpers ———
function makeNode(title, groupId) {
  return {
    id: crypto.randomUUID(),
    type: 'card',
    position: { x: 120, y: 120 },
    data: {
      label: title || 'Новая карточка',
      color: '#fcf9e9',
      rule: '',
      cancelPolicy: { enabled: false, mode: 'none' },
      selectedDeps: [], cancelSelectedDeps: [], overdue: false,
      status: 'pending', initials: '', avatarUrl: '',
      difficulty: 0, taskType: '', description: '',
      showIcon: false,
      group: groupId || '',
      groupId,
      stage: 'backlog',
      calendar: null,
    },
  };
}
