'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Phone, UserPlus, Search, Send, Trash2, ChevronDown, ChevronUp, Menu, X } from 'lucide-react';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  reported: boolean;
  employeeId?: string;
}

interface JobberExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export default function BankReconciler() {
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [jobberExpenses, setJobberExpenses] = useState<JobberExpense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'employees'>('transactions');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form states
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', email: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Parse CSV/Excel content
  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header.toLowerCase().replace(/\s+/g, '_')] = values[i]?.trim() || '';
      });
      return obj;
    });
  };

  // Handle bank file upload
  const handleBankUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      
      const transactions: BankTransaction[] = parsed.map((row, idx) => ({
        id: `bank-${idx}`,
        date: row.date || row.transaction_date || new Date().toISOString().split('T')[0],
        description: row.description || row.payee || row.merchant || 'Unknown',
        amount: parseFloat(row.amount || row.debit || 0),
        reported: false,
      }));
      
      setBankTransactions(transactions);
      matchTransactions(transactions, jobberExpenses);
    };
    reader.readAsText(file);
  }, [jobberExpenses]);

  // Handle Jobber file upload
  const handleJobberUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      
      const expenses: JobberExpense[] = parsed.map((row, idx) => ({
        id: `jobber-${idx}`,
        date: row.date || row.expense_date || new Date().toISOString().split('T')[0],
        description: row.description || row.vendor || row.category || 'Unknown',
        amount: parseFloat(row.amount || row.total || 0),
      }));
      
      setJobberExpenses(expenses);
      matchTransactions(bankTransactions, expenses);
    };
    reader.readAsText(file);
  }, [bankTransactions]);

  // Match transactions
  const matchTransactions = (bank: BankTransaction[], jobber: JobberExpense[]) => {
    const matched = bank.map(transaction => {
      const match = jobber.find(expense => 
        Math.abs(expense.amount - transaction.amount) < 0.01 &&
        (expense.description.toLowerCase().includes(transaction.description.toLowerCase()) ||
         transaction.description.toLowerCase().includes(expense.description.toLowerCase()))
      );
      return { ...transaction, reported: !!match };
    });
    setBankTransactions(matched);
  };

  // Add employee
  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.phone) return;
    
    const employee: Employee = {
      id: `emp-${Date.now()}`,
      ...newEmployee,
    };
    
    setEmployees([...employees, employee]);
    setNewEmployee({ name: '', phone: '', email: '' });
    setShowEmployeeForm(false);
  };

  // Delete employee
  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  // Send SMS reminder
  const sendSmsReminder = (employee: Employee, transaction: BankTransaction) => {
    // In production, this would call your SMS API (Twilio, etc.)
    alert(`SMS sent to ${employee.name} (${employee.phone}):\n\nPlease submit receipt for: ${transaction.description} - $${transaction.amount.toFixed(2)}`);
    setSmsModalOpen(false);
    setSelectedTransaction(null);
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone.includes(searchTerm)
  );

  // Unreported transactions
  const unreportedTransactions = bankTransactions.filter(t => !t.reported);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Bank Reconciler
            </h1>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Desktop tabs */}
            <div className="hidden md:flex gap-4">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'transactions' ? 'bg-white text-blue-600' : 'text-blue-100 hover:bg-blue-500'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'employees' ? 'bg-white text-blue-600' : 'text-blue-100 hover:bg-blue-500'
                }`}
              >
                Employees ({employees.length})
              </button>
            </div>
          </div>
          
          {/* Mobile tabs */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 flex flex-col gap-2">
              <button
                onClick={() => { setActiveTab('transactions'); setMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-lg font-medium text-left ${
                  activeTab === 'transactions' ? 'bg-white text-blue-600' : 'text-blue-100'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => { setActiveTab('employees'); setMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-lg font-medium text-left ${
                  activeTab === 'employees' ? 'bg-white text-blue-600' : 'text-blue-100'
                }`}
              >
                Employees ({employees.length})
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'transactions' ? (
          <>
            {/* Upload Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Bank Upload */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Bank Transactions
                </h2>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Upload CSV file</p>
                  </div>
                  <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBankUpload} />
                </label>
                {bankTransactions.length > 0 && (
                  <p className="mt-3 text-sm text-gray-600">
                    {bankTransactions.length} transactions loaded
                  </p>
                )}
              </div>

              {/* Jobber Upload */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Jobber Expenses
                </h2>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Upload Jobber report</p>
                  </div>
                  <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleJobberUpload} />
                </label>
                {jobberExpenses.length > 0 && (
                  <p className="mt-3 text-sm text-gray-600">
                    {jobberExpenses.length} expenses loaded
                  </p>
                )}
              </div>
            </div>

            {/* Results Section */}
            {bankTransactions.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-lg font-semibold">Transaction Comparison</h2>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Reported: {bankTransactions.filter(t => t.reported).length}
                    </span>
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Unreported: {unreportedTransactions.length}
                    </span>
                  </div>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bankTransactions.map((transaction) => (
                        <tr 
                          key={transaction.id} 
                          className={`${!transaction.reported ? 'bg-red-50' : ''} hover:bg-gray-50`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.date}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {transaction.reported ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Reported
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Missing
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {!transaction.reported && employees.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction.id);
                                  setSmsModalOpen(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Send SMS
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  {bankTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className={`p-4 border-b border-gray-200 ${!transaction.reported ? 'bg-red-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-500">{transaction.date}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          transaction.reported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.reported ? 'Reported' : 'Missing'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2">{transaction.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">${transaction.amount.toFixed(2)}</span>
                        {!transaction.reported && employees.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction.id);
                              setSmsModalOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            SMS
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Employees Tab */
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-semibold">Employee Directory</h2>
              <button
                onClick={() => setShowEmployeeForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Add Employee Form */}
            {showEmployeeForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-4">Add New Employee</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={addEmployee}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowEmployeeForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Employee List */}
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No employees yet. Add your first employee to enable SMS reminders.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {employee.phone}
                        </p>
                        {employee.email && (
                          <p className="text-sm text-gray-500 mt-1">{employee.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteEmployee(employee.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SMS Modal */}
      {smsModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Send SMS Reminder</h3>
            <p className="text-gray-600 mb-4">
              Select employee to notify about missing receipt for:<br />
              <span className="font-medium text-gray-900">
                {bankTransactions.find(t => t.id === selectedTransaction)?.description} - 
                ${bankTransactions.find(t => t.id === selectedTransaction)?.amount.toFixed(2)}
              </span>
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => sendSmsReminder(
                    employee, 
                    bankTransactions.find(t => t.id === selectedTransaction)!
                  )}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.phone}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSmsModalOpen(false); setSelectedTransaction(null); }}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
