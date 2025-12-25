"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  Key, 
  Variable, 
  Smartphone, 
  LogOut, 
  Lock,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Passwords', href: '/passwords', icon: Key },
  { name: 'Env Variables', href: '/env-vars', icon: Variable },
  { name: 'TOTP Codes', href: '/totp', icon: Smartphone },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, lock } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b-2 border-gray-200 flex items-center px-4">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 uppercase tracking-wide">SecureVault</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-gray-50 border-r-2 border-gray-200 
        transform transition-transform duration-200 ease-out 
        lg:translate-x-0 lg:static lg:shrink-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-4 px-6 py-6 border-b-2 border-gray-200">
            <div className="p-2 bg-primary">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 uppercase tracking-wide">SecureVault</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Password Manager</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3 text-sm font-semibold uppercase tracking-wide 
                    transition-all duration-150 border-2
                    ${isActive
                      ? "bg-primary text-white border-primary"
                      : "text-gray-700 border-transparent hover:bg-gray-100 hover:border-gray-200"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-4 py-5 border-t-2 border-gray-200 bg-white">
            <div className="mb-4 px-2">
              <p className="text-sm font-bold text-gray-900 truncate uppercase tracking-wide">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={lock}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wide border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
              >
                <Lock className="h-4 w-4" />
                Lock
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wide border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
