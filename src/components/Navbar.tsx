import React, { useState } from 'react';
import {
  Package,
  Search,
  Truck,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Menu,
  X,
  User,
  Shield,
  ChevronRight,
  Clock,
  Store,
  Briefcase,
  LayoutDashboard,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  portal: 'consumer' | 'staff' | 'admin';
  setPortal: (portal: 'consumer' | 'staff' | 'admin') => void;
  userRole?: UserRole;
  setUserRole?: (role: UserRole) => void;
  onOpenArchitecture: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  portal,
  setPortal,
  onOpenArchitecture,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'services', label: 'Services', icon: Package, desc: 'Shipping & Mailbox rates' },
    { id: 'track', label: 'Track', icon: Search, desc: 'Live status & GPS updates' },
    { id: 'pickup', label: 'Pickup', icon: Truck, desc: 'Doorstep package pickup' },
    { id: 'appointment', label: 'Appointments', icon: Calendar, desc: 'Notary & store consultations' },
    { id: 'invoices', label: 'Pay Bill', icon: CreditCard, desc: 'Invoices & digital receipts' },
  ];

  const handleNavClick = (tabId: string) => {
    setPortal('consumer');
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleSwitchPortal = (target: 'consumer' | 'staff' | 'admin') => {
    setPortal(target);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
      {/* Light, Minimal Utility Strip & Portal Switcher */}
      <div className="bg-slate-50 border-b border-gray-100 text-xs text-slate-600 px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-xs truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">2450 Piedmont Rd NE, Atlanta, GA</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-slate-500">Carrier Cutoff: 5:30 PM</span>
          </div>

          {/* Portal Switcher & Phone */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs">
            <a
              href="tel:+14045550199"
              className="font-semibold text-slate-800 hover:text-blue-600 transition flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 text-blue-600" />
              <span>(404) 555-0199</span>
            </a>

            <span className="text-slate-300">|</span>

            {/* Dashboards Toggle Tabs */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => handleSwitchPortal('consumer')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  portal === 'consumer'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3 h-3" />
                <span>Storefront</span>
              </button>

              <button
                onClick={() => handleSwitchPortal('staff')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  portal === 'staff'
                    ? 'bg-amber-500 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3 h-3" />
                <span>Staff</span>
              </button>

              <button
                onClick={() => handleSwitchPortal('admin')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  portal === 'admin'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Clean Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Decluttered Brand Logo */}
          <div
            onClick={() => handleNavClick('services')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
            title="JB & Best Logistics"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                JB & Best
              </span>
              <span className="font-display font-medium text-sm text-slate-500">
                Logistics
              </span>
            </div>

            {portal !== 'consumer' && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  portal === 'staff'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-slate-900 text-white border border-slate-700'
                }`}
              >
                {portal === 'staff' ? 'Staff Portal' : 'Admin Console'}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          {portal === 'consumer' ? (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Current Dashboard:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 font-bold capitalize">
                {portal} Management
              </span>
            </div>
          )}

          {/* Right Action CTA & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {portal === 'consumer' ? (
              <button
                onClick={() => handleNavClick('track')}
                className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xs transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track Package</span>
              </button>
            ) : (
              <button
                onClick={() => handleSwitchPortal('consumer')}
                className="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>Exit to Storefront</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in fade-in duration-150">
          {/* Mobile Portal Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Dashboard:
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-center">
              <button
                onClick={() => handleSwitchPortal('consumer')}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  portal === 'consumer' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Storefront
              </button>
              <button
                onClick={() => handleSwitchPortal('staff')}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  portal === 'staff' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => handleSwitchPortal('admin')}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  portal === 'admin' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {portal === 'consumer' && (
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-xs text-slate-400 font-normal">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 space-y-2 text-center text-xs text-slate-500">
            <a
              href="tel:+14045550199"
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Call Store: (404) 555-0199</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
