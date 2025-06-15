"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import CustomSelect from "@/components/CustomSelect";
import { Expense, CreateExpenseRequest, SettleExpenseRequest, HouseMember } from "@/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faDollarSign, faMoneyBillTransfer, faReceipt, faUser } from "@fortawesome/free-solid-svg-icons";
import { buildApiUrl, devLog, devError } from "@/utils/config";

interface HouseBalance {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Expense tracking state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [houseBalances, setHouseBalances] = useState<HouseBalance[]>([]);
  
  // Create expense form state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newExpense, setNewExpense] = useState<CreateExpenseRequest>({
    amount: 0,
    description: "",
    split_between: []
  });

  // Settlement form state
  const [showSettleForm, setShowSettleForm] = useState<boolean>(false);
  const [settlement, setSettlement] = useState<SettleExpenseRequest>({
    amount: 0,
    to_email: "",
    description: ""
  });

  // Error and success messages
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Create roommate options for the settlement dropdown
  const roommateOptions = houseBalances
    .filter(member => member.email !== user?.email)
    .map(member => ({
      value: member.email,
      label: `${member.firstName} (${member.email})`,
      icon: faUser
    }));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await Promise.all([
          fetchExpenses(authUser),
          fetchHouseBalances(authUser)
        ]);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  /** Fetch House Expenses */
  const fetchExpenses = async (authUser: User) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch(buildApiUrl("/expense/list"), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setExpenses(data.data.expenses || []);
      } else {
        devError("Error fetching expenses:", data.message);
      }
    } catch (error) {
      devError("Error fetching expenses:", error);
    }
  };

  /** Fetch House Member Balances */
  const fetchHouseBalances = async (authUser: User) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch(buildApiUrl("/expense/balances"), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        devLog("Entire response", data);
        setHouseBalances(data.data.members || []);
        // Pre-populate split_between with all house member emails
        setNewExpense(prev => ({
          ...prev,
          split_between: data.data.members.map((member: HouseBalance) => member.email)
        }));
      } else {
        devError("Error fetching balances:", data.message);
      }
    } catch (error) {
      devError("Error fetching balances:", error);
    }
  };

  /** Create a New Expense */
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

        try {
          const token = await user.getIdToken();
      const response = await fetch(buildApiUrl("/expense/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newExpense)
          });

          const data = await response.json();
          if (response.ok) {
        setMessage(`Expense created! $${newExpense.amount} split ${newExpense.split_between.length} ways`);
        setMessageType("success");
        setShowCreateForm(false);
        setNewExpense({ amount: 0, description: "", split_between: [] });
        
        // Refresh data
        await Promise.all([
          fetchExpenses(user),
          fetchHouseBalances(user)
        ]);
          } else {
        setMessage(`Error: ${data.message}`);
        setMessageType("error");
          }
        } catch (error) {
      devError("Error creating expense:", error);
      setMessage("Error creating expense");
      setMessageType("error");
    }
  };

  /** Settle a Payment */
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(buildApiUrl("/expense/settle"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settlement)
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Payment of $${settlement.amount} sent to ${settlement.to_email}`);
        setMessageType("success");
        setShowSettleForm(false);
        setSettlement({ amount: 0, to_email: "", description: "" });
        
        // Refresh balances
        await fetchHouseBalances(user);
      } else {
        setMessage(`Error: ${data.message}`);
        setMessageType("error");
      }
    } catch (error) {
      devError("Error settling payment:", error);
      setMessage("Error settling payment");
      setMessageType("error");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      devError("Logout error:", error);
    }
  };

  /** Toggle member in split_between list */
  const toggleMemberInSplit = (email: string) => {
    setNewExpense(prev => ({
      ...prev,
      split_between: prev.split_between.includes(email)
        ? prev.split_between.filter(e => e !== email)
        : [...prev.split_between, email]
    }));
  };

  /** Helper function to convert email to first name */
  const getFirstNameFromEmail = (email: string) => {
    const member = houseBalances.find(member => member.email === email);
    return member ? member.firstName : email;
  };

  /** Helper function to format date safely */
  const formatDate = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) {
        return "Recent";
      }
      return date.toLocaleDateString();
    } catch (error) {
      return "Recent";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col relative overflow-x-hidden">
      {/* Page Background Decorations */}
      <div className="fixed bottom-0 left-0 w-full pointer-events-none -z-1">
        <div className="flex justify-between items-end h-[80vh]">
          <div className="min-w-[6rem] md:min-w-[8rem] -ml-32 md:-ml-48 h-full flex items-end">
            <Image
              src="/column.png"
              alt="Left Column"
              width={128}
              height={600}
              className="w-full h-[600px] object-cover"
            />
          </div>
          <div className="min-w-[6rem] md:min-w-[8rem] -mr-32 md:-mr-48 h-full flex items-end">
            <Image
              src="/column.png"
              alt="Right Column"
              width={128}
              height={600}
              className="w-full h-[600px] object-cover"
            />
          </div>
        </div>
      </div>

      <Navigation
        title="Roomiez Expenses"
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 mt-6 space-y-6 relative z-30">
        
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            messageType === "success" 
              ? "bg-green-100 text-green-800 border border-green-300" 
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {message}
            <button
              onClick={() => setMessage("")}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* House Balances Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faDollarSign} className="text-green-600" />
            House Balances
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {houseBalances.map((member) => (
              <div 
                key={member.email} 
                className={`p-4 rounded-lg border-2 ${
                  member.balance >= 0 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3 className="font-semibold text-gray-800">
                  {member.firstName} {member.lastName}
                </h3>
                <p className={`text-lg font-bold ${
                  member.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  ${member.balance.toFixed(2)}
                  <span className="text-sm font-normal ml-1">
                    {member.balance >= 0 ? "owed to them" : "they owe"}
            </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#F17141] text-white rounded-lg hover:bg-[#E85A2B] transition-colors font-semibold text-sm sm:text-base"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Expense
          </button>
          
            <button
            onClick={() => setShowSettleForm(!showSettleForm)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base"
            >
            <FontAwesomeIcon icon={faMoneyBillTransfer} />
            Settle Payment
            </button>
        </div>

        {/* Create Expense Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Add New Expense</h3>
            
            <form onSubmit={handleCreateExpense} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newExpense.amount || ""}
                    onChange={(e) => setNewExpense(prev => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full max-w-xs p-2 sm:p-3 border-2 border-[#F17141] rounded-md bg-[#FFECAE] text-gray-800 font-semibold hover:bg-[#FFE082] focus:bg-white focus:ring-2 focus:ring-[#F17141] transition-colors text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    placeholder="e.g., Groceries, Utilities, Dinner"
                    className="w-full p-2 sm:p-3 border-2 border-[#F17141] rounded-md bg-[#FFECAE] text-gray-800 font-semibold hover:bg-[#FFE082] focus:bg-white focus:ring-2 focus:ring-[#F17141] transition-colors text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split Between (select who should pay):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {houseBalances.map((member) => (
                    <label 
                      key={member.email} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        newExpense.split_between.includes(member.email)
                          ? "bg-blue-50 border-blue-300 shadow-sm"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center transition-all duration-200 ${
                          newExpense.split_between.includes(member.email)
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-gray-300 hover:border-blue-400"
                        }`}
                        onClick={() => toggleMemberInSplit(member.email)}
                      >
                        {newExpense.split_between.includes(member.email) && (
                          <svg 
                            className="w-3 h-3 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={newExpense.split_between.includes(member.email)}
                        onChange={() => toggleMemberInSplit(member.email)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <span className={`font-medium ${
                          newExpense.split_between.includes(member.email)
                            ? "text-blue-800"
                            : "text-gray-700"
                        }`}>
                          {member.firstName} {member.lastName}
                        </span>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {newExpense.split_between.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      💰 Amount per person: ${(newExpense.amount / newExpense.split_between.length).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {newExpense.split_between.length} roommate{newExpense.split_between.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  type="submit"
                  disabled={newExpense.split_between.length === 0 || newExpense.amount <= 0}
                  className="px-6 py-2 sm:py-3 bg-[#F17141] text-white rounded-md hover:bg-[#E85A2B] disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm sm:text-base transition-colors"
                >
                  Create Expense
                </button>
            <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 sm:py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold text-sm sm:text-base transition-colors"
            >
                  Cancel
            </button>
              </div>
            </form>
          </div>
        )}

        {/* Settle Payment Form */}
        {showSettleForm && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Settle Payment</h3>
            
            <form onSubmit={handleSettlePayment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settlement.amount || ""}
                    onChange={(e) => setSettlement(prev => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full max-w-xs p-2 sm:p-3 border-2 border-[#F17141] rounded-md bg-[#FFECAE] text-gray-800 font-semibold hover:bg-[#FFE082] focus:bg-white focus:ring-2 focus:ring-[#F17141] transition-colors text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay To
                  </label>
                  <CustomSelect
                    options={roommateOptions}
                    value={settlement.to_email}
                    onChange={(selectedEmail) => setSettlement(prev => ({ 
                      ...prev, 
                      to_email: selectedEmail 
                    }))}
                    placeholder="Select a roommate"
                    icon={faUser}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={settlement.description || ""}
                  onChange={(e) => setSettlement(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="e.g., Paying back for groceries"
                  className="w-full p-2 sm:p-3 border-2 border-[#F17141] rounded-md bg-[#FFECAE] text-gray-800 font-semibold hover:bg-[#FFE082] focus:bg-white focus:ring-2 focus:ring-[#F17141] transition-colors text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  type="submit"
                  disabled={settlement.amount <= 0 || !settlement.to_email}
                  className="px-6 py-2 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm sm:text-base transition-colors"
                >
                  Send Payment
                </button>
            <button
                  type="button"
                  onClick={() => setShowSettleForm(false)}
                  className="px-6 py-2 sm:py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold text-sm sm:text-base transition-colors"
            >
                  Cancel
            </button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faReceipt} className="text-blue-600" />
            Recent Expenses
          </h2>
          
          {expenses.length === 0 ? (
            <p className="text-gray-600">No expenses yet. Create your first expense above!</p>
          ) : (
            <div className="space-y-4">
              {expenses.slice(0, 10).map((expense) => (
                <div key={expense.expense_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{expense.description}</h4>
                      <p className="text-sm text-gray-600">
                        Paid by: {getFirstNameFromEmail(expense.paid_by)} • ${expense.amount.toFixed(2)} total
                      </p>
                      <p className="text-sm text-gray-600">
                        Split {expense.split_between.length} ways • ${expense.amount_per_person.toFixed(2)} each
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(expense.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        expense.settled 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {expense.settled ? "Settled" : "Pending"}
            </span>
          </div>
        </div>

                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Split between:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {expense.split_between.map((email, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {getFirstNameFromEmail(email)}
                        </span>
                      ))}
                    </div>
          </div>
        </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

