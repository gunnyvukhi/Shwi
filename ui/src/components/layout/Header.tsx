import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import {
    MessageSquare,
    Bell,
    User,
    Settings,
    Sun,
    Moon,
    LogOut
} from 'lucide-react';
import ShwiIcon from '../ui/icon/ShwiIcon';
import { useAuthStore } from '../../store/useAuthStore';
import { PATHS } from '../../routes/paths';

interface HeaderProps {
    isDarkTheme?: boolean;
    onToggleTheme?: () => void;
    activeNav?: string;
}

export default function Header({
    isDarkTheme = true,
    onToggleTheme,
    activeNav = 'Dashboard'
}: HeaderProps) {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate(PATHS.LOGIN);
    };

    return (
        <header>
            <div className="header-content">
                <div className="header-logo-wrap" onClick={() => navigate(PATHS.HOME)}>
                    <ShwiIcon size={20} />
                </div>

                <nav className="desktop-nav">
                    {[
                        { name: 'Dashboard', path: PATHS.DASHBOARD },
                        { name: 'Workouts', path: '#' },
                        { name: 'Nutrition', path: '#' },
                        { name: 'Profile', path: PATHS.PROFILE },
                    ].map((item) => {
                        const isActive = activeNav === item.name;
                        return (
                            <a
                                key={item.name}
                                href={item.path}
                                className={isActive ? 'active-primary' : ''}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (item.path !== '#') {
                                        navigate(item.path);
                                    }
                                }}
                            >
                                {item.name}
                            </a>
                        );
                    })}
                </nav>

                <div className="header-actions">
                    <button className="icon-btn" aria-label="Messages">
                        <MessageSquare size={20} />
                    </button>
                    <button className="icon-btn" aria-label="Notifications">
                        <Bell size={20} />
                    </button>
                    {onToggleTheme && (
                        <button
                            className="icon-btn"
                            aria-label="Toggle theme"
                            onClick={onToggleTheme}
                            title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    )}

                    <button
                        className="avatar-btn"
                        onClick={() => setProfileOpen(!profileOpen)}
                        aria-label="User menu"
                    >
                        <img
                            src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64"}
                            alt="User Avatar"
                        />
                    </button>

                    {profileOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <p className="dropdown-name">{user?.name || 'Jane Doe'}</p>
                                <p className="dropdown-email">{user?.email || 'jane@example.com'}</p>
                            </div>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item">
                                <User size={16} /> Profile
                            </button>
                            <button className="dropdown-item">
                                <Settings size={16} /> Settings
                            </button>
                            {onToggleTheme && (
                                <button className="dropdown-item" onClick={onToggleTheme}>
                                    {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />} {isDarkTheme ? 'Light Mode' : 'Dark Mode'}
                                </button>
                            )}
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item danger" onClick={handleLogout}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
