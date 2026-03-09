import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Plane, LogOut, User, LayoutDashboard, Map, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { t } = useTranslation();
    const { user, actingRole, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
        toast.success("Logged out successfully");
    };



    return (
        <nav className="sticky top-0 z-40 w-full backdrop-blur-lg bg-slate-900/60 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="p-2 bg-blue-600 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
                            <Plane className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            {actingRole === 'owner' ? t('app_name_owner') : t('app_name')}
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{t('home')}</Link>
                        {actingRole === 'owner' && (
                            <Link to="/owner/bookings" className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                <Clock className="w-4 h-4" /> Manage Bookings
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    to={actingRole === 'owner' ? '/owner-dashboard' : '/dashboard'}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                    title={actingRole === 'owner' ? "Owner Dashboard" : "My Dashboard"}
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                </Link>
                                {actingRole === 'guest' && (
                                    <Link
                                        to="/my-bookings"
                                        className="p-2 text-slate-400 hover:text-white transition-colors"
                                        title="My Bookings"
                                    >
                                        <Clock className="w-5 h-5" />
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600/10 border border-red-600/20 rounded-lg hover:bg-red-600/20 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('logout')}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                    {t('login')}
                                </Link>
                                <Link to="/register" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                                    {t('register')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
