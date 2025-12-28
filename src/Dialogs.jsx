import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Edit, X, Calendar, Share2, Check, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useData } from './App';

// Change 'App' to 'Dialogs' and add { order, onClose }
const Dialogs = ({ order, onClose, onEdit }) => {
  // 1. Local state for UI only
  const [showPicker, setShowPicker] = useState(false);
  const [notedDate] = useState(new Date(order.createdAt));
  const [deadline, setDeadline] = useState(new Date());
  const { updateOrder, toggleItemHighlight } = useData();
  // Picker state
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [ampm, setAmpm] = useState('PM');
  const items = order.items.map(item => ({
    name: item.itemName,
    qty: `${item.quantity} ${item.unitType}`
  }));
  // Update Dialogs.jsx props to include onEdit
const Dialogs = ({ order, onClose, onEdit }) => {
  if (!order) return null; //
  const [showPicker, setShowPicker] = useState(false);
  const [notedDate] = useState(new Date(order.createdAt));
  const [deadline, setDeadline] = useState(order.deadline ? new Date(order.deadline) : new Date());

  return (
    // ... inside the Items List Header
    <button 
      onClick={() => onEdit(order)} // Trigger the edit function from App.jsx
      className="text-emerald-600 hover:text-emerald-800"
    >
      <Edit size={14} />
    </button>
  );
};
const getUrgencyColor = () => {
  if (!order.deadline) return 'text-emerald-600'; // Default safe color
  
  const targetDate = new Date(order.deadline);
  const diffHours = (targetDate - notedDate) / (1000 * 60 * 60);
  if (diffHours <= 2) return 'text-rose-600 animate-pulse';
  if (diffHours <= 6) return 'text-orange-500';
  return 'text-emerald-600';
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' |');
};

const handleConfirmDeadline = () => {
  const newDeadline = new Date(tempDate);
  let h = parseInt(selectedHour);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  newDeadline.setHours(h, parseInt(selectedMinute), 0, 0);

  // This triggers a re-render in App.jsx, which flows back into this Dialog
  updateOrder({ 
    ...order, 
    deadline: newDeadline.toISOString() 
  });

  setShowPicker(false);
};

const handleShare = () => {
  // Format the items list
  const itemsText = order.items
    .map(item => `• ${item.itemName} - *${item.quantity} ${item.unitType}*`)
    .join('%0A'); // URL encoded newline

  // Build the message
  const shareMessage = 
`*${order.customerName}*%0A${formatDateTime(order.createdAt)}%0A__________________________%0A%0A${itemsText}`;

  // Open WhatsApp directly
  window.open(`https://wa.me/?text=${shareMessage}`, '_blank');
};

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Main Container with reduced corner radius (rounded-2xl) */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 max-h-[90vh] flex flex-col">
        
        {/* Header Section */}
        <div className="p-6 pb-2 border-b border-slate-50 rounded-t-2xl bg-white">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-black">{order.customerName}</h2>
            <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
                <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col text-sm">
            <span className="text-slate-500 font-medium">Noted: {formatDateTime(notedDate)}</span>
            {/* Check order.deadline directly for instant updates */}
            {order.deadline && (
                <span className={`font-semibold ${getUrgencyColor()}`}>
                Deadline: {formatDateTime(order.deadline)}
                </span>
            )}
            </div>
        </div>

        {/* Item List Container */}
<div className="flex-1 flex flex-col min-h-0">
  <div className="px-6 py-2 flex items-center justify-between bg-slate-50 border-y border-slate-100">
    <div className="flex-1 flex justify-between pr-8">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</span>
    </div>
    <button 
      onClick={() => { onEdit(order); onClose(); }} 
      className="text-emerald-600 hover:text-emerald-800"
    >
      <Edit size={14} />
    </button>
  </div>
  
  <div className="overflow-y-auto px-6 py-1 flex-1 no-scrollbar max-h-[40vh]">
    <div className="divide-y divide-slate-100">
      {/* Use order.items directly to see state changes immediately */}
      {order.items.map((item, idx) => (
        <div 
          key={`item-${idx}`} 
          onClick={() => toggleItemHighlight(order.id, idx)}
          className={`flex justify-between items-center py-2.5 px-3 -mx-3 cursor-pointer transition-colors rounded-lg ${
            item.isHighlighted ? 'bg-emerald-100/70' : 'hover:bg-slate-50'
          }`}
        >
          <span className={`font-semibold text-sm ${item.isHighlighted ? 'text-emerald-900' : 'text-slate-800'}`}>
            {item.itemName}
          </span>
          <span className={`text-[12px] font-medium ${item.isHighlighted ? 'text-emerald-700' : 'text-slate-500'}`}>
            {item.quantity} {item.unitType}
          </span>
        </div>
      ))}
    </div>
  </div>
</div>

        {/* Floating Picker Popover - Center aligned with reduced rounding */}
        {showPicker && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 p-4 z-[100] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 w-fit">
            <div className="flex flex-row gap-4 items-start">
              
              {/* Left Column: Calendar (200px) */}
              <div className="w-[200px] shrink-0">
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-tight">Dec 2025</span>
                  <div className="flex gap-2 text-slate-400">
                    <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={14} /></button>
                    <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center font-bold text-slate-400 mb-1">
                  {['S','M','T','W','T','F','S'].map((day, idx) => (
                    <div key={`day-h-${idx}`}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center">
                  {Array.from({length: 31}, (_, i) => (
                    <div 
                      key={`day-${i}`} 
                      onClick={() => {
                        const d = new Date(tempDate);
                        d.setDate(i+1);
                        setTempDate(d);
                      }}
                      className={`py-1.5 rounded-lg cursor-pointer transition-all font-bold ${tempDate.getDate() === i+1 ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-emerald-50 text-slate-700'}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Time Selection (150px) */}
              <div className="flex flex-col gap-2 w-[150px] shrink-0">
                <div className="relative flex items-center bg-slate-50 rounded-xl p-1 h-[140px] overflow-hidden border border-slate-100 shadow-inner">
                  {/* Unified Selection Bar spanning all wheels */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-emerald-500/10 border-y border-emerald-500/20 pointer-events-none z-0" />
                  
                  <Wheel id="hr" options={Array.from({length: 12}, (_, i) => i + 1)} selected={selectedHour} onSelect={setSelectedHour} containerHeight={140} fontSize="text-sm" itemHeight={32} />
                  <div className="text-emerald-600 font-bold text-sm z-10 mx-0.5">:</div>
                  <Wheel id="min" options={Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'))} selected={selectedMinute.toString().padStart(2, '0')} onSelect={(val) => setSelectedMinute(parseInt(val))} containerHeight={140} fontSize="text-sm" itemHeight={32} />
                  <Wheel id="ampm" options={['AM', 'PM']} selected={ampm} onSelect={setAmpm} containerHeight={140} fontSize="text-[10px]" itemHeight={32} />
                </div>

                <button 
                  onClick={handleConfirmDeadline}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg flex flex-col items-center justify-center hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
                >
                  <Check size={18} strokeWidth={3} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-white flex gap-3 rounded-b-2xl">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={`flex-1 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
              showPicker 
                ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-inner' 
                : 'bg-white border-emerald-500 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Calendar size={18} />
            Deadline
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
            <Share2 size={18} className="text-emerald-400" />
            WhatsApp
            </button>
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const Wheel = ({ id, options, selected, onSelect, containerHeight, fontSize = "text-lg", itemHeight = 40 }) => {
  const containerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  useEffect(() => {
    if (containerRef.current && !isScrolling) {
      const selectedIndex = options.findIndex(opt => String(opt) === String(selected));
      if (selectedIndex !== -1) {
        containerRef.current.scrollTop = selectedIndex * itemHeight;
      }
    }
  }, [selected, options, isScrolling, itemHeight]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    setIsScrolling(true);
    const centerPosition = containerRef.current.scrollTop + (itemHeight / 2);
    const index = Math.floor(centerPosition / itemHeight);
    const safeIndex = Math.max(0, Math.min(index, options.length - 1));
    const newSelected = options[safeIndex];
    if (String(newSelected) !== String(selected)) onSelect(newSelected);
    clearTimeout(containerRef.current.scrollTimeout);
    containerRef.current.scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
  }, [options, selected, onSelect, itemHeight]);

  const verticalPadding = (containerHeight - itemHeight) / 2;

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar z-10 scroll-smooth">
      <div style={{ paddingTop: verticalPadding, paddingBottom: verticalPadding }}>
        {options.map((opt, idx) => (
          <div
            key={`${id}-${idx}`}
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollTop = idx * itemHeight;
                onSelect(opt);
              }
            }}
            style={{ height: itemHeight }}
            className={`flex items-center justify-center snap-center cursor-pointer transition-all duration-200 ${fontSize} ${
              String(selected) === String(opt) ? 'text-emerald-600 font-bold scale-110' : 'text-slate-300 opacity-40 font-medium'
            }`}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dialogs;