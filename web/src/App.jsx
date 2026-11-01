import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectPlan from "./pages/ProjectPlan";
import ProjectAnalytics from "./pages/ProjectAnalytics";
import Taskboard from "./pages/Taskboard";
import Meetings from "./pages/Meetings";
import MeetingDetails from "./pages/MeetingDetails";
import ActionItems from "./pages/ActionItems";
import Decisions from "./pages/Decisions";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/projects/:projectId/plan" element={<ProjectPlan />} />
            <Route path="/projects/:projectId/tasks" element={<Taskboard />} />
            <Route path="/projects/:projectId/analytics" element={<ProjectAnalytics />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/meetings/:meetingId" element={<MeetingDetails />} />
            <Route path="/action-items" element={<ActionItems />} />
            <Route path="/decisions" element={<Decisions />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
