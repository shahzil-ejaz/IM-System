import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LoginView } from './components/features/auth/LoginView'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { POSLayout } from './components/features/pos/POSLayout'
import { ManagementLayout } from './components/features/management/ManagementLayout'
import { StockLedgerView } from './components/features/management/StockLedgerView'
import { ProcurementView } from './components/features/management/ProcurementView'
import { CatalogView } from './components/features/management/CatalogView'
import { UserControlCenter } from './components/features/management/UserControlCenter'
import { SystemMetadata } from './components/features/management/SystemMetadata'
import { GlobalAuditView } from './components/features/management/GlobalAuditView'

function App() {
  return (
    <Router>
      <Routes>
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
          path="/manager" 
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagementLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="ledger" replace />} />
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
          <Route index element={<Navigate to="ledger" replace />} />
          <Route path="ledger" element={<StockLedgerView />} />
          <Route path="procurement" element={<ProcurementView />} />
          <Route path="catalog" element={<CatalogView />} />
          <Route path="users" element={<UserControlCenter />} />
          <Route path="metadata" element={<SystemMetadata />} />
          <Route path="audit" element={<GlobalAuditView />} />
        </Route>

        {/* Default route redirect based on auth or to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
