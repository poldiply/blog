import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      
      {/* 메인 컨텐츠 영역 */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-100">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
        
        <footer className="footer footer-center p-4 bg-base-300 text-base-content">
          <aside>
            <p>Copyright © 2025 - All right reserved by Dev.CS</p>
          </aside>
        </footer>
      </div> 
      
      {/* 사이드바 영역 */}
      <div className="drawer-side z-50">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label> 
        <Sidebar />
      </div>
    </div>
  );
}