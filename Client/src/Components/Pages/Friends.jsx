import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function Friends({ user }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const [friendsData, pendingData] = await Promise.all([
        api.getFriends(),
        api.getPendingRequests(),
      ]);
      setFriends(friendsData.friends || []);
      setPendingRequests(pendingData.requests || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.sendFriendRequest(email);
      setEmail("");
      loadFriends();
    } catch (err) {
      setError(err.message || "Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await api.acceptFriendRequest(id);
      loadFriends();
    } catch (err) {
      setError(err.message || "Failed to accept request");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
        <p className="mt-2 text-gray-600">
          Manage your friends and connections
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Friend</h2>
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter friend's email"
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Send Request
          </button>
        </form>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium">{request.user.name}</div>
                  <div className="text-sm text-gray-500">
                    {request.user.email}
                  </div>
                </div>
                <button
                  onClick={() => handleAcceptRequest(request._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Your Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-gray-500">
            No friends yet. Add some friends to get started!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="font-medium">{friend.user.name}</div>
                <div className="text-sm text-gray-500">{friend.user.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
