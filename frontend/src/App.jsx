import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LoginView } from './components/features/auth/LoginView'
import { LandingView } from './components/features/marketing/LandingView'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { POSLayout } from './components/features/pos/POSLayout'
import { SelfOrderLayout } from './components/features/self-order/SelfOrderLayout'
import { ManagementLayout } from './components/features/management/ManagementLayout'
import { StockLedgerView } from './components/features/management/StockLedgerView'
import { ProcurementView } from './components/features/management/ProcurementView'
import { CatalogView } from './components/features/management/CatalogView'
import { UserControlCenter } from './components/features/management/UserControlCenter'
import { SystemMetadata } from './components/features/management/SystemMetadata'
import { GlobalAuditView } from './components/features/management/GlobalAuditView'
import { PopupProvider } from './contexts/PopupContext'

import { DashboardView } from './components/features/management/DashboardView'
import { InteractiveBackground } from './components/ui/InteractiveBackground'

function App() {
  return (
    <PopupProvider>
      <Router>
        <InteractiveBackground />
        <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LoginView />} />
        
        <Route 
          path="/pos/*" 
          element={
            <ProtectedRoute allowedRoles={['cashier', 'admin', 'manager']}>
              <POSLayout />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/self-order/*" 
          element={
            <ProtectedRoute allowedRoles={['self_order', 'admin', 'manager']}>
              <SelfOrderLayout />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manager" 
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagementLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="ledger" element={<StockLedgerView />} />
          <Route path="procurement" element={<ProcurementView />} />
          <Route path="catalog" element={<CatalogView />} />
        </Route>
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManagementLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="ledger" element={<StockLedgerView />} />
          <Route path="procurement" element={<ProcurementView />} />
          <Route path="catalog" element={<CatalogView />} />
          <Route path="users" element={<UserControlCenter />} />
          <Route path="metadata" element={<SystemMetadata />} />
          <Route path="audit" element={<GlobalAuditView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </PopupProvider>
  )
}

export default App
