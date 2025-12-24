import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Settings, Trash2, Edit, 
  Lock, UserPlus, ShieldCheck 
} from 'lucide-react';
import { useData } from '../App';

export default function EmployeesPage({ setHeaderActions }) {
  const { 
    employees = [], 
    deleteEmployee 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Move buttons to the top header
  useEffect(() => {
    setHeaderActions(
      <button 
        onClick={() => setIsAdding(true)}
        className="px-3 py-1.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2 transition-colors"
      >
        <UserPlus className="h-4 w-4" /> Add Employee
      </button>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(emp =>
      Object.values(emp).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [employees, searchTerm]);

  const headers = useMemo(() => {
    const headerSet = new Set(['name', 'password']);
    employees.forEach(emp => Object.keys(emp).forEach(k => {
        if (k !== 'id') headerSet.add(k);
    }));
    return Array.from(headerSet);
  }, [employees]);

  return (
    <div className="space-y-6 pb-24">
      {/* Old Header Removed */}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search staff by name or role..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50" title="Manage Columns">
          <Settings className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {headers.map(h => (
                  <th key={h} className="p-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    {h === 'password' ? (
                        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Password</span>
                    ) : h.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="p-4 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-rose-50/30 transition-colors group">
                    {headers.map(h => (
                      <td key={h} className="p-4 text-sm text-slate-700">
                        {h === 'password' ? '••••••••' : emp[h] || '—'}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteEmployee(emp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length + 1} className="p-12 text-center text-slate-400 text-sm italic">
                    No employees registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-lg border border-slate-200">
        <ShieldCheck className="h-4 w-4 text-slate-500" />
        <p className="text-xs text-slate-500 font-medium">
            Passwords are encrypted and only accessible by administrators.
        </p>
      </div>
    </div>
  );
}