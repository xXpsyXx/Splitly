import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { LayoutWithPrefetch as Layout } from "./Components/Layout/Layout";
import Login from "./Components/Pages/Login";
import Signup from "./Components/Pages/Signup";
import Dashboard from "./Components/Pages/Dashboard";
import Friends from "./Components/Pages/Friends";
import Groups from "./Components/Pages/Groups";
import GroupDetail from "./Components/Pages/GroupDetail";
import Expenses from "./Components/Pages/Expenses";
import { api } from "./lib/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/friends"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Friends user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/groups"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Groups user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/groups/:id"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <GroupDetail user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/expenses"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Expenses user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
