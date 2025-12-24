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
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  // --- Realtime Sync (Replaces getLocal) ---
  useEffect(() => {
    onValue(ref(db, 'orders'), (snapshot) => setOrders(snapshot.val() || []));
    onValue(ref(db, 'inventory'), (snapshot) => setInventory(snapshot.val() || []));
    onValue(ref(db, 'customers'), (snapshot) => setCustomers(snapshot.val() || []));
    onValue(ref(db, 'employees'), (snapshot) => setEmployees(snapshot.val() || []));
  }, []);

  // --- Actions (Updated to Save to Firebase) ---
  const addOrder = (order) => {
    const updated = [order, ...orders];
    set(ref(db, 'orders'), updated);
  };
  const updateOrder = (updated) => {
    const newData = orders.map(o => o.id === updated.id ? updated : o);
    set(ref(db, 'orders'), newData);
  };
  const deleteOrder = (id) => {
    const updated = orders.filter(o => o.id !== id);
    set(ref(db, 'orders'), updated);
  };
  
  const addInventoryItem = (item) => {
    const updated = [{...item, id: `item-${Date.now()}`}, ...inventory];
    set(ref(db, 'inventory'), updated);
  };
  const updateInventoryItem = (id, updated) => {
    const newData = inventory.map(item => item.id === id ? { ...item, ...updated } : item);
    set(ref(db, 'inventory'), newData);
  };
  const deleteInventoryItem = (id) => {
    const updated = inventory.filter(i => i.id !== id);
    set(ref(db, 'inventory'), updated);
  };

  const addCustomer = (customer) => {
    const updated = [{ ...customer, id: `c-${Date.now()}` }, ...customers];
    set(ref(db, 'customers'), updated);
  };
  const updateCustomer = (id, updated) => {
    const newData = customers.map(c => c.id === id ? { ...c, ...updated } : c);
    set(ref(db, 'customers'), newData);
  };
  const deleteCustomer = (id) => {
    const updated = customers.filter(c => c.id !== id);
    set(ref(db, 'customers'), updated);
  };

  const addEmployee = (emp) => {
    const updated = [{ ...emp, id: `e-${Date.now()}` }, ...employees];
    set(ref(db, 'employees'), updated);
  };
  const updateEmployee = (id, updated) => {
    const newData = employees.map(e => e.id === id ? { ...e, ...updated } : e);
    set(ref(db, 'employees'), newData);
  };
  const deleteEmployee = (id) => {
    const updated = employees.filter(e => e.id !== id);
    set(ref(db, 'employees'), updated);
  };

  return (
    <DataContext.Provider value={{ 
      orders, inventory, customers, employees, 
      addOrder, updateOrder, deleteOrder,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addCustomer, updateCustomer, deleteCustomer,
      addEmployee, updateEmployee, deleteEmployee
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

const Layout = ({ children, page, setPage, actions, darkMode, setDarkMode }) => (
  <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
    <div className="max-w-xl mx-auto min-h-screen shadow-2xl flex flex-col" style={{ backgroundColor: 'var(--bg-card)' }}>
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
      {page === 'take-order' && <TakeOrderPage setHeaderActions={setHeaderActions} setPage={setPage} editingOrder={editingOrder} onReview={setSelectedOrder} />}
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
