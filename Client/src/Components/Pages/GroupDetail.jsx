import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import CenteredToast from "../Common/CenteredToast";

export default function GroupDetail({ user }) {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "General",
    splits: [],
  });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadGroup();
    loadExpenses();
    loadFriends();
  }, [id]);

  const loadGroup = async () => {
    try {
      const data = await api.getGroup(id);
      setGroup(data.group);
    } catch (error) {
      console.error("Error loading group:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses(id);
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const loadFriends = async () => {
    try {
      const data = await api.getFriends();
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Invalid amount");
      return;
    }

    if (expenseForm.splits.length === 0) {
      setError("Select at least one person to split with");
      return;
    }

    // Calculate equal split
    const splitAmount = amount / (expenseForm.splits.length + 1); // +1 for the person paying
    const splits = [
      { user: user.id || user._id, amount: splitAmount },
      ...expenseForm.splits.map((userId) => ({
        user: userId,
        amount: splitAmount,
      })),
    ];

    try {
      const expenseData = {
        description: expenseForm.description,
        amount,
        groupId: id,
        category: expenseForm.category,
        splitType: "equal",
        splits,
      };
      console.log(
        "Sending expense data:",
        JSON.stringify(expenseData, null, 2)
      );
      await api.createExpense(expenseData);
      setExpenseForm({
        description: "",
        amount: "",
        category: "General",
        splits: [],
      });
      setShowExpenseModal(false);
      loadExpenses();
      setSuccessMessage("Expense has been added");
    } catch (err) {
      setError(err.message || "Failed to create expense");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");

    // Find friend by email
    const friend = friends.find((f) => f.user.email === newMemberEmail);
    if (!friend) {
      setError("Friend not found. They must be your friend first.");
      return;
    }

    try {
      await api.addGroupMember(id, friend.user.id || friend.user._id);
      setNewMemberEmail("");
      setShowAddMemberModal(false);
      loadGroup();
    } catch (err) {
      setError(err.message || "Failed to add member");
    }
  };

  const toggleSplitMember = (userId) => {
    setExpenseForm((prev) => ({
      ...prev,
      splits: prev.splits.includes(userId)
        ? prev.splits.filter((id) => id !== userId)
        : [...prev.splits, userId],
    }));
  };

  const isAdmin =
    group?.members.some(
      (m) =>
        (m.user.id || m.user._id) === (user.id || user._id) &&
        m.role === "admin"
    ) || false;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!group) {
    return <div className="text-center py-8">Group not found</div>;
  }

  // Get members who are not the current user
  const availableSplitMembers = group.members
    .filter((m) => (m.user.id || m.user._id) !== (user.id || user._id))
    .map((m) => m.user);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Link
            to="/groups"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            ← Back to Groups
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="mt-2 text-gray-600">{group.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Expenses</h2>
            {expenses.length === 0 ? (
              <p className="text-gray-500">No expenses yet</p>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-sm text-gray-500">
                          Paid by {expense.paidBy.name} • {expense.category}
                        </div>
                      </div>
                      <div className="font-semibold text-lg">
                        ₹{expense.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Split: {expense.splits.map((s) => s.user.name).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Members</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add
                </button>
              )}
            </div>
            <div className="space-y-2">
              {group.members.map((member) => (
                <div
                  key={member.user.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">
                      {member.user.name}
                      {member.role === "admin" && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Admin)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.user.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Add Expense</h2>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>General</option>
                  <option>Food</option>
                  <option>Travel</option>
                  <option>Entertainment</option>
                  <option>Bills</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split with
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableSplitMembers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No other members</p>
                  ) : (
                    availableSplitMembers.map((member) => (
                      <label
                        key={member.id || member._id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={expenseForm.splits.includes(
                            member.id || member._id
                          )}
                          onChange={() =>
                            toggleSplitMember(member.id || member._id)
                          }
                          className="mr-2"
                        />
                        <span>{member.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setExpenseForm({
                      description: "",
                      amount: "",
                      category: "General",
                      splits: [],
                    });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {successMessage && (
        <CenteredToast
          message={successMessage}
          duration={2000}
          onDone={() => setSuccessMessage("")}
        />
      )}

      {showAddMemberModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Add Member</h2>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Friend's Email
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMemberEmail("");
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
