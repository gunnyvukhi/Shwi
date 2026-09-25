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
import LanguageToggle from '../ui/button/LanguageToggle';
import { useAuthStore, useThemeStore } from '../../store';
import { PATHS } from '../../routes/paths';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
    isDarkTheme?: boolean;
    onToggleTheme?: () => void;
    activeNav?: string;
}

export default function Header({
    isDarkTheme: propIsDarkTheme,
    onToggleTheme: propOnToggleTheme,
    activeNav = 'Dashboard'
}: HeaderProps) {
    // Lấy dữ liệu theme từ store
    const storeTheme = useThemeStore((state) => state.isDarkTheme);
    const storeToggleTheme = useThemeStore((state) => state.toggleTheme);
    // nếu có prop thì dùng prop, ngược lại thì lấy dữ liệu trong store
    const isDarkTheme = propIsDarkTheme !== undefined ? propIsDarkTheme : storeTheme;
    const onToggleTheme = propOnToggleTheme || storeToggleTheme;

    // Lấy dữ liệu user từ store
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const navigate = useNavigate();
    const { t } = useLanguage();

    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate(PATHS.LOGIN);
    };

    const navItems = [
        { key: 'dashboard', name: t('nav.dashboard'), path: PATHS.DASHBOARD },
        { key: 'exercise', name: t('nav.exercise'), path: '#' },
        { key: 'nutrition', name: t('nav.nutrition'), path: '#' },
        { key: 'profile', name: t('nav.profile'), path: PATHS.PROFILE },
    ];

    return (
        <header>
            <div className="header-content">
                <div className="header-logo-wrap" onClick={() => navigate(PATHS.HOME)}>
                    <ShwiIcon size={20} />
                </div>

                <nav className="desktop-nav">
                    {navItems.map((item) => {
                        const isActive = activeNav === item.name || activeNav === item.key;
                        return (
                            <a
                                key={item.key}
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
                    <LanguageToggle />
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
                            title={isDarkTheme ? t('nav.lightMode') : t('nav.darkMode')}
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
                            src={user?.profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64"}
                            alt="User Avatar"
                        />
                    </button>

                    {profileOpen && (
                        <div className="dropdown-menu" onMouseLeave={() => setProfileOpen(false)}>
                            <div className="dropdown-header" onClick={() => { setProfileOpen(false); navigate(PATHS.PROFILE); }} style={{ cursor: 'pointer' }}>
                                <p className="dropdown-name">{user?.profile.name || 'Riku'}</p>
                                <p className="dropdown-email">{user?.profile.email || 'NPC@shwi.com'}</p>
                            </div>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item" onClick={() => { setProfileOpen(false); navigate(PATHS.PROFILE); }}>
                                <User size={16} /> {t('nav.profile')}
                            </button>
                            <button className="dropdown-item">
                                <Settings size={16} /> {t('nav.settings')}
                            </button>
                            {onToggleTheme && (
                                <button className="dropdown-item" onClick={onToggleTheme}>
                                    {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />} {isDarkTheme ? t('nav.lightMode') : t('nav.darkMode')}
                                </button>
                            )}
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item danger" onClick={handleLogout}>
                                <LogOut size={16} /> {t('nav.logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
