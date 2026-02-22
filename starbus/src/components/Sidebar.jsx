import { LayoutDashboard, Box, Truck, Users, PlusCircle, Settings, ClipboardList, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Sidebar({ role, activeView, onViewChange, userEmail, branchName }) {
    const navigate = useNavigate();

    // Mockup 5 for Admin
    const adminItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'branches', label: 'Branches', icon: Truck },
        { id: 'all_shipments', label: 'Shipments', icon: Box },
        { id: 'users', label: 'Staff Management', icon: Users },

    ];

    // Mockup 2 for Worker
    const workerItems = [
        { id: 'worker_overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'receive', label: 'Add Delivery', icon: PlusCircle },
        { id: 'inventory', label: 'View Deliveries', icon: ClipboardList },
    ];

    const menuItems = role === 'super_admin' ? adminItems : workerItems;

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0 font-sans">

            {/* Logo */}
            <div className="p-6 pb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                        <Truck size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none">
                            {role === 'branch_worker' && branchName ? `STARBUS — ${branchName}` : 'STARBUS'}
                        </h1>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">TRANSPORTATION AND LOGISTICS</p>
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
                            onClick={() => onViewChange(item.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all ${isActive
                                ? 'bg-green-50 text-green-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'text-green-500' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                            {item.label}
                        </button>
                    );
                })}

                {/* System Label for Admin */}
                {role === 'super_admin' && (
                    <div className="mt-8 mb-2 px-4 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                        System
                    </div>
                )}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-100 space-y-4">



                {/* Sign Out Button */}
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/login', { replace: true });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                        <img
                            src={`https://ui-avatars.com/api/?name=${userEmail}&background=random&color=fff`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            {/* Simple name extraction or default */}
                            {userEmail ? (userEmail.split('@')[0].replace('.', ' ')) : 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">Worker ID: #772</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
