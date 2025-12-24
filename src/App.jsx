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

const DataContext = createContext();

// Helper to safely load data from LocalStorage
const getLocal = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error(`Error loading ${key} from storage`, e);
    return defaultValue;
  }
};

export const DataProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => getLocal('orders', []));
  const [inventory, setInventory] = useState(() => getLocal('inventory', []));
  const [customers, setCustomers] = useState(() => getLocal('customers', []));
  const [employees, setEmployees] = useState(() => getLocal('employees', []));

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [orders, inventory, customers, employees]);

  const addOrder = (order) => setOrders(prev => [order, ...prev]);
  const updateOrder = (updated) => setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  const deleteOrder = (id) => setOrders(prev => prev.filter(o => o.id !== id));
  
  const addInventoryItem = (item) => setInventory(prev => [{...item, id: `item-${Date.now()}`}, ...prev]);
  const updateInventoryItem = (id, updated) => setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
  const deleteInventoryItem = (id) => setInventory(prev => prev.filter(i => i.id !== id));

  const addCustomer = (customer) => setCustomers(prev => [{ ...customer, id: `c-${Date.now()}` }, ...prev]);
  const updateCustomer = (id, updated) => setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  const deleteCustomer = (id) => setCustomers(prev => prev.filter(c => c.id !== id));

  const addEmployee = (emp) => setEmployees(prev => [{ ...emp, id: `e-${Date.now()}` }, ...prev]);
  const updateEmployee = (id, updated) => setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  const deleteEmployee = (id) => setEmployees(prev => prev.filter(e => e.id !== id));

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

// Layout must receive darkMode props to show the toggle
const Layout = ({ children, page, setPage, actions, darkMode, setDarkMode }) => (
  <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
    <div className="max-w-xl mx-auto min-h-screen shadow-2xl flex flex-col" style={{ backgroundColor: 'var(--bg-card)' }}>
      <header 
        style={{ paddingTop: 'var(--safe-area-top)', borderColor: 'var(--border)' }}
        className="flex items-center justify-between border-b sticky top-0 z-30 px-4 h-[calc(4rem+var(--safe-area-top))] bg-inherit backdrop-blur-md"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Back button shown on every page except home */}
          {page !== 'home' && (
            <button 
              onClick={() => setPage('home')} 
              className="p-1 rounded-full hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="h-6 w-6" style={{ color: 'var(--text-main)' }} />
            </button>
          )}

          {/* Icon shown ONLY on the Dashboard (home) */}
          {page === 'home' && <Pill className="h-6 w-6 text-emerald-500 shrink-0" />}

          {/* Capitalized Title */}
          <h1 
            className="text-lg font-bold truncate" 
            style={{ color: 'var(--text-main)' }}
          >
            {page === 'home' 
              ? 'PharmaFlow' 
              : page.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            }
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Mode Button: Always visible on every page */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl"
            style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Respective page buttons (Add Item, Import, etc.) remain untouched */}
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
  // 1. Function to handle the back button press
  const handleBackButton = (event) => {
    if (page !== 'home') {
      // If not on home, prevent default "Back" and go to home
      setPage('home');
      // Push the state again to keep the "trap" active for the next back press
      window.history.pushState(null, null, window.location.pathname);
    }
  };

  // 2. Push an initial dummy state to the history stack
  window.history.pushState(null, null, window.location.pathname);

  // 3. Listen for the 'popstate' event (triggered by hardware/browser back)
  window.addEventListener('popstate', handleBackButton);

  return () => {
    window.removeEventListener('popstate', handleBackButton);
  };
}, [page]); // Re-run whenever the page changes

  // DARK MODE LOGIC - Inside the component body
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark mode
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