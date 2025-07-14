import React from 'react';
import { User, LogOut } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

interface NavbarProps {
  user?: User | null;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow text-white px-4 md:px-8 py-3 flex justify-between items-center tracking-wide">
      <div className="bg-orange-500 px-4 md:px-6 py-2 text-xs font-medium">
        SCCC AI Advisor
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user.firstName} {user.lastName}</span>
              {user.company && (
                <span className="text-gray-400 ml-2">• {user.company}</span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-sm font-normal text-gray-500">
            Sales Agent: Hiba
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;