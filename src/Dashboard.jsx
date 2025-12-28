import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Users, Archive, ArrowRight, Clock, 
  ChevronDown, PencilLine, CheckCircle2, Truck, 
  ChevronUp, History, Trash2
} from 'lucide-react';
import { useData } from './App';

export default function Dashboard({ setPage, onClick, onEdit }) {
  const context = useData();
  if (!context) return null;

  const { customers = [], inventory = [], orders = [], updateOrder, deleteOrder } = context;
  
  // States
  const [showDelivered, setShowDelivered] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Refs for Scroll Logic
  const dropdownRef = useRef(null);
  const activeItemRef = useRef(null);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).replace(',', ' |');
  };

  // Logic to handle auto-scrolling when navigating with arrows
  useEffect(() => {
    if (showAreaMenu && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [focusedIndex, showAreaMenu]);

  const baseFilteredOrders = useMemo(() => {
    const today = new Date().toLocaleDateString();
    let list = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!showFullHistory) {
      list = list.filter(o => new Date(o.createdAt).toLocaleDateString() === today);
    }
    return list;
  }, [orders, showFullHistory]);

  const areaOptions = useMemo(() => {
    let visibleOrders = [...baseFilteredOrders];
    if (!showDelivered) {
      visibleOrders = visibleOrders.filter(o => !o.delivered);
    }
    const visibleCustomerNames = new Set(visibleOrders.map(o => o.customerName));
    const areas = customers
      .filter(c => visibleCustomerNames.has(c.name))
      .map(c => c.area)
      .filter(area => area && area.trim() !== '');
    
    return ['All Areas', ...new Set(areas)].sort();
  }, [baseFilteredOrders, showDelivered, customers]);
  
  useEffect(() => {
    if (selectedArea !== 'All Areas' && !areaOptions.includes(selectedArea)) {
      setSelectedArea('All Areas');
    }
  }, [areaOptions, selectedArea]);

  const filteredOrders = useMemo(() => {
    let list = [...baseFilteredOrders];
    if (selectedArea !== 'All Areas') {
      const customersInArea = new Set(
        customers.filter(c => c.area === selectedArea).map(c => c.name)
      );
      list = list.filter(o => customersInArea.has(o.customerName));
    }
    const pending = list.filter(o => !o.delivered);
    const delivered = list.filter(o => o.delivered);
    return { pending, delivered };
  }, [baseFilteredOrders, selectedArea, customers]);

  const handleStatusChange = (order, field, value) => {
    const updated = { ...order, [field]: value };
    if (field === 'delivered' && value) updated.taken = true;
    updateOrder(updated);
  };

  const getDeadlineColor = (deadline) => {
    if (!deadline) return 'text-slate-400';
    const diffHours = (new Date(deadline) - new Date()) / (1000 * 60 * 60);
    if (diffHours <= 0) return 'text-rose-500 font-black animate-pulse';
    if (diffHours <= 6) return 'text-orange-500';
    return 'text-emerald-500';
  };

  const NavCard = ({ title, desc, icon, color, href, fullWidth }) => (
    <div 
      onClick={() => setPage(href)}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', padding: 'clamp(0.75rem, 2.5vw, 1.5rem)' }}
      className={`${fullWidth ? 'col-span-2' : 'col-span-1'} rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md active:scale-95 group`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center shrink-0 rounded-xl shadow-sm bg-[var(--bg-main)]">
            {React.cloneElement(icon, { className: `h-7 w-7 ${color}` })}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold leading-tight truncate" style={{ color: 'var(--text-main)', fontSize: 'clamp(0.875rem, 2.2vw, 1.125rem)' }}>{title}</h3>
            <p className="font-medium truncate" style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.625rem, 1.5vw, 0.8125rem)' }}>{desc}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-32">
      {/* Scrollbar Styling Injection */}

      <div className="grid grid-cols-2 gap-3">
        <NavCard title="Place Order" desc="Create stock requirement Excel" href="place-order" icon={<ShoppingCart />} color="text-blue-500" fullWidth />
        <NavCard title="Customers" desc={`${customers.length} Registered`} href="customers" icon={<Users />} color="text-indigo-500" />
        <NavCard title="Inventory" desc={`${inventory.length} Products`} href="inventory" icon={<Archive />} color="text-amber-500" />
      </div>

      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-alt)' }}>
          <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-main)' }}>
            <Clock className="h-5 w-5 text-emerald-500" /> 
            {showFullHistory ? 'History' : "Today's Orders"}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFullHistory(!showFullHistory)} className="text-xs font-bold flex items-center gap-1" style={{ color: showFullHistory ? 'var(--accent)' : 'var(--text-muted)' }}>
              <History className="h-3.5 w-3.5" /> {showFullHistory ? 'Live' : 'Past'}
            </button>
            <button onClick={() => setShowDelivered(!showDelivered)} className="text-xs font-bold border-l pl-3 flex items-center gap-1" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              {showDelivered ? 'Hide Done' : `Done (${filteredOrders.delivered.length})`}
              {showDelivered ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: var(--border); 
          border-radius: 10px; 
        }
      `}</style>

        <table className="w-full text-left table-fixed border-collapse">
          <thead style={{ backgroundColor: 'var(--bg-alt)' }}>
            <tr className="h-0">
              <th className="w-[55%] p-0 h-0 border-none"></th>
              <th className="w-[10%] p-0 h-0 border-none"></th>
              <th className="w-[10%] p-0 h-0 border-none"></th>
              <th className="w-[20%] p-0 h-0 border-none"></th>
            </tr>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th colSpan="4" className="p-3">
                <div className="relative">
                  <button 
                    onClick={() => setShowAreaMenu(!showAreaMenu)}
                    onKeyDown={(e) => {
                      if (!showAreaMenu) {
                        if (e.key === 'ArrowDown' || e.key === 'Enter') setShowAreaMenu(true);
                        return;
                      }
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setFocusedIndex(prev => (prev < areaOptions.length - 1 ? prev + 1 : 0));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setFocusedIndex(prev => (prev > 0 ? prev - 1 : areaOptions.length - 1));
                      } else if (e.key === 'Enter' && focusedIndex >= 0) {
                        setSelectedArea(areaOptions[focusedIndex]);
                        setShowAreaMenu(false);
                      } else if (e.key === 'Escape') {
                        setShowAreaMenu(false);
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 text-[11px] font-bold uppercase tracking-wider border rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-[var(--accent)]"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                  >
                    <span>{selectedArea}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAreaMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showAreaMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAreaMenu(false)} />
                      <div 
                        ref={dropdownRef}
                        className="absolute left-0 right-0 mt-2 z-50 rounded-xl border shadow-2xl overflow-hidden custom-scrollbar animate-in fade-in zoom-in duration-150"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {areaOptions.map((area, index) => (
                          <div
                            key={area}
                            ref={focusedIndex === index ? activeItemRef : null}
                            onClick={() => { setSelectedArea(area); setShowAreaMenu(false); }}
                            onMouseEnter={() => setFocusedIndex(index)}
                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider cursor-pointer border-b last:border-0 transition-colors"
                            style={{ 
                              color: (selectedArea === area || focusedIndex === index) ? 'var(--accent)' : 'var(--text-main)',
                              backgroundColor: (selectedArea === area || focusedIndex === index) ? 'var(--bg-alt)' : 'transparent',
                              borderColor: 'var(--border)'
                            }}
                          >
                            {area === 'All Areas' ? '🌍 All Areas' : `📍 ${area}`}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </th>
            </tr>
            <tr className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>
              <th className="p-4 text-left">Client</th>
              <th className="p-4 text-center">Pick</th>
              <th className="p-4 text-center">Delivery</th>
              <th className="p-4 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#191919]">
            {showDelivered && filteredOrders.delivered.map(order => (
              <tr key={order.id} className="opacity-50 grayscale-[0.3]" style={{ backgroundColor: 'var(--bg-main)' }}>
                <td className="p-4 italic text-sm">
                  <div className="font-bold truncate" style={{ color: 'var(--text-main)' }}>{order.customerName}</div>
                  <div className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>{formatDateTime(order.createdAt)}</div>
                </td>
                <td className="p-4 text-center"><CheckCircle2 className="h-4 w-4 mx-auto text-slate-400" /></td>
                <td className="p-4 text-center">
                  <button onClick={() => handleStatusChange(order, 'delivered', false)}><Truck className="h-4 w-4 mx-auto text-blue-500" /></button>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => deleteOrder(order.id)} className="p-1.5 text-rose-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filteredOrders.pending.map(order => (
              <tr key={order.id} onClick={() => onClick(order)} className="hover:opacity-80 cursor-pointer">
                <td className="p-4">
                  <div className="font-bold text-sm truncate" style={{ color: 'var(--text-main)' }}>{order.customerName}</div>
                  <div className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{formatDateTime(order.createdAt)}</div>
                  {order.deadline && <div className={`text-[10px] font-bold mt-1 ${getDeadlineColor(order.deadline)}`}>DUE: {formatDateTime(order.deadline)}</div>}
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={order.taken} onChange={(e) => handleStatusChange(order, 'taken', e.target.checked)} onClick={e => e.stopPropagation()} />
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={order.delivered} disabled={!order.taken} onChange={(e) => handleStatusChange(order, 'delivered', e.target.checked)} onClick={e => e.stopPropagation()} />
                </td>
                <td className="p-4 flex justify-center gap-1">
                   <button onClick={(e) => { e.stopPropagation(); onEdit(order); }} className="p-2 text-blue-500"><PencilLine size={16} /></button>
                   <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete?")) deleteOrder(order.id); }} className="p-2 text-rose-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => setPage('take-order')} style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', bottom: 'calc(2.0rem + var(--safe-area-bottom))' }} className="fixed right-8 h-16 w-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 border z-40">
        <PencilLine className="h-7 w-7 text-emerald-500" />
      </button>
    </div>
  );
}