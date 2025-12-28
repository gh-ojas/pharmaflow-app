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
  isOpen ? 'border-emerald-500 shadow-md' : ''
}`}
style={{
  backgroundColor: 'var(--bg-alt)',
  borderColor: isOpen ? '#10b981' : 'var(--border)',
  color: value ? 'var(--text-main)' : 'var(--text-muted)'
}}
      >
        <span className="font-medium" style={{ color: value ? 'var(--text-main)' : 'var(--text-muted)' }}>
  {value || placeholder}
</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 border rounded-xl shadow-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-alt)' }}>
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

          <div className="max-h-56 overflow-y-auto overscroll-contain custom-scrollbar">
            {filtered.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className="p-3 text-sm cursor-pointer flex justify-between items-center border-b last:border-0"
    style={{
      backgroundColor: value === (opt.displayLabel || opt.label) ? 'var(--bg-alt)' : 'transparent',
      borderColor: 'var(--border)',
      color: 'var(--text-main)'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
    onMouseLeave={(e) => {
      if (value !== (opt.displayLabel || opt.label)) {
        e.currentTarget.style.backgroundColor = 'transparent';
      }
    }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium" style={{ color: 'var(--text-main)' }}>{opt.displayLabel || opt.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {opt.frequency && (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}>
    <History className="h-3 w-3" style={{ color: 'var(--accent-text)' }} />
    <span className="text-[10px] font-bold" style={{ color: 'var(--accent-text)' }}>{opt.frequency}</span>
  </div>
)}
                  {value === (opt.displayLabel || opt.label) && <Check className="h-4 w-4 text-emerald-600" />}
                </div>
              </div>
            ))}

            {search && filtered.length === 0 && !showConfirm && (
  <div onClick={() => setShowConfirm(true)} className="p-3 text-sm font-bold cursor-pointer text-center" style={{ color: 'var(--accent)', backgroundColor: 'transparent' }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    + Add New?
  </div>
)}

            {showConfirm && (
  <div className="p-3 border-t text-center" style={{ backgroundColor: 'var(--bg-alt)', borderColor: 'var(--border)' }}>
    <button 
      onClick={() => handleSelect({ id: `new-${Date.now()}`, label: search, isNew: true })}
      className="w-full py-1.5 text-white text-xs font-bold rounded-lg"
      style={{ backgroundColor: 'var(--accent)' }}
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
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      containerRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
    return () => clearTimeout(timer);
  }
}, [isOpen, setActiveStep]);

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
        inputMode="decimal" // Forces numeric keyboard with decimal support
        pattern="[0-9]*"    // Suggests numeric input to mobile browsers
        placeholder="Qty (10+2)" 
        value={value}
        className={`w-full p-2.5 rounded-lg outline-none border-2 transition-all text-sm font-medium ${
  isOpen ? 'border-emerald-500' : ''
}`}
style={{
  backgroundColor: 'var(--bg-alt)',
  borderColor: isOpen ? '#10b981' : 'var(--border)',
  color: 'var(--text-main)'
}}
        onChange={onChange}
        onFocus={() => setActiveStep('qty')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter();
        }}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 border rounded-xl shadow-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="p-2 border-b" style={{ backgroundColor: 'var(--bg-alt)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-main)' }}>Previous Quantities</p>
          </div>
          <div className="max-h-40 overflow-y-auto">

            {suggestions.map((qty, idx) => (
  <div
    key={idx}
    onClick={() => { 
      onSelectSuggestion(qty);
      setActiveStep(null);
    }}
    className="p-3 text-sm cursor-pointer border-b last:border-0"
    style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    <span className="font-bold" style={{ color: 'var(--text-main)' }}>{qty}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase"></span>
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
  <div className="min-h-screen pb-[90vh]"> 
    <div className="space-y-6"> 
      {/* Input Section */}
      <div className="p-4 rounded-xl border shadow-sm space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-main)' }}>Customer</label>
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
          <label className="text-sm font-semibold block -mb-2" style={{ color: 'var(--text-main)' }}>Add Item</label>
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
                onSelectSuggestion={(qty) => {
                  setQuantity(qty.toString());
                  setActiveStep('qty'); 
                }}
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
                    activeStep === 'unit' ? 'border-emerald-500 shadow-md' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-alt)',
                    borderColor: activeStep === 'unit' ? '#10b981' : 'var(--border)',
                    color: 'var(--text-main)'
                  }}
                />
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-transform ${activeStep === 'unit' ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
              </div>

              {activeStep === 'unit' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveStep(null)} />
                  <div className="absolute z-50 w-full mt-1 border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-100" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="max-h-56 overflow-y-auto">
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
                          className="p-3 text-sm hover:bg-opacity-50 cursor-pointer border-b last:border-0"
                          style={{
                            backgroundColor: unitType === opt.label ? 'var(--bg-alt)' : 'transparent',
                            borderColor: 'var(--border)',
                            color: 'var(--text-main)'
                          }}
                        >
                          <span className="font-medium">{opt.label}</span>
                          {unitType === opt.label && <Check className="h-4 w-4 text-emerald-600 inline-block ml-2" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <button onClick={handleAddItem} className="w-full py-2.5 font-bold rounded-lg flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
            <PlusCircle className="h-5 w-5" /> Add to List
          </button>
        </div>
      </div>

      {/* Order Summary Section */}
      {orderItems.length > 0 && (
        <div className="rounded-xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-alt)', borderColor: 'var(--border)' }}>
            <h3 className="font-bold text-sm truncate uppercase" style={{ color: 'var(--text-main)' }}>Current Order</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>{orderItems.length} ITEMS</span>
          </div>
          <table className="w-full text-left">
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {orderItems.map((item, idx) => (
                <tr key={idx} className="relative border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3 font-medium text-xs truncate max-w-[140px]" style={{ color: 'var(--text-main)' }}>{item.itemName}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <input 
                        type="text" 
                        value={item.quantity} 
                        onChange={(e) => updateTableQty(idx, e.target.value)} 
                        className="w-10 p-1 text-center font-bold border rounded outline-none focus:border-emerald-500 text-xs" 
                        style={{ 
                          backgroundColor: 'var(--bg-alt)', 
                          borderColor: 'var(--border)',
                          color: 'var(--text-main)'
                        }}
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
                          className="w-full p-1 border-b border-transparent hover:border-opacity-50 focus:border-emerald-500 text-[9px] font-bold uppercase outline-none bg-transparent text-right"
                          style={{ 
                            color: 'var(--text-muted)',
                            borderColor: activeStep === `cart-unit-${idx}` ? '#10b981' : 'var(--border)'
                          }}
                        />
                        {activeStep === `cart-unit-${idx}` && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setActiveStep(null)} />
                            <div className="absolute z-[100] right-0 w-36 mt-1 border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
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
                                    className="p-2 text-[10px] hover:bg-opacity-50 cursor-pointer border-b last:border-0 font-semibold"
                                    style={{
                                      backgroundColor: item.unitType === opt.label ? 'var(--bg-alt)' : 'transparent',
                                      borderColor: 'var(--border)',
                                      color: 'var(--text-main)'
                                    }}
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
          <div className="p-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => processOrder(false)} className="py-3 font-bold rounded-xl flex items-center justify-center gap-2 border" style={{ backgroundColor: 'var(--bg-alt)', color: 'var(--text-main)', borderColor: 'var(--border)' }}>
              <Save className="h-5 w-5" /> {editingOrder ? 'Update' : 'Save'}
            </button>
            <button onClick={() => processOrder(true)} className="py-3 font-bold rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
              <Share2 className="h-5 w-5" /> Review & Share
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);}