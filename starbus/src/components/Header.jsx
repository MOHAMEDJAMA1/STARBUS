import { User, LogOut, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Header({ profile, branchName, toggleSidebar }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-20" style={{
            borderBottom: '1px solid var(--color-border)',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 2rem'
        }}>
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto">

                {/* Left: Logo & Branch Name */}
                <div className="flex items-center gap-4">
                    <button className="md:hidden text-gray-600" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Logo Placeholder - You can replace with <img /> if needed */}
                        <div className="flex items-center justify-center bg-primary text-white rounded-md" style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'var(--color-primary)'
                        }}>
                            <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>S</span>
                        </div>

                        <div className="flex flex-col">
                            <span style={{
                                fontWeight: 800,
                                fontSize: '1.25rem',
                                color: 'var(--color-primary)',
                                lineHeight: 1,
                                letterSpacing: '-0.02em'
                            }}>
                                STARBUS
                            </span>
                            <span style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {profile.role === 'super_admin' ? 'Admin Dashboard' : (branchName || 'Loading Branch...')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: User Info & Logout */}
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                            {profile.full_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {profile.email}
                        </span>
                    </div>

                    <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--color-border)' }} className="hidden md:block"></div>

                    <button
                        onClick={handleLogout}
                        title="Sign Out"
                        style={{
                            color: 'var(--color-text-secondary)',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={20} />
                    </button>
                </div>

            </div>
        </header>
    );
}
