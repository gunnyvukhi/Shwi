import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { PATHS } from '../../routes/paths';
import './NavBar.css';
import demouser from '../../assets/demo_user.jpeg';
import logo from '../../assets/logo.png';
import { FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

type Props = {
    selected?: number;
};

interface NavBtn {
  name: string;
  icon: string;
  url: string
}

interface profBtn {
    name: string;
    icon: React.ReactNode;
    onclick: () => void;
    side: boolean;
}

const Navbar: React.FC<Props> = ({selected=1 }) => {

    const navBtnList1: NavBtn[] = [
        { name: 'Trang Chủ', icon: 'fas fa-house-user', url: 'home' },
        { name: 'Tập luyện', icon: 'fas fa-dumbbell', url: 'exercise' },
        { name: 'Dinh dưỡng', icon: 'fas fa-utensils', url: 'nutrition' }]
    const navBtnList2: NavBtn[] = [
        { name: 'Lịch trình', icon: 'fas fa-calendar-alt', url: 'home' },
        { name: 'Công cụ khác', icon: 'fas fa-tools', url: 'home' },
        { name: 'Cửa hàng', icon: 'fas fa-shopping-cart', url: 'home' }]
    const navBtnList3: NavBtn[] = [
        { name: 'Premium', icon: 'fas fa-gem', url: 'home' },
        { name: 'Premium', icon: 'fas fa-gem', url: 'home' },
    ];

    const logout = useAuthStore((state) => state.logout);

    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Xóa data trong Zustand -> isAuthenticated về false
        navigate(PATHS.LOGIN); // Chuyển về trang login
    };

    const profBtnList: profBtn[] = [
        { name: 'Trang cá nhân', icon: <FaUser className='profile-dropdown-icon'/>, onclick: () => {}, side: false },
        { name: 'Cài đặt', icon: <FaCog className='profile-dropdown-icon'/> , onclick: () => {}, side: false },
        { name: 'Đăng xuất', icon: <FaSignOutAlt className='profile-dropdown-icon'/>, onclick: handleLogout, side: false },
    ];
    const [selectedBtn, setSelectedBtn] = useState(selected);

    const default_highlight: string = selectedBtn < 1
        ? '-70px'
        : `${44 * (selectedBtn - 1) + 4 * selectedBtn + 16}px`;

    console.log(default_highlight)
    const [hover, setHover] = useState(false);
    return (
        <div id="nav-bar">
            <input id="nav-toggle" type="checkbox" />
            <div id="nav-header">
                <a id="nav-title" href="#" target="_blank" style={{height: '100%'}}>
                    <img src={logo} alt="Logo" style={{height: '56px', margin: '12px 12px 12px 0px'}} />
                </a>
                <label htmlFor="nav-toggle"><span id="nav-toggle-burger"></span></label>
            </div>
            <div
                id="nav-content"
                style={{ '--default-highlight': default_highlight } as React.CSSProperties}
            >
                <hr />
                {navBtnList1.map((link, index) => (
                    <div className={index + 1 === selectedBtn ? (hover ? "nav-button" : "nav-button selected-btn") : "nav-button"} 
                        key={index} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
                        onClick={() => {setSelectedBtn(index + 1); navigate(`/apps/${link.url}`)}}
                        >
                        <i className={link.icon} title={`${link.name} icon`} />
                        <span>{link.name}</span>
                    </div>
                ))}
                <hr style={{ transform: "translateY(-2.2px)" }} />
                {navBtnList2.map((link, index) => (
                    <div className={index + 4 === selectedBtn ? (hover ? "nav-button" : "nav-button selected-btn") : "nav-button"} 
                        key={index} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
                        onClick={() => {setSelectedBtn(index + 4); navigate(`/apps/${link.url}`)}}
                        >
                        <i className={link.icon} title={`${link.name} icon`} />
                        <span>{link.name}</span>
                    </div>
                ))}
                <hr style={{ transform: "translateY(-2.2px)" }} />
                {navBtnList3.map((link, index) => (
                    <div className={index + 7 === selectedBtn ? (hover ? "nav-button" : "nav-button selected-btn") : "nav-button"} 
                        key={index} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
                        onClick={() => {setSelectedBtn(index + 7); navigate(`/apps/${link.url}`)}}
                        >
                        <i className={link.icon} title={`${link.name} icon`} />
                        <span>{link.name}</span>
                    </div>
                ))}

                <div id="nav-content-highlight" ></div>
            </div>
            <input id="nav-footer-toggle" type="checkbox" />
            <div id="nav-footer">
                <div id="nav-footer-heading">
                    <div id="nav-footer-avatar">
                        <img src={demouser} alt="User Avatar" />
                    </div>
                    <div id="nav-footer-titlebox">
                        <a id="nav-footer-title" href="#">{`${"Your"} ${"Name"}`}</a>
                        <span id="nav-footer-subtitle">User</span>
                    </div>
                    <label htmlFor="nav-footer-toggle"><i className="fas fa-angle-up"></i></label>
                </div>
                <div id="nav-footer-content">
                    <div className="profile-dropdown">
                            {profBtnList.map((link, index) => (
                                <div key={index} className="profile-dropdown-button" onClick={link.onclick}>{link.icon}<span>{link.name}</span>{link.side && <div className='profile-dropdown-side'>{link.side}</div>}</div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Navbar