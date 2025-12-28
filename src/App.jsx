import React, { useState, createContext, useContext, useEffect } from 'react';
import { Pill, ArrowLeft, Sun, Moon } from 'lucide-react';

// --- Page Imports ---
import Dashboard from './Dashboard';
import Dialogs from './Dialogs';
import TakeOrderPage from './pages/TakeOrder';
import PlaceOrderPage from './pages/PlaceOrder';
import InventoryPage from './pages/Inventory';
import CustomersPage from './pages/Customers';
import EmployeesPage from './pages/Employees';

// --- Firebase Imports ---
import { db } from "./firebase-config";
import { ref, onValue, set } from "firebase/database";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // Initialize state from localStorage cache or empty array
  const [orders, setOrders] = useState(() => {
  const cached = localStorage.getItem('cache_orders');
  // Ensure we return an empty array [] if nothing is found
  return (cached && cached !== "undefined") ? JSON.parse(cached) : [];
});
  const [inventory, setInventory] = useState(() => JSON.parse(localStorage.getItem('cache_inventory')) || []);
  const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem('cache_customers')) || []);
  const [employees, setEmployees] = useState(() => JSON.parse(localStorage.getItem('cache_employees')) || []);
  const [requirementHistory, setRequirementHistory] = useState(() => JSON.parse(localStorage.getItem('cache_requirementHistory')) || []);

  // Sync all data from Firebase
  useEffect(() => {
    const sync = (path, setter, cacheKey) => {
      onValue(ref(db, path), (snapshot) => {
        const data = snapshot.val();
        // Ensure data is always an array
        const arrayData = Array.isArray(data) ? data : [];
        setter(arrayData);
        localStorage.setItem(cacheKey, JSON.stringify(arrayData));
      });
    };

    sync('orders', setOrders, 'cache_orders');
    sync('inventory', setInventory, 'cache_inventory');
    sync('customers', setCustomers, 'cache_customers');
    sync('employees', setEmployees, 'cache_employees');
    sync('requirementHistory', setRequirementHistory, 'cache_requirementHistory');
  }, []);

  // --- Bulk Actions for Excel (Saves to Firebase) ---
  const addMultipleInventoryItems = (newItems) => {
    const updated = [...newItems, ...inventory];
    set(ref(db, 'inventory'), updated);
  };

  const addMultipleCustomers = (newCustomers) => {
    const updated = [...newCustomers, ...customers];
    set(ref(db, 'customers'), updated);
  };

  // --- Requirement History Update ---
  const updateRequirementHistory = (newHistory) => {
    set(ref(db, 'requirementHistory'), newHistory);
  };

  // --- Standard Actions (Saving to Firebase) ---
  const addOrder = async (order) => await set(ref(db, 'orders'), [order, ...orders]);
  
  const addInventoryItem = (item) => {
    const newItem = { ...item, id: `item-${Date.now()}` };
    set(ref(db, 'inventory'), [newItem, ...inventory]);
  };

  const addCustomer = (customer) => {
    const newCust = { ...customer, id: `c-${Date.now()}` };
    set(ref(db, 'customers'), [newCust, ...customers]);
  };

  // --- Delete/Update Actions ---
  const deleteInventoryItem = (id) => set(ref(db, 'inventory'), inventory.filter(i => i.id !== id));
  const deleteCustomer = (id) => set(ref(db, 'customers'), customers.filter(c => c.id !== id));
  
  const updateInventoryItem = (id, updated) => {
    const newList = inventory.map(i => i.id === id ? { ...i, ...updated } : i);
    set(ref(db, 'inventory'), newList);
  };

  const deleteOrder = (id) => {
    const newList = orders.filter(o => o.id !== id);
    set(ref(db, 'orders'), newList);
  };

  const updateOrder = async (updatedOrder) => {
    const newList = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    await set(ref(db, 'orders'), newList);
  };

  return (
    <DataContext.Provider value={{ 
      orders, inventory, customers, employees, requirementHistory,
      addOrder, updateOrder, deleteOrder,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, addMultipleInventoryItems,
      addCustomer, deleteCustomer, addMultipleCustomers,
      updateRequirementHistory
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

const Layout = ({ children, page, setPage, actions, darkMode, setDarkMode }) => (
  <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
    <div className="max-w-7xl mx-auto min-h-screen shadow-2xl flex flex-col" style={{ backgroundColor: 'var(--bg-card)' }}>
      <header 
        style={{ paddingTop: 'var(--safe-area-top)', borderColor: 'var(--border)' }}
        className="flex items-center justify-between border-b sticky top-0 z-30 px-4 h-[calc(4rem+var(--safe-area-top))] bg-inherit backdrop-blur-md"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {page !== 'home' && (
            <button 
              onClick={() => setPage('home')} 
              className="p-1 rounded-full hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="h-6 w-6" style={{ color: 'var(--text-main)' }} />
            </button>
          )}
          {page === 'home' && <Pill className="h-6 w-6 text-emerald-500 shrink-0" />}
          <h1 className="text-lg font-bold truncate" style={{ color: 'var(--text-main)' }}>
            {page === 'home' ? 'PharmaFlow' : page.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl"
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {actions}
        </div>
      </header>
      <main className="px-4 pt-6 flex-1">{children}</main>
    </div>
  </div>
);

function AppContent() {
  const [page, setPage] = useState('home');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [headerActions, setHeaderActions] = useState(null);

  useEffect(() => {
    const handleBackButton = () => {
      if (page !== 'home') {
        setPage('home');
        window.history.pushState(null, null, window.location.pathname);
      }
    };
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [page]);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setSelectedOrder(null); 
    setPage('take-order');
  };

  return (
    <Layout 
      page={editingOrder ? 'modify-order' : page}
      setPage={(p) => { 
        setPage(p); 
        if(p === 'home') {
          setEditingOrder(null); 
          setHeaderActions(null);
        }
      }}
      actions={headerActions}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    >
      {page === 'home' && <Dashboard setPage={setPage} onClick={setSelectedOrder} onEdit={handleEditOrder} />}
      {page === 'inventory' && <InventoryPage setHeaderActions={setHeaderActions} />}
      {page === 'customers' && <CustomersPage setHeaderActions={setHeaderActions} />}
      {page === 'employees' && <EmployeesPage setHeaderActions={setHeaderActions} />}
      {page === 'place-order' && <PlaceOrderPage setHeaderActions={setHeaderActions} setPage={setPage} />}
      {page === 'take-order' && <TakeOrderPage setHeaderActions={setHeaderActions} setPage={setPage} editingOrder={editingOrder} onReview={(order) => { setSelectedOrder(order); setPage('home'); }} />}
      {selectedOrder && <Dialogs order={selectedOrder} onClose={() => setSelectedOrder(null)} onEdit={handleEditOrder} />}
    </Layout>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}