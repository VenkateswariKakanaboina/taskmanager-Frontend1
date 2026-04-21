import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, CheckSquare, LogOut, User,
  BarChart2, Clock, CheckCircle, AlertTriangle, Trash2,
  RefreshCw, ChevronDown, X, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import './Dashboard.css';

const STATUSES = [
  { key: 'all', label: 'All Tasks', icon: <BarChart2 size={14} /> },
  { key: 'todo', label: 'To Do', icon: <Clock size={14} /> },
  { key: 'in-progress', label: 'In Progress', icon: <RefreshCw size={14} /> },
  { key: 'completed', label: 'Completed', icon: <CheckCircle size={14} /> },
];

const PRIORITIES = ['all', 'urgent', 'high', 'medium', 'low'];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { toasts, success, error } = useToast();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [activePriority, setActivePriority] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeStatus !== 'all') params.status = activeStatus;
      if (activePriority !== 'all') params.priority = activePriority;
      if (search) params.search = search;
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks);
      setStats(data.stats);
    } catch (e) {
      error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, activePriority, search]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleCreateTask = async (data) => {
    try {
      await tasksAPI.create(data);
      success('Task created!');
      setShowModal(false);
      fetchTasks();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (id, data) => {
    try {
      await tasksAPI.update(id, data);
      success('Task updated!');
      setEditTask(null);
      fetchTasks();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await tasksAPI.updateStatus(id, status);
      success(`Moved to ${status.replace('-', ' ')}`);
      fetchTasks();
    } catch (e) {
      error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await tasksAPI.delete(id);
      success('Task deleted');
      fetchTasks();
    } catch (e) {
      error('Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  const completionPct = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="dashboard">
      <ToastContainer toasts={toasts} />

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><CheckSquare size={20} /></div>
            <span>TaskFlow</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="sidebar-stats">
          <div className="progress-ring-wrap">
            <svg viewBox="0 0 64 64" className="progress-ring">
              <circle cx="32" cy="32" r="27" />
              <circle
                cx="32" cy="32" r="27"
                className="progress-ring-fill"
                strokeDasharray={`${completionPct * 1.696} 169.6`}
              />
            </svg>
            <span className="progress-pct">{completionPct}%</span>
          </div>
          <div className="sidebar-stat-info">
            <div className="sidebar-stat-label">Completion rate</div>
            <div className="sidebar-stat-sub">{stats.completed || 0} of {stats.total || 0} done</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Filter by status</div>
          {STATUSES.map((s) => (
            <button
              key={s.key}
              className={`sidebar-nav-item ${activeStatus === s.key ? 'active' : ''}`}
              onClick={() => { setActiveStatus(s.key); setSidebarOpen(false); }}
            >
              <span className="sidebar-nav-icon">{s.icon}</span>
              <span>{s.label}</span>
              <span className="sidebar-nav-count">
                {s.key === 'all' ? stats.total || 0
                  : s.key === 'todo' ? stats.todo || 0
                  : s.key === 'in-progress' ? stats.inProgress || 0
                  : stats.completed || 0}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Filter by priority</div>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={`sidebar-nav-item ${activePriority === p ? 'active' : ''}`}
              onClick={() => { setActivePriority(p); setSidebarOpen(false); }}
            >
              {p !== 'all' && <span className={`priority-dot priority-dot--${p}`} />}
              <span style={{ textTransform: 'capitalize' }}>{p === 'all' ? 'All Priorities' : p}</span>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content ─────────────────────────────── */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="topbar-title">
              <h2>
                {activeStatus === 'all' ? 'All Tasks' : STATUSES.find(s => s.key === activeStatus)?.label}
              </h2>
              <span className="topbar-count">{tasks.length} tasks</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button className="search-clear" onClick={() => setSearchInput('')}>
                  <X size={13} />
                </button>
              )}
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Task
            </button>

            <div className="user-menu-wrap">
              <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="user-avatar">{getInitials(user?.name)}</div>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-info">
                    <div className="user-dropdown-name">{user?.name}</div>
                    <div className="user-dropdown-email">{user?.email}</div>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item" onClick={logout}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Stat Cards */}
        <div className="stat-cards">
          {[
            { label: 'Total', value: stats.total || 0, color: 'accent', icon: <BarChart2 size={18} /> },
            { label: 'To Do', value: stats.todo || 0, color: 'yellow', icon: <Clock size={18} /> },
            { label: 'In Progress', value: stats.inProgress || 0, color: 'blue', icon: <RefreshCw size={18} /> },
            { label: 'Completed', value: stats.completed || 0, color: 'green', icon: <CheckCircle size={18} /> },
          ].map((s) => (
            <div key={s.label} className={`stat-card stat-card--${s.color}`}>
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Task List */}
        <div className="task-section">
          {loading ? (
            <div className="loading-state">
              <span className="spinner" style={{ width: 32, height: 32 }} />
              <p>Loading tasks…</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <CheckSquare size={48} />
              <h3>No tasks found</h3>
              <p>
                {search ? `No results for "${search}"` : 'Create your first task to get started'}
              </p>
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowModal(true)}>
                <Plus size={15} /> New Task
              </button>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={() => setEditTask(task)}
                  onDelete={() => handleDelete(task._id)}
                  onStatusChange={(status) => handleStatusChange(task._id, status)}
                  deleting={deletingId === task._id}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <TaskModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateTask}
          title="Create New Task"
        />
      )}
      {editTask && (
        <TaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSubmit={(data) => handleUpdateTask(editTask._id, data)}
          title="Edit Task"
        />
      )}
    </div>
  );
}
