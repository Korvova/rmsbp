// src/page/CalendarPage.jsx
import { useEffect, useMemo, useState } from 'react';
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

function CalendarPage() {
  const { groupId = 'default' } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const focusTaskId = search.get('task') || '';
  const initial = useMemo(() => loadFlow(groupId), [groupId]);

  const [nodes, setNodes]   = useState(initial.nodes || []);
  const [edges]             = useState(initial.edges || []);
  const [stages]            = useState(initial.stages || []);
  const [events, setEvents] = useState(initial.events || []);

  // сохраняем бандл группы
  useEffect(() => {
    saveFlow(groupId, { nodes, edges, stages, events });
  }, [groupId, nodes, edges, stages, events]);

  // куда смотреть по умолчанию (если пришли из карточки)
  const defaultDate = useMemo(() => {
    if (!focusTaskId) return new Date();
    const ev = events.find(e => e.taskId === focusTaskId);
    return ev?.start ? new Date(ev.start) : new Date();
  }, [events, focusTaskId]);





  const removeEvent = (taskId) => {
    setEvents(prev => prev.filter(e => e.taskId !== taskId));
    setNodes(prev => prev.map(n => n.id === taskId ? ({ ...n, data:{ ...n.data, calendar:null } }) : n));
  };

  const EventItem = ({ event }) => {
   const task = nodes.find(n => n.id === event.resource?.taskId);
    return (
      <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
        <span>{event.title}</span>
        <button
          title="Удалить событие"
         onClick={(e) => {
           e.stopPropagation();
           if (!task) return;
           const ok = confirm(`Удалить привязку события к задаче «${task.data?.label || 'Задача'}»?\nСобытие будет снято с календаря.`);
           if (ok) removeEvent(task.id);
         }}
          style={{ background:'transparent', border:'none', cursor:'pointer' }}
        >
          🗑
        </button>
      </div>
    );
  };










 // контролируемые состояние вида и даты
 const [view, setView] = useState(Views.WEEK);
 const [date, setDate] = useState(defaultDate);
 // если сместился defaultDate (например, пришли из карточки) — синхронизируем
 useEffect(() => { setDate(defaultDate); }, [defaultDate]);







  // преобразуем в формат RBC (Date объекты!)
  const rbcEvents = useMemo(() => {
    return (events || []).map(e => {
      const task = nodes.find(n => n.id === e.taskId);
      return {
        id: e.id || e.taskId,
        title: task?.data?.label || 'Задача',
        start: new Date(e.start),
        end:   new Date(e.end),
        allDay: false,
        resource: { taskId: e.taskId },
      };
    });
  }, [events, nodes]);

  // цвет по статусу на лету
  const eventPropGetter = (event) => {
    const task = nodes.find(n => n.id === event.resource?.taskId);
    const bg = colorForStatus(task);
    return {
      style: {
        backgroundColor: bg,
        border: '1px solid rgba(0,0,0,.15)',
        color: '#0f172a',
      }
    };
  };

  // выделение пустого слота — создать/привязать
  const onSelectSlot = ({ start, end }) => {
    if (focusTaskId) {
      attachEvent(focusTaskId, start, end);
      return;
    }
    const mode = window.prompt(
      'Создать новую задачу — введите название.\n' +
      'Или привязать к существующей — введите номер из списка:\n\n' +
      listForPrompt(nodes)
    );
    if (!mode) return;

    const idx = Number(mode);
    if (Number.isInteger(idx)) {
      const picked = nodeByIndex(nodes, idx);
      if (picked) attachEvent(picked.id, start, end);
      return;
    }

    const title = String(mode).trim();
    if (!title) return;
    const newNode = makeNode(title, groupId);
    setNodes(prev => [...prev, newNode]);
    attachEvent(newNode.id, start, end);
  };

  // клики по событию (удаление привязки)
  const onSelectEvent = (ev) => {
    const task = nodes.find(n => n.id === ev.resource?.taskId);
    const act = window.prompt(
      `Событие: ${task?.data?.label || ''}\n` +
      'Введите: delete — чтобы удалить привязку,\n' +
      'или оставьте пустым.'
    );
    if (act === 'delete') {
      setEvents(prev => prev.filter(e => e.taskId !== ev.resource?.taskId));
      setNodes(prev => prev.map(n =>
        n.id === ev.resource?.taskId ? ({ ...n, data:{ ...n.data, calendar:null } }) : n
      ));
    }
  };



  // перетаскивание/растягивание события
  const onEventDrop = ({ event, start, end }) => {
    const taskId = event.resource?.taskId;
    if (!taskId) return;
    attachEvent(taskId, start, end);
  };
  const onEventResize = ({ event, start, end }) => {
    const taskId = event.resource?.taskId;
    if (!taskId) return;
    attachEvent(taskId, start, end);
  };

  function attachEvent(taskId, start, end) {
    setEvents(prev => {
      const other = prev.filter(e => e.taskId !== taskId);
      return [...other, { id: taskId, taskId, start, end }];
    });
    setNodes(prev => prev.map(n => n.id === taskId
      ? ({ ...n, data:{ ...n.data, calendar:{ start, end } } })
      : n
    ));
  }

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateRows:'auto 1fr' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px' }}>
        <button onClick={() => navigate(`/groups/${groupId}`)}>⟵ К схеме</button>
        <div style={{ fontWeight:600, opacity:.75 }}>Календарь — группа: {groupId}</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={() => navigate(`/groups/${groupId}/kanban`)}>🧮 Канбан</button>
        </div>
      </div>

      {/* DnD контекст обязателен для перетаскивания/resize */}
      <DndProvider backend={HTML5Backend}>
        <DnDCalendar
          localizer={localizer}
          selectable
         


   views={{ month: true, week: true, day: true, agenda: true }}
   view={view}
   onView={(v) => setView(v)}
   date={date}
   onNavigate={(newDate /* Date */, _view, _action) => setDate(newDate)}





          step={30}
          timeslots={2}
          style={{ height:'100%' }}
     
          events={rbcEvents}
          eventPropGetter={eventPropGetter}
          onSelectSlot={onSelectSlot}
          onSelectEvent={onSelectEvent}
          resizable
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          longPressThreshold={250}
          popup
          components={{ event: EventItem }}

        />
      </DndProvider>
    </div>
  );
}

export default CalendarPage;

// ——— helpers ———
function nodeByIndex(nodes, idx) {
  const list = nodes.filter(Boolean);
  return list[idx - 1] || null;
}
function listForPrompt(nodes) {
  const list = nodes.slice(0, 10).map((n, i) => `${i+1}. ${n.data?.label || n.id}`);
  return list.length ? list.join('\n') : '(в этой группе ещё нет задач)';
}
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
