import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

      {/* Main content */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-100">
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100%' }}>
            {children}
          </div>
        </main>
        <footer className="cs-footer">
          © 2025 CS Lee — dev-cs.cloud
        </footer>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-50">
        <label htmlFor="sidebar-toggle" aria-label="close sidebar" className="drawer-overlay" />
        <Sidebar />
      </div>
    </div>
  );
}