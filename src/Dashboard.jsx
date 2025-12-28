import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Users, Archive, ArrowRight, Clock, 
  ChevronDown, PencilLine, CheckCircle2, Truck, 
  ChevronUp, History, Trash2
} from 'lucide-react';
import { useData } from './App';

export default function Dashboard({ setPage, onClick, onEdit }) {
  const context = useData();
  if (!context || !context.orders) {
    return <div className="p-8 text-center text-slate-400">Loading orders...</div>;
  }

  const { customers = [], inventory = [], orders = [], updateOrder, deleteOrder } = context;

  // 2. Ensure orders is treated as an array in useMemo
  const areaGroups = useMemo(() => {
    if (!Array.isArray(orders)) return {}; // Safety fallback
    
    return orders.reduce((groups, order) => {
      const area = order.customerArea || 'Other';
      if (!groups[area]) groups[area] = [];
      groups[area].push(order);
      return groups;
    }, {});
  }, [orders]);
  
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

// Safety check at the very beginning of return
  if (!Array.isArray(orders)) {
    return <div className="p-10 text-center font-bold text-slate-400">Loading Orders...</div>;
  }

  return (
    <div className="space-y-6 pb-32">
      {/* 1. Navigation Cards */}
      <div className="grid grid-cols-2 gap-3 px-0">
        <NavCard title="Place Order" desc="Create stock requirement Excel" href="place-order" icon={<ShoppingCart />} color="text-blue-500" fullWidth />
        <NavCard title="Customers" desc={`${customers.length} Registered`} href="customers" icon={<Users />} color="text-indigo-500" />
        <NavCard title="Inventory" desc={`${inventory.length} Products`} href="inventory" icon={<Archive />} color="text-amber-500" />
      </div>

      {/* 2. Global Area Selector */}
      <div className="relative z-30">
        <button 
          onClick={() => setShowAreaMenu(!showAreaMenu)}
          className="w-full flex items-center justify-between p-3 text-[11px] font-bold uppercase tracking-wider border rounded-xl outline-none shadow-sm transition-all"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
        >
          <span>{selectedArea === 'All Areas' ? '🌍 Showing All Areas' : `📍 Area: ${selectedArea}`}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showAreaMenu ? 'rotate-180' : ''}`} />
        </button>

        {showAreaMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAreaMenu(false)} />
            <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border shadow-2xl overflow-hidden bg-white max-h-60 overflow-y-auto">
              {areaOptions.map((area) => (
                <div
                  key={area}
                  onClick={() => { setSelectedArea(area); setShowAreaMenu(false); }}
                  className="px-4 py-3 text-[11px] font-bold uppercase hover:bg-slate-50 cursor-pointer border-b last:border-0"
                  style={{ color: selectedArea === area ? 'var(--accent)' : 'var(--text-main)' }}
                >
                  {area === 'All Areas' ? '🌍 All Areas' : `📍 ${area}`}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3. Grouped Orders Tables */}
      <div className="space-y-8">
        {Object.entries(areaGroups).map(([areaName, areaOrders]) => {
          // Filter out delivered if not toggled
          const pendingInArea = areaOrders.filter(o => !o.delivered);
          const deliveredInArea = areaOrders.filter(o => o.delivered);
          
          if (pendingInArea.length === 0 && (!showDelivered || deliveredInArea.length === 0)) return null;

          return (
            <div key={areaName} className="rounded-2xl border shadow-sm overflow-hidden bg-white" style={{ borderColor: 'var(--border)' }}>
              {/* Area Sub-Header */}
              <div className="p-3 border-b flex justify-between items-center bg-slate-50/50" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {areaName} — {pendingInArea.length} Pending
                </div>
                {areaName === 'All Areas' && (
                   <button onClick={() => setShowDelivered(!showDelivered)} className="text-[10px] font-bold text-emerald-600">
                     {showDelivered ? 'Hide Done' : 'Show Done'}
                   </button>
                )}
              </div>

              <table className="w-full text-left table-fixed border-collapse">
                <tbody className="divide-y divide-slate-100">
                  {/* Delivered Section */}
                  {showDelivered && deliveredInArea.map(order => (
                    <tr key={order.id} className="opacity-40 grayscale bg-slate-50">
                      <td className="p-4 w-[55%]">
                        <div className="font-bold text-xs truncate">{order.customerName}</div>
                        <div className="text-[9px] font-bold text-slate-400">{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td className="p-4 text-center w-[15%]"><CheckCircle2 className="h-4 w-4 mx-auto text-slate-400" /></td>
                      <td className="p-4 text-center w-[15%]">
                        <button onClick={() => handleStatusChange(order, 'delivered', false)}><Truck className="h-4 w-4 mx-auto text-blue-500" /></button>
                      </td>
                      <td className="p-4 text-center w-[15%]">
                        <button onClick={() => deleteOrder(order.id)} className="p-1.5 text-rose-500"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}

                  {/* Pending Section */}
                  {pendingInArea.map(order => (
                    <tr key={order.id} onClick={() => onClick(order)} className="hover:bg-slate-50/50 cursor-pointer transition-colors">
                      <td className="p-4 w-[55%]">
                        <div className="font-bold text-sm truncate text-slate-800">{order.customerName}</div>
                        <div className="text-[10px] font-bold text-slate-400">{formatDateTime(order.createdAt)}</div>
                        {order.deadline && <div className={`text-[9px] font-black mt-1 ${getDeadlineColor(order.deadline)} uppercase`}>Due: {formatDateTime(order.deadline)}</div>}
                      </td>
                      <td className="p-4 text-center w-[15%]">
                        <input type="checkbox" className="w-4 h-4 rounded accent-emerald-500" checked={order.taken} onChange={(e) => handleStatusChange(order, 'taken', e.target.checked)} onClick={e => e.stopPropagation()} />
                      </td>
                      <td className="p-4 text-center w-[15%]">
                        <input type="checkbox" className="w-4 h-4 rounded accent-blue-500" checked={order.delivered} disabled={!order.taken} onChange={(e) => handleStatusChange(order, 'delivered', e.target.checked)} onClick={e => e.stopPropagation()} />
                      </td>
                      <td className="p-4 text-center w-[15%]">
                        <div className="flex justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); onEdit(order); }} className="p-1 text-blue-500"><PencilLine size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setPage('take-order')} 
        style={{ bottom: 'calc(2.0rem + var(--safe-area-bottom))' }} 
        className="fixed right-8 h-16 w-16 rounded-full shadow-2xl flex items-center justify-center bg-emerald-600 hover:scale-110 active:scale-95 z-40"
      >
        <PlusCircle className="h-7 w-7 text-white" />
      </button>
    </div>
  );}