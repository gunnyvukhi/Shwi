import { useNavigate, useLocation } from 'react-router-dom';
import './MobileNav.css';
import { Home, BarChart2, Activity, User } from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { useLanguage } from '../../context/LanguageContext';

interface MobileNavProps {
  activeNav?: 'dashboard' | 'exercise' | 'nutrition' | 'profile' | string;
}

export default function MobileNav({ activeNav }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const currentPath = location.pathname;

  const isTabActive = (tabKey: string, path: string) => {
    if (activeNav) {
      return activeNav.toLowerCase() === tabKey;
    }
    if (path === PATHS.DASHBOARD && currentPath === PATHS.DASHBOARD) return true;
    if (path === PATHS.PROFILE && currentPath === PATHS.PROFILE) return true;
    return false;
  };

  const navItems = [
    {
      key: 'dashboard',
      label: t('nav.dashboard'),
      icon: <Home size={22} />,
      path: PATHS.DASHBOARD,
    },
    {
      key: 'exercise',
      label: t('nav.exercise'),
      icon: <BarChart2 size={22} />,
      path: '#',
    },
    {
      key: 'nutrition',
      label: t('nav.nutrition'),
      icon: <Activity size={22} />,
      path: '#',
    },
    {
      key: 'profile',
      label: t('nav.profile'),
      icon: <User size={22} />,
      path: PATHS.PROFILE,
    },
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {navItems.map((item) => {
          const active = isTabActive(item.key, item.path);
          return (
            <button
              key={item.key}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => {
                if (item.path !== '#') {
                  navigate(item.path);
                }
              }}
            >
              {item.icon}
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
