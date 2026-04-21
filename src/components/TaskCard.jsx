import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, Tag, ChevronDown, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import './TaskCard.css';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'red' },
  high:   { label: 'High',   color: 'yellow' },
  medium: { label: 'Medium', color: 'blue' },
  low:    { label: 'Low',    color: 'muted' },
};

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do',       icon: <Clock size={13} /> },
  { value: 'in-progress', label: 'In Progress',  icon: <RefreshCw size={13} /> },
  { value: 'completed',   label: 'Completed',    icon: <CheckCircle size={13} /> },
];

function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diff = d - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const str = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { str, overdue: days < 0, soon: days >= 0 && days <= 2 };
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, deleting }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const due = formatDate(task.dueDate);

  return (
    <div className={`task-card task-card--${task.status} ${deleting ? 'task-card--deleting' : ''}`}>
      <div className="task-card-left">
        {/* Status indicator */}
        <button
          className={`task-status-dot task-status-dot--${task.status}`}
          onClick={() => {
            const next = task.status === 'todo' ? 'in-progress'
              : task.status === 'in-progress' ? 'completed' : 'todo';
            onStatusChange(next);
          }}
          title="Click to cycle status"
        />
      </div>

      <div className="task-card-body">
        <div className="task-card-row">
          <h3 className={`task-title ${task.status === 'completed' ? 'task-title--done' : ''}`}>
            {task.title}
          </h3>
          <div className="task-badges">
            <span className={`badge badge--${pri.color}`}>{pri.label}</span>
          </div>
        </div>

        {task.description && (
          <p className="task-desc">{task.description}</p>
        )}

        <div className="task-meta">
          {task.category && task.category !== 'General' && (
            <span className="task-meta-item">
              <Tag size={11} /> {task.category}
            </span>
          )}
          {due && (
            <span className={`task-meta-item ${due.overdue ? 'overdue' : due.soon ? 'due-soon' : ''}`}>
              <Calendar size={11} /> {due.str}
              {due.overdue && ' · Overdue'}
              {!due.overdue && due.soon && ' · Soon'}
            </span>
          )}
          <div className="status-select-wrap">
            <button
              className={`status-select-btn status-select-btn--${task.status}`}
              onClick={() => setStatusOpen(!statusOpen)}
            >
              {STATUS_OPTIONS.find(s => s.value === task.status)?.icon}
              {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
              <ChevronDown size={11} />
            </button>
            {statusOpen && (
              <div className="status-dropdown">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    className={`status-dropdown-item ${task.status === s.value ? 'active' : ''}`}
                    onClick={() => { onStatusChange(s.value); setStatusOpen(false); }}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="task-card-actions">
        <button className="task-action-btn" onClick={onEdit} title="Edit">
          <Edit2 size={14} />
        </button>
        <button className="task-action-btn task-action-btn--danger" onClick={onDelete} title="Delete" disabled={deleting}>
          {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}
