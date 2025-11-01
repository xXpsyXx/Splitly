import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, transactionsData] = await Promise.all([
        api.getExpenses(),
        api.getTransactions(),
      ]);
      setExpenses(expensesData.expenses || []);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (transactionId) => {
    try {
      await api.settleTransaction(transactionId);
      loadData();
    } catch (error) {
      console.error("Error settling transaction:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  );

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Expenses & Transactions
        </h1>
        <p className="mt-2 text-gray-600">
          View all your expenses and settle up
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">All Expenses</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500">No expenses yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {expenses.map((expense) => (
                <div
                  key={expense._id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex justify-between items-start mb-2">
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
                  <div className="text-sm text-gray-600">
                    {expense.category} •{" "}
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Settlements</h2>
          {pendingTransactions.length === 0 ? (
            <p className="text-gray-500">All settled up!</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingTransactions.map((transaction) => {
                const toUserId =
                  transaction.toUser.id || transaction.toUser._id;
                const userId = user.id || user._id;
                const isOwed = toUserId === userId;
                const otherUser = isOwed
                  ? transaction.fromUser
                  : transaction.toUser;

                return (
                  <div
                    key={transaction._id}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">
                          {isOwed
                            ? `${otherUser.name} owes you`
                            : `You owe ${otherUser.name}`}
                        </div>
                        {transaction.expense && (
                          <div className="text-sm text-gray-500">
                            {transaction.expense.description}
                          </div>
                        )}
                      </div>
                      <div
                        className={`font-semibold ${
                          isOwed ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isOwed ? "+" : "-"}₹{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                    {!isOwed && (
                      <button
                        onClick={() => handleSettle(transaction._id)}
                        className="mt-2 px-4 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        Settle Up
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
