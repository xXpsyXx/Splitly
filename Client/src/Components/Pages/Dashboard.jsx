import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function Dashboard({ user }) {
  const [balances, setBalances] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, expensesData] = await Promise.all([
        api.getBalanceSummary(),
        api.getExpenses(),
      ]);
      setBalances(balanceData.balances || []);
      setRecentExpenses(expensesData.expenses?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Balance Summary</h2>
          {balances.length === 0 ? (
            <p className="text-gray-500">No balances to show</p>
          ) : (
            <div className="space-y-3">
              {balances.map((balance, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center p-3 rounded ${
                    balance.amount > 0
                      ? "bg-green-50 text-green-800"
                      : balance.amount < 0
                      ? "bg-red-50 text-red-800"
                      : "bg-gray-50 text-gray-800"
                  }`}
                >
                  <div>
                    <div className="font-medium">{balance.user.name}</div>
                    <div className="text-sm opacity-75">
                      {balance.user.email}
                    </div>
                  </div>
                  <div className="font-bold">
                    {balance.amount > 0
                      ? `You owe ₹${Math.abs(balance.amount).toFixed(2)}`
                      : balance.amount < 0
                      ? `Owes you ₹${Math.abs(balance.amount).toFixed(2)}`
                      : "Settled up"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Expenses</h2>
            <Link
              to="/expenses"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-gray-500">No expenses yet</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-gray-500">
                        Paid by {expense.paidBy.name}
                        {expense.group && ` • ${expense.group.name}`}
                      </div>
                    </div>
                    <div className="font-semibold">
                      ₹{expense.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/friends"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Manage Friends</h3>
          <p className="text-gray-600 text-sm">Add and manage your friends</p>
        </Link>
        <Link
          to="/groups"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Create Group</h3>
          <p className="text-gray-600 text-sm">
            Create a group for shared expenses
          </p>
        </Link>
        <Link
          to="/expenses"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Add Expense</h3>
          <p className="text-gray-600 text-sm">Track your expenses</p>
        </Link>
      </div>
    </div>
  );
}
