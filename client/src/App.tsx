import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login/Login';
import Register from './pages/Registrar/Registrar';
import Home from './pages/Home/Home';
import './App.css';
import ForgotPassword from './components/auth/ForgotPassword/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword/ResetPassword';
import NotFound from './pages/NotFound/NotFound';
import PrivateRoute from './routes/PrivateRoute';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Clients from './pages/Clients/Clients';
import Projects from './pages/Projects/Projects';
import VerifyEmail from './components/auth/VerifyEmail/VerifyEmail';
import Invoices from './pages/Invoices/Invoices';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Future Private Routes - Example structure for when you add them */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <PrivateRoute>
                  <Clients />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <PrivateRoute>
                  <Projects />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <PrivateRoute>
                  <Invoices />
                </PrivateRoute>
              } 
            />
            
            {/* Role-specific routes example for future use */}
            {/* 
            <Route 
              path="/freelancer/*" 
              element={
                <PrivateRoute roles={['freelancer']}>
                  <FreelancerLayout />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/client/*" 
              element={
                <PrivateRoute roles={['client']}>
                  <ClientLayout />
                </PrivateRoute>
              } 
            />
            */}
            
            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;