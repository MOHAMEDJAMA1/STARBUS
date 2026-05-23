import { useState } from 'react';
import { LayoutDashboard, Box, Truck, Users, PlusCircle, ClipboardList, LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Sidebar({ role, activeView, onViewChange, userEmail, branchName }) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const adminItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'branches', label: 'Branches', icon: Truck },
        { id: 'all_shipments', label: 'Shipments', icon: Box },
        { id: 'users', label: 'Staff Management', icon: Users },
    ];

    const workerItems = [
        { id: 'worker_overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'receive', label: 'Add Delivery', icon: PlusCircle },
        { id: 'inventory', label: 'View Deliveries', icon: ClipboardList },
    ];

    const menuItems = role === 'super_admin' ? adminItems : workerItems;

    const handleNav = (id) => {
        onViewChange(id);
        setMobileOpen(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 pb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 shrink-0">
                        <Truck size={20} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-gray-900 leading-none truncate">
                            {role === 'branch_worker' && branchName ? `STARBUS — ${branchName}` : 'STARBUS'}
                        </h1>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
                            TRANSPORTATION & LOGISTICS
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNav(item.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all ${isActive
                                    ? 'bg-green-50 text-green-600'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon
                                size={20}
                                className={isActive ? 'text-green-500' : 'text-gray-400'}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-gray-100 space-y-2">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail || 'U')}&background=random&color=fff`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            {userEmail ? userEmail.split('@')[0].replace('.', ' ') : 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate capitalize">
                            {role === 'super_admin' ? 'Super Admin' : 'Branch Worker'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* ─── MOBILE HEADER BAR ─── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                        <Truck size={16} fill="currentColor" />
                    </div>
                    <span className="font-bold text-gray-900 text-base">STARBUS</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* ─── MOBILE OVERLAY ─── */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ─── MOBILE DRAWER ─── */}
            <div
                className={`lg:hidden fixed top-0 left-0 h-full z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>
                <SidebarContent />
            </div>

            {/* ─── DESKTOP SIDEBAR ─── */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col h-full shrink-0 font-sans">
                <SidebarContent />
            </aside>
        </>
    );
}
