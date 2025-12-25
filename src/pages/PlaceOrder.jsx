import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trash2, Download, Search, Check, ChevronDown, 
  Plus, Filter, History, Share2, X, Pin, PinOff
} from 'lucide-react';
import { useData } from '../App';
import * as XLSX from 'xlsx-js-style';

const SearchableSelect = ({ options, value, onChange, placeholder, inputRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase())), [options, search]);
  
  const handleSelect = (opt) => { 
    onChange(opt); 
    setIsOpen(false); 
    setSearch(''); 
  };

  return (
    <div className="relative">
      <button 
        ref={inputRef} 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-sm"
      >
        <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="h-4 w-4 text-slate-400" />
            <input autoFocus className="bg-transparent border-none outline-none text-sm w-full"
              placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto no-scrollbar">
            {filtered.map((opt) => (
              <div key={opt.id} onClick={() => handleSelect(opt)} className="p-3 text-sm hover:bg-emerald-50 cursor-pointer flex justify-between items-center">
                <span className="font-medium text-slate-700">{opt.label}</span>
                {value === opt.label && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PlaceOrderPage({ setPage, setHeaderActions }) {
  // --- FIXED: Hooks moved inside the component ---
  const { inventory, requirementHistory = [], updateRequirementHistory } = useData();
  const itemRef = useRef(null);
  const qtyRef = useRef(null);
  
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getDate()}${d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}${d.getFullYear().toString().slice(-2)}`;
  };

  const [organization, setOrganization] = useState(localStorage.getItem('savedOrg') || '');
  const [orderItems, setOrderItems] = useState(() => JSON.parse(localStorage.getItem('orderDraft')) || []);
  const [currentOrderId, setCurrentOrderId] = useState(() => localStorage.getItem('currentOrderId') || null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  const currentDateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  const generateNewId = () => {
    const todayPrefix = getTodayStr();
    const todaysOrders = requirementHistory.filter(h => h?.orderId?.startsWith(todayPrefix));
    return `${todayPrefix}-${todaysOrders.length + 1}`;
  };

  useEffect(() => {
    if (!currentOrderId || currentOrderId === "null") {
      setCurrentOrderId(generateNewId());
    }
  }, [currentOrderId]);

  const updateQty = (index, newQty) => {
  const updated = [...orderItems];
  updated[index].quantity = newQty;
  setOrderItems(updated);
};
  // --- FIXED: Combined LocalStorage and Firebase sync ---
  useEffect(() => {
    localStorage.setItem('orderDraft', JSON.stringify(orderItems));
    localStorage.setItem('currentOrderId', currentOrderId);
    localStorage.setItem('savedOrg', organization);

    if (organization && orderItems.length > 0) {
      const existingIdx = requirementHistory.findIndex(h => h.orderId === currentOrderId);
      const newEntry = { 
        orderId: currentOrderId, 
        date: currentDateLabel, 
        org: organization, 
        items: [...orderItems], 
        pinned: requirementHistory[existingIdx]?.pinned || false 
      };

      let newHist = [...requirementHistory];
      if (existingIdx > -1) {
        newHist[existingIdx] = newEntry;
      } else {
        newHist = [newEntry, ...newHist].slice(0, 50);
      }
      
      // Update Firebase
      if (updateRequirementHistory) updateRequirementHistory(newHist);
    }
  }, [orderItems, organization, currentOrderId]);

  const sortedHistory = useMemo(() => [...requirementHistory].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)), [requirementHistory]);
  const availableCompanies = useMemo(() => [...new Set(orderItems.map(item => item.company))].filter(Boolean), [orderItems]);
  const filteredOrderItems = useMemo(() => selectedCompanies.length === 0 ? orderItems : orderItems.filter(item => selectedCompanies.includes(item.company)), [orderItems, selectedCompanies]);

  const handleNewOrder = () => {
    setOrderItems([]);
    setOrganization('');
    setCurrentOrderId(generateNewId());
    localStorage.removeItem('orderDraft');
  };

  const handleExport = () => {
    if (!organization || filteredOrderItems.length === 0) return alert("Add items first");
    
    const wsData = [
      [organization.toUpperCase(), ""],
      [`REQUIREMENT ORDER DATED: ${currentDateLabel}`, ""],
      ["ITEM", "ITEM_QTY"],
      ...filteredOrderItems.map(item => [item.itemName, item.quantity])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, 
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
    ];
    
    const thinBorder = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" }
    };

    const yellowFill = { 
      fill: { fgColor: { rgb: "FFFF99" } }, 
      alignment: { horizontal: "center" }, font: { bold: true }, border: thinBorder 
    };

    const greyFill = { 
      fill: { fgColor: { rgb: "C0C0C0" } }, font: { bold: true }, 
      alignment: { horizontal: "center" }, border: thinBorder 
    };

    const blueFill = { fill: { fgColor: { rgb: "CCFFFF" } }, border: thinBorder };
    
    ['A1', 'B1', 'A2', 'B2'].forEach(key => { if (ws[key]) ws[key].s = yellowFill; });
    ws['A3'].s = { ...greyFill, alignment: { horizontal: "left" } }; 
    ws['B3'].s = greyFill;
    
    filteredOrderItems.forEach((_, i) => {
      const r = i + 4;
      if (ws[`A${r}`]) ws[`A${r}`].s = blueFill;
      if (ws[`B${r}`]) { ws[`B${r}`].s = { ...blueFill, alignment: { horizontal: "center" } }; }
    });

    ws['!cols'] = [{ wch: 45 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const fileName = `${currentOrderId}_${organization}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleShareText = async () => {
    if (filteredOrderItems.length === 0) return;
    const text = `${organization.toUpperCase()}\nID: ${currentOrderId}\n${currentDateLabel}\n_________________________\n\n` + 
      filteredOrderItems.map(i => `* ${i.itemName} - *${i.quantity}*`).join('\n');
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Pharmacy Order', text }); } catch (err) { console.error(err); }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Text Copied!");
    }
  };

  useEffect(() => {
    setHeaderActions(
      <div className="flex gap-2">
        <button onClick={() => setShowHistory(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><History className="h-4 w-4" /></button>
        <button onClick={handleNewOrder} className="px-3 py-1 text-xs font-black text-emerald-600 border border-emerald-200 rounded-lg flex items-center gap-1 hover:bg-emerald-50">
          <Plus className="h-4 w-4" /> NEW
        </button>
      </div>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, requirementHistory]);

  return (
    <div className="space-y-4 pb-24 relative">
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="font-bold text-slate-800 text-xs uppercase">History</h2>
              <button onClick={() => setShowHistory(false)}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              {sortedHistory.map((h) => (
                <div key={h.orderId} onClick={() => { setOrderItems(h.items); setOrganization(h.org); setCurrentOrderId(h.orderId); setShowHistory(false); }} 
                     className={`p-3 border rounded-lg cursor-pointer transition-all ${h.orderId === currentOrderId ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 rounded">{h.orderId}</span>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); updateRequirementHistory(requirementHistory.map(item => item.orderId === h.orderId ? { ...item, pinned: !item.pinned } : item)); }}>
                        {h.pinned ? <PinOff className="h-3 w-3 text-blue-600" /> : <Pin className="h-3 w-3 text-slate-400" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete?")) updateRequirementHistory(requirementHistory.filter(item => item.orderId !== h.orderId)); }}><Trash2 className="h-3 w-3 text-slate-400 hover:text-rose-500" /></button>
                    </div>
                  </div>
                  <div className="font-bold text-slate-800 text-xs truncate mt-1">{h.org}</div>
                  <div className="text-[9px] text-slate-400 font-bold">{h.date} • {h.items.length} items</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Order: {currentOrderId}</div>
        <input type="text" placeholder="Organization Name" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-bold"
               value={organization} onChange={(e) => setOrganization(e.target.value)} />
        <form onSubmit={(e) => { e.preventDefault(); if(selectedItem && quantity) { setOrderItems(prev => [...prev, { ...selectedItem, quantity }]); setSelectedItem(null); setQuantity(''); }}} className="space-y-3 pt-2 border-t">
          <SearchableSelect inputRef={itemRef} placeholder="Search item..." value={selectedItem?.itemName} options={inventory.map(i => ({ id: i.id, label: `${i.itemName} (${i.company})` }))}
                            onChange={(opt) => { setSelectedItem(inventory.find(i => i.id === opt.id)); setTimeout(() => qtyRef.current?.focus(), 50); }} />
          <div className="flex gap-2">
            <input ref={qtyRef} type="text" placeholder="Qty" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-bold" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <button type="submit" className="px-5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md">Add</button>
          </div>
        </form>
      </div>

      <div className="bg-amber-50/50 border border-amber-100 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-amber-100/80 p-3">
          <div className="text-center mb-2">
            <h3 className="text-amber-900 font-black text-sm uppercase">{organization || 'Draft'}</h3>
            <p className="text-[10px] text-amber-800 font-bold tracking-tighter uppercase">REQUIREMENT ORDER DATED: {currentDateLabel}</p>
          </div>
          {availableCompanies.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <Filter className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              <div className="flex gap-1.5">
                {availableCompanies.map(company => (
                  <button key={company} onClick={() => setSelectedCompanies(prev => prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company])}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all ${selectedCompanies.includes(company) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-200'}`}>{company}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white">
          {filteredOrderItems.map((item, idx) => (
            <div key={idx} className="flex justify-between p-3.5 border-b items-center">
              <div><div className="font-bold text-sm text-slate-800">{item.itemName}</div><div className="text-[9px] text-slate-400 font-black uppercase tracking-tight">{item.company}</div></div>
              <div className="flex items-center gap-4"><input type="text" value={item.quantity} onChange={(e) => updateQty(idx, e.target.value)} className="w-14 p-1 text-center font-black text-xs border border-blue-200 rounded-md bg-blue-50 text-blue-700 outline-none focus:border-blue-400"/>
              <button onClick={() => setOrderItems(prev => prev.filter((_, i) => i !== idx))} className="p-1"><Trash2 className="h-4 w-4 text-slate-300 hover:text-rose-500" /></button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleShareText} className="py-2.5 bg-slate-800 text-white text-[11px] font-black rounded-lg flex items-center justify-center gap-2 shadow-md uppercase">
          <Share2 className="h-4 w-4" /> Share Text
        </button>
        <button onClick={handleExport} className="py-2.5 bg-emerald-600 text-white text-[11px] font-black rounded-lg flex items-center justify-center gap-2 shadow-md uppercase">
          <Download className="h-4 w-4" /> Excel
        </button>
      </div>
    </div>
  );
}