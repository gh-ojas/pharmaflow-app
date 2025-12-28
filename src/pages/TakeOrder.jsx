import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trash2, Share2, PlusCircle, Save, Search, Check, ChevronDown, History } from 'lucide-react';
import { useData } from '../App';

const UNIT_OPTIONS = ["Stripes", "Pieces", "Injections", "Bottles", "Boxes", "Cases"];

// ============================================================================
// SEARCHABLE SELECT COMPONENT
// ============================================================================
const SearchableSelect = ({ options, value, onChange, placeholder, stepName, activeStep, setActiveStep, nextStep }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const isOpen = activeStep === stepName;
  
// TakeOrder.jsx - SearchableSelect component
useEffect(() => {
  if (isOpen) {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
      // Scroll the container to the top of the screen with some padding
      containerRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 150); // Slight delay to wait for keyboard animation
    return () => clearTimeout(timer);
  }
}, [isOpen]);
  
  const filtered = useMemo(() => 
    options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isOpen) setActiveStep(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setActiveStep]);

  const handleSelect = (opt) => {
    onChange(opt);
    setSearch('');
    setShowConfirm(false);
    setActiveStep(nextStep); 
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        // CHANGE: Clicking the button when already open now closes the search
        onClick={() => setActiveStep(isOpen ? null : stepName)}
        className={`w-full p-2.5 rounded-lg flex justify-between items-center text-sm outline-none border-2 transition-all ${
          isOpen ? 'border-emerald-500 bg-white shadow-md' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              className="bg-transparent border-none outline-none text-sm w-full"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0]);
                if (e.key === 'Escape') setActiveStep(null);
              }}
            />
          </div>

          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className="p-3 text-sm hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium text-slate-700">{opt.displayLabel || opt.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {opt.frequency && (
                    <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <History className="h-3 w-3 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-600">{opt.frequency}</span>
                    </div>
                  )}
                  {value === (opt.displayLabel || opt.label) && <Check className="h-4 w-4 text-emerald-600" />}
                </div>
              </div>
            ))}

            {search && filtered.length === 0 && !showConfirm && (
              <div onClick={() => setShowConfirm(true)} className="p-3 text-sm text-emerald-600 font-bold cursor-pointer hover:bg-emerald-50 text-center">
                + Add New?
              </div>
            )}

            {showConfirm && (
              <div className="p-3 bg-amber-50 border-t border-amber-100 text-center">
                <button 
                  onClick={() => handleSelect({ id: `new-${Date.now()}`, label: search, isNew: true })}
                  className="w-full py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                >
                  Confirm Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// QUANTITY INPUT WITH SUGGESTIONS
// ============================================================================
const QuantityInput = ({ value, onChange, onEnter, onSelectSuggestion, customerName, itemName, activeStep, setActiveStep, orders }) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const isOpen = activeStep === 'qty';

  const suggestions = useMemo(() => {
    if (!customerName || !itemName) return [];
    const matchingOrders = orders.filter(order => order.customerName === customerName);
    return matchingOrders
      .flatMap(order => order.items || [])
      .filter(item => item.itemName === itemName)
      .map(item => item.quantity)
      .filter((qty, idx, arr) => arr.indexOf(qty) === idx)
      .slice(0, 5);
  }, [customerName, itemName, orders]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <input 
        ref={inputRef}
        type="text" 
        placeholder="Qty (10+2)" 
        value={value}
        className={`w-full p-2.5 rounded-lg outline-none border-2 transition-all text-sm font-medium ${
          isOpen ? 'border-emerald-500 bg-white' : 'border-slate-200 bg-slate-50'
        }`}
        onChange={onChange}
        onFocus={() => setActiveStep('qty')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter();
        }}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 bg-emerald-50 border-b border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Previous Quantities</p>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {suggestions.map((qty, idx) => (
              <div
                key={idx}
                onClick={() => { 
                  // CHANGE: Auto-triggers add to list when clicking a suggestion
                  onSelectSuggestion(qty);
                }}
                className="p-3 text-sm hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between"
              >
                <span className="font-bold text-slate-700">{qty}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Click to use</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN TAKE ORDER COMPONENT
// ============================================================================
export default function TakeOrderPage({ setPage, setHeaderActions, editingOrder, onReview }) {
  const { customers, inventory, orders, addOrder, updateOrder, addInventoryItem, addCustomer, updateInventoryItem } = useData();
  
  const [activeStep, setActiveStep] = useState('customer');
  const [customerName, setCustomerName] = useState(editingOrder?.customerName || '');
  const [orderItems, setOrderItems] = useState(editingOrder?.items || []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [unitType, setUnitType] = useState('');

  const updateTableQty = (index, newQty) => {
    if (/^[0-9.+]*$/.test(newQty)) {
      const updated = [...orderItems];
      updated[index].quantity = newQty;
      setOrderItems(updated);
    }
  };

  const handleAddItem = (e, customQty = null) => {
    if (e) e.preventDefault();
    const finalQty = customQty || quantity;
    if (!selectedItem || !finalQty) return;

    if (selectedItem.isNew) {
      addInventoryItem({ itemName: selectedItem.itemName, unitType: unitType, quantity: 0 });
    }

    setOrderItems(prev => {
      const existingIdx = prev.findIndex(i => i.itemName === selectedItem.itemName);
      if (existingIdx > -1) return prev;
      
      return [...prev, {
        ...selectedItem,
        id: selectedItem.id || `temp-${Date.now()}`,
        itemName: selectedItem.itemName,
        unitType: unitType,
        quantity: finalQty,
        total: (selectedItem.price || 0) * parseFloat(finalQty || 0)
      }];
    });

    setSelectedItem(null);
    setQuantity('');
    setActiveStep('item'); // Jump back to item for next entry
  };

const processOrder = (shouldReview) => {
  if (orderItems.length === 0) return alert("Add items first");

  const finalOrder = {
    id: editingOrder ? editingOrder.id : Date.now(),
    customerName: customerName,
    items: orderItems,
    status: editingOrder ? editingOrder.status : "Pending",
    createdAt: editingOrder ? editingOrder.createdAt : new Date().toISOString(),
    deadline: editingOrder?.deadline || null
  };

  // 1. Trigger the UI immediately using the local object
  if (shouldReview) {
    onReview(finalOrder); 
  } else {
    setPage('home');
  }

  // 2. Perform the Firebase save in the background
  const saveAction = editingOrder ? updateOrder(finalOrder) : addOrder(finalOrder);
  
  saveAction.catch((error) => {
    console.error("Background save failed:", error);
    alert("Warning: Order shown but not saved to cloud. Check connection.");
  });
};


const unitOptions = useMemo(() => {
  const defaults = ["Packets", "Boxes", "Cases"];
  const inventoryUnits = inventory
    .map(item => item.unitType)
    .filter(u => u && !defaults.includes(u));
  return [...defaults, ...new Set(inventoryUnits)].map(u => ({ id: u, label: u }));
}, [inventory]);

// TakeOrder.jsx - Inside TakeOrderPage
const unitContainerRef = useRef(null);

useEffect(() => {
  if (activeStep === 'unit') {
    const timer = setTimeout(() => {
      unitContainerRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 150);
    return () => clearTimeout(timer);
  }
}, [activeStep]);

// TakeOrder.jsx - Inside TakeOrderPage
const inventoryOptions = useMemo(() => {
  const globalFreq = {};
  const customerFreq = {};

  // 1. Map frequencies
  orders.forEach(order => {
    order.items?.forEach(item => {
      globalFreq[item.itemName] = (globalFreq[item.itemName] || 0) + 1;
      if (order.customerName === customerName) {
        customerFreq[item.itemName] = (customerFreq[item.itemName] || 0) + 1;
      }
    });
  });

  // 2. Sort with 3 levels of priority
  return [...inventory].sort((a, b) => {
    const hasCustomerHistoryA = customerFreq[a.itemName] ? 1 : 0;
    const hasCustomerHistoryB = customerFreq[b.itemName] ? 1 : 0;

    // Level 1: Prioritize items this customer bought before
    if (hasCustomerHistoryB !== hasCustomerHistoryA) {
      return hasCustomerHistoryB - hasCustomerHistoryA;
    }

    // Level 2: Sort by Global Frequency (Most ordered overall)
    const gFreqA = globalFreq[a.itemName] || 0;
    const gFreqB = globalFreq[b.itemName] || 0;
    if (gFreqB !== gFreqA) return gFreqB - gFreqA;

    // Level 3: Alphabetical
    return a.itemName.localeCompare(b.itemName);
  }).map(i => ({ 
    id: i.id, 
    label: i.itemName, 
    displayLabel: i.itemName, 
    itemName: i.itemName, 
    unitType: i.unitType, 
    frequency: customerFreq[i.itemName] || null // Badge shows specific customer history only
  }));
}, [inventory, orders, customerName]);

return (
    <div className="space-y-6 pb-24">
      {/* Input Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">Customer</label>
          <SearchableSelect 
            stepName="customer" activeStep={activeStep} setActiveStep={setActiveStep} nextStep="item"
            placeholder="Select customer..."
            options={customers.map(c => ({ id: c.id, label: c.name }))} 
            value={customerName}
            onChange={(opt) => {
              if (opt.isNew) addCustomer({ name: opt.label, area: '' });
              setCustomerName(opt.label);
            }} 
          />
        </div>

        <div className="space-y-4 pt-2">
          <label className="text-sm font-semibold text-slate-700 block -mb-2">Add Item</label>
          <SearchableSelect 
            stepName="item" activeStep={activeStep} setActiveStep={setActiveStep} nextStep="qty"
            placeholder="Select item..."
            options={inventoryOptions}
            value={selectedItem?.itemName}
            onChange={(opt) => {
              const itemData = opt.isNew 
                ? { id: opt.id, itemName: opt.label, isNew: true, unitType: 'Pieces' }
                : inventory.find(i => i.itemName === opt.itemName);
              setSelectedItem(itemData);
              setUnitType(itemData.unitType || 'Pieces');
            }} 
          />

          <div className="flex gap-3">
            <div className="flex-[2]">
              <QuantityInput
                activeStep={activeStep} setActiveStep={setActiveStep}
                value={quantity}
                onChange={(e) => { if (/^[0-9.+]*$/.test(e.target.value)) setQuantity(e.target.value); }}
                onEnter={() => handleAddItem()}
                onSelectSuggestion={(qty) => handleAddItem(null, qty)}
                customerName={customerName} itemName={selectedItem?.itemName} orders={orders}
              />
            </div>
           
            <div className="flex-1 relative" ref={unitContainerRef}>
              <div className="relative">
                <input
                  type="text"
                  value={unitType}
                  placeholder="Unit"
                  onChange={(e) => {
                    setUnitType(e.target.value);
                    if (activeStep !== 'unit') setActiveStep('unit');
                  }}
                  onFocus={() => setActiveStep('unit')}
                  onBlur={() => {
                    setTimeout(() => {
                      if (selectedItem?.id && !selectedItem.isNew && unitType) {
                        updateInventoryItem(selectedItem.id, { unitType: unitType });
                      }
                    }, 200);
                  }}
                  className={`w-full p-2.5 rounded-lg text-sm outline-none border-2 transition-all ${
                    activeStep === 'unit' ? 'border-emerald-500 bg-white shadow-md' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform ${activeStep === 'unit' ? 'rotate-180' : ''}`} />
              </div>

              {activeStep === 'unit' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveStep(null)} />
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-100">
                    <div className="max-h-56 overflow-y-auto custom-scrollbar">
                      {unitOptions.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setUnitType(opt.label);
                            setActiveStep(null);
                            if (selectedItem?.id && !selectedItem.isNew) {
                              updateInventoryItem(selectedItem.id, { unitType: opt.label });
                            }
                          }}
                          className="p-3 text-sm hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                        >
                          <span className="font-medium text-slate-700">{opt.label}</span>
                          {unitType === opt.label && <Check className="h-4 w-4 text-emerald-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <button onClick={handleAddItem} className="w-full py-2.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center justify-center gap-2 border border-emerald-200">
            <PlusCircle className="h-5 w-5" /> Add to List
          </button>
        </div>
      </div>

      {/* Order Summary Section */}
      {orderItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm truncate uppercase">Current Order</h3>
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">{orderItems.length} ITEMS</span>
          </div>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              {orderItems.map((item, idx) => (
                <tr key={idx} className="relative">
                  <td className="p-3 font-medium text-slate-900 text-xs truncate max-w-[140px]">{item.itemName}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <input 
                        type="text" 
                        value={item.quantity} 
                        onChange={(e) => updateTableQty(idx, e.target.value)} 
                        className="w-10 p-1 text-center font-bold border border-slate-200 rounded bg-white outline-none focus:border-emerald-500 text-xs" 
                      />
                      
                      <div className="relative w-16">
                        <input
                          type="text"
                          value={item.unitType}
                          onChange={(e) => {
                            const newItems = [...orderItems];
                            newItems[idx].unitType = e.target.value;
                            setOrderItems(newItems);
                          }}
                          onFocus={() => setActiveStep(`cart-unit-${idx}`)}
                          onBlur={() => {
                            setTimeout(() => {
                              if (!item.isNew) updateInventoryItem(item.id, { unitType: item.unitType });
                            }, 200);
                          }}
                          className="w-full p-1 border-b border-transparent hover:border-slate-200 focus:border-emerald-500 text-[9px] font-bold uppercase outline-none bg-transparent text-slate-500 text-right"
                        />
                        {activeStep === `cart-unit-${idx}` && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setActiveStep(null)} />
                            <div className="absolute z-[100] right-0 w-36 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                              <div className="max-h-40 overflow-y-auto">
                                {unitOptions.map(opt => (
                                  <div 
                                    key={opt.id}
                                    onClick={() => {
                                      const newItems = [...orderItems];
                                      newItems[idx].unitType = opt.label;
                                      setOrderItems(newItems);
                                      updateInventoryItem(item.id, { unitType: opt.label });
                                      setActiveStep(null);
                                    }}
                                    className="p-2 text-[10px] hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 font-semibold text-slate-700"
                                  >
                                    {opt.label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right w-8">
                    <button onClick={() => setOrderItems(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 p-1"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <button onClick={() => processOrder(false)} className="py-3 bg-slate-100 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-200">
              <Save className="h-5 w-5" /> {editingOrder ? 'Update' : 'Save'}
            </button>
            <button onClick={() => processOrder(true)} className="py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <Share2 className="h-5 w-5" /> Review & Share
            </button>
          </div>
        </div>
      )}
    </div>
  );}