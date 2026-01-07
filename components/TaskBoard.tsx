
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle2, Circle, Clock, Plus, Trash2, MessageSquareWarning } from 'lucide-react';
import FeedbackPopover from './FeedbackPopover';

interface TaskBoardProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
  reviewMode?: boolean;
  onAddFeedback?: (targetId: string, type: 'task', title: string, content: string) => void;
}

const Column: React.FC<{
  title: string; status: TaskStatus; tasks: Task[];
  onMoveTask: (id: string, s: TaskStatus) => void; onDelete: (id: string) => void; onAdd: () => void;
  reviewMode?: boolean; onAddFeedback?: (id: string, t: 'task', title: string, c: string) => void;
}> = ({ title, status, tasks, onMoveTask, onDelete, onAdd, reviewMode, onAddFeedback }) => {
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  const getStatusColor = () => {
      switch(status) {
          case TaskStatus.DONE: return 'text-emerald-400 bg-emerald-400/10';
          case TaskStatus.IN_PROGRESS: return 'text-warm-blue bg-warm-blue/10';
          default: return 'text-gray-400 bg-gray-400/10';
      }
  };

  return (
    <div className="flex-1 min-w-[320px] bg-white/5 border border-white/5 flex flex-col h-full shrink-0 rounded-[2.5rem] relative overflow-hidden">
      <div className="p-8 flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-3">
            <h3 className="font-heading font-bold text-xl text-white tracking-tight">
            {title}
            </h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getStatusColor()}`}>
                {tasks.length}
            </span>
        </div>
        <button onClick={onAdd} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
        {tasks.map(task => (
          <div key={task.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all duration-300 relative group shadow-sm hover:shadow-soft">
            {activeFeedbackId === task.id && (
              <FeedbackPopover targetTitle={task.title} onClose={() => setActiveFeedbackId(null)} onSubmit={(t) => onAddFeedback?.(task.id, 'task', task.title, t)} />
            )}
            
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-white text-lg leading-tight pr-8">{task.title}</h4>
              <div className="flex gap-2">
                {reviewMode && <button onClick={() => setActiveFeedbackId(task.id)} className="text-yellow-400 hover:text-yellow-300 transition-colors"><MessageSquareWarning className="w-4 h-4" /></button>}
                <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-warm-rose transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            {task.description && <p className="text-sm text-gray-400 mb-6 leading-relaxed line-clamp-3">{task.description}</p>}
            
            <div className="flex flex-wrap gap-2">
               {status !== TaskStatus.TODO && <button onClick={() => onMoveTask(task.id, TaskStatus.TODO)} className="text-xs font-semibold px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">Queue</button>}
               {status !== TaskStatus.IN_PROGRESS && <button onClick={() => onMoveTask(task.id, TaskStatus.IN_PROGRESS)} className="text-xs font-semibold px-4 py-2 bg-warm-blue/10 hover:bg-warm-blue/20 rounded-xl text-warm-blue transition-all">Active</button>}
               {status !== TaskStatus.DONE && <button onClick={() => onMoveTask(task.id, TaskStatus.DONE)} className="text-xs font-semibold px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-emerald-400 transition-all">Complete</button>}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="h-40 flex items-center justify-center text-gray-600 font-medium text-sm border-2 border-dashed border-white/5 rounded-[2rem]">
            Quiet here...
          </div>
        )}
      </div>
    </div>
  );
};

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onMoveTask, onDeleteTask, onAddTask, reviewMode, onAddFeedback }) => {
  return (
    <div className="h-full flex overflow-x-auto gap-8 pb-12 pr-4 scrollbar-hide">
      <Column title="Ideas" status={TaskStatus.TODO} tasks={tasks.filter(t => t.status === TaskStatus.TODO)} onMoveTask={onMoveTask} onDelete={onDeleteTask} onAdd={() => onAddTask(TaskStatus.TODO)} reviewMode={reviewMode} onAddFeedback={onAddFeedback} />
      <Column title="In Flow" status={TaskStatus.IN_PROGRESS} tasks={tasks.filter(t => t.status === TaskStatus.IN_PROGRESS)} onMoveTask={onMoveTask} onDelete={onDeleteTask} onAdd={() => onAddTask(TaskStatus.IN_PROGRESS)} reviewMode={reviewMode} onAddFeedback={onAddFeedback} />
      <Column title="Completed" status={TaskStatus.DONE} tasks={tasks.filter(t => t.status === TaskStatus.DONE)} onMoveTask={onMoveTask} onDelete={onDeleteTask} onAdd={() => onAddTask(TaskStatus.DONE)} reviewMode={reviewMode} onAddFeedback={onAddFeedback} />
    </div>
  );
};

export default TaskBoard;
