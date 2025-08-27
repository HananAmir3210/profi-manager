import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Receipt, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  Calculator, 
  Settings, 
  Menu,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Expenses', href: '/expenses', icon: Calculator },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
      <Button
        variant="ghost"
        className="flex items-center space-x-3 px-3 py-2 w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="h-5 w-5" />
        <span>Sign Out</span>
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col overflow-y-auto border-r bg-card px-6 py-8">
          <div className="flex items-center space-x-2 mb-8">
            <Receipt className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Invoizo</h1>
          </div>
          <nav className="flex flex-1 flex-col space-y-2">
            <NavLinks />
          </nav>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-card border-b px-4 py-4">
          <div className="flex items-center space-x-2">
            <Receipt className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">Invoizo</h1>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex items-center space-x-2 mb-8">
                <Receipt className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-primary">Invoizo</h1>
              </div>
              <nav className="flex flex-col space-y-2">
                <NavLinks mobile />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;