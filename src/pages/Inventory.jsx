import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Settings, PlusCircle, Trash2, Edit, 
  Upload, Check, X, FileText, ChevronDown, Eye, EyeOff, AlertTriangle
} from 'lucide-react';
import { useData } from '../App';
import * as XLSX from 'xlsx';

const ALL_UNITS = ["Stripes", "Pieces", "Bottles", "Injections", "Boxes", "Cases"];

const StyledSelect = ({ value, onChange, options, className = "" }) => (
  <div className={`relative ${className}`}>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-2 pr-6 py-1 bg-white border border-slate-200 rounded-md text-sm appearance-none outline-none focus:ring-1 focus:ring-emerald-500"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
  </div>
);

export default function InventoryPage({ setHeaderActions }) {
  const { inventory, deleteInventoryItem, addInventoryItem, updateInventoryItem } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newColName, setNewColName] = useState(''); 
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newItem, setNewItem] = useState({ itemName: '', unitType: 'Pieces', quantity: 0 });
  
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [columns, setColumns] = useState([
    { id: 'itemName', label: 'Item Name', permanent: true, visible: true, width: 'w-64' },
    { id: 'company', label: 'Company', permanent: true, visible: true, width: 'w-32' }, 
    { id: 'unitType', label: 'Unit', permanent: true, visible: false, width: 'w-32' }, 
    { id: 'quantity', label: 'Stock', permanent: true, visible: true, width: 'w-24' },
  ]);

  useEffect(() => {
    setHeaderActions(
      <div className="flex gap-2">
        <button onClick={() => setIsImporting(true)} className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2">
          <Upload className="h-3.5 w-3.5" /> Import
        </button>
        <button onClick={() => setIsAdding(true)} className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
          <PlusCircle className="h-3.5 w-3.5" /> Add Item
        </button>
      </div>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const id = newColName.toLowerCase().replace(/\s+/g, '_');
    if (columns.find(c => c.id === id)) return;
    setColumns([...columns, { id, label: newColName, permanent: false, visible: true, width: 'w-40' }]);
    setNewColName('');
  };

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    return inventory.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [inventory, searchTerm]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        jsonData.forEach(row => {
          const name = row.itemName || row['Item Name'] || row.item || row.Item;
          const unit = row.unitType || row.Unit || 'Pieces';
          const qty = row.quantity || row.Stock || row.Qty || 0;
          const company = row.company || row.Company || 'Generic';

          if (name) {
            addInventoryItem({ 
              itemName: String(name).trim(), 
              company: String(company).trim(), 
              unitType: unit, 
              quantity: parseInt(qty) || 0,
              ...row // Keep any extra custom columns from Excel
            });
          }
        });
        setIsImporting(false);
      } catch (err) {
        alert("Error reading file. Ensure it is a valid Excel/CSV.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Settings Bar */}
      <div className="flex gap-2 relative" ref={settingsRef}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none" 
                 value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className={`p-2 border rounded-xl transition-colors ${showSettings ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
        >
          <Settings className="h-5 w-5" />
        </button>

        {showSettings && (
          <div className="absolute right-0 top-11 z-40 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Manage Columns</p>
            <form onSubmit={handleAddColumn} className="flex gap-1 mb-3">
              <input type="text" placeholder="New Column" className="flex-1 text-xs p-1.5 border border-slate-100 rounded-lg outline-none" value={newColName} onChange={(e) => setNewColName(e.target.value)} />
              <button type="submit" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><PlusCircle className="h-4 w-4" /></button>
            </form>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {columns.map(col => (
                <div key={col.id} className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-slate-50 rounded-lg group">
                  <span className="text-slate-700 font-medium">{col.label} {col.permanent && <span className="text-[8px] text-emerald-500 ml-1">(Req)</span>}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setColumns(columns.map(c => c.id === col.id ? {...c, visible: !c.visible} : c))} className="text-slate-300 hover:text-emerald-600">
                      {col.visible ? <Eye className="h-3.5 w-3.5"/> : <EyeOff className="h-3.5 w-3.5"/>}
                    </button>
                    {!col.permanent && (
                      <button onClick={() => setColumns(columns.filter(c => c.id !== col.id))} className="text-rose-300 hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-max">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {visibleColumns.map(col => (
                  <th key={col.id} className={`p-3 text-[10px] font-black uppercase text-slate-400 tracking-wider ${col.width}`}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInventory.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetails(item)} className="cursor-pointer hover:bg-slate-50/50 transition-colors">
                  {visibleColumns.map(col => (
                    <td key={col.id} className="p-3 text-slate-800 text-sm truncate">
                      {col.id === 'quantity' ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.quantity < 100 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.quantity}</span>
                      ) : (item[col.id] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Details Modal (Full Functionality Restored) */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isEditingDetails && !confirmDelete && setSelectedDetails(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEditingDetails ? 'Editing' : 'Info'}</span>
              <button onClick={() => { setSelectedDetails(null); setIsEditingDetails(false); setConfirmDelete(false); }}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="p-0">
              <table className="w-full border-collapse">
                <tbody>
                  {columns.map(col => (
                    <tr key={col.id} className="border-b border-slate-50 last:border-0">
                      <td className="p-3 w-1/3 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/30 border-r border-slate-50">{col.label}</td>
                      <td className="p-3">
                        {isEditingDetails ? (
                          col.id === 'unitType' ? (
                            <StyledSelect value={selectedDetails.unitType} options={ALL_UNITS} onChange={(val) => setSelectedDetails({...selectedDetails, unitType: val})} />
                          ) : (
                            <input type={col.id === 'quantity' ? 'number' : 'text'} className="w-full p-1 border border-slate-200 rounded text-sm font-medium outline-none"
                              value={selectedDetails[col.id] || ''} onChange={(e) => setSelectedDetails({...selectedDetails, [col.id]: e.target.value})} />
                          )
                        ) : (
                          <span className="text-sm font-medium text-slate-700">{selectedDetails[col.id] || (col.id === 'quantity' ? '0' : '-')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
              {confirmDelete ? (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs"><AlertTriangle className="h-4 w-4" /> Delete this item?</div>
                  <div className="flex gap-2">
                    <button onClick={() => { deleteInventoryItem(selectedDetails.id); setSelectedDetails(null); setConfirmDelete(false); }} className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold">Yes, Delete</button>
                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold">Cancel</button>
                  </div>
                </div>
              ) : isEditingDetails ? (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingDetails(false)} className="flex-1 py-2 bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase">Discard</button>
                  <button onClick={() => { updateInventoryItem(selectedDetails.id, selectedDetails); setIsEditingDetails(false); }} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-emerald-100">Save</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingDetails(true)} className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase"><Edit className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => setConfirmDelete(true)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal (Mobile Optimized) */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5 space-y-4 shadow-2xl text-center">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Import File</h3>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Headers Supported: itemName, company, unitType, quantity</p>
            </div>
            <div className="flex flex-col gap-2">
              <input 
                type="file" 
                id="import-file" 
                className="hidden" 
                accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv" 
                onChange={handleFileUpload} 
              />
              <label htmlFor="import-file" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer">Select Excel/CSV</label>
              <button onClick={() => setIsImporting(false)} className="text-xs font-bold text-slate-400 py-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal (Full Logic Restored) */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-3 shadow-2xl">
            <h3 className="text-xs font-black text-slate-800 uppercase text-center mb-1">New Item</h3>
            <input type="text" placeholder="Item Name" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-medium" 
                   value={newItem.itemName} onChange={(e) => setNewItem({...newItem, itemName: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <StyledSelect value={newItem.unitType} options={ALL_UNITS} onChange={(val) => setNewItem({...newItem, unitType: val})} />
              <input type="number" placeholder="Stock" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" 
                     value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase">Cancel</button>
              <button onClick={() => { if(newItem.itemName){ addInventoryItem(newItem); setIsAdding(false); setNewItem({itemName:'', unitType:'Pieces', quantity:0}); } }} 
                      className="flex-1 py-3 text-[10px] font-black text-white bg-emerald-600 rounded-xl uppercase shadow-lg shadow-emerald-100">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}