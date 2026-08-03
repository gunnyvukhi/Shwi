import { useState } from "react";
import { Link } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

import "./Login.css";

import theme from "../../config/theme";
import LeftLoginBox from "../../components/ui/box/LeftLoginBox";
import ShuviIcon from "../../components/ui/icon/ShuviIcon";
import Title from "../../components/ui/Text/Title";
import Description from "../../components/ui/Text/Description";
import InputGroup from "../../components/ui/input/InputGroup";
import PasswordInputGroup from "../../components/ui/input/PasswordInputGroup";
import Checkbox from "../../components/ui/input/Checkbox";
import SubmitButton from "../../components/ui/button/SubmitButton";
import SocialButton from "../../components/ui/button/SocialButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const login = useAuthStore((state) => state.login); // Lấy hàm login từ store
  const navigate = useNavigate();

  const handleLoginSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    // Giả lập sau khi gọi API đăng nhập thành công và có dữ liệu user:
    const mockUser = {
      id: '123',
      name: 'Nguyễn Văn A',
      email: 'student@vnu.edu.vn',
      role: 'user' as const
    };

    login(mockUser); // Lưu vào Zustand -> isAuthenticated sẽ tự động chuyển thành true
    navigate(PATHS.DASHBOARD); // Chuyển hướng người dùng vào Dashboard
  };


  return (
    <div className="login-wrapper" style={{backgroundColor: theme.colors.background}}>
      {/* Left panel — gym photo */}
      <LeftLoginBox/>
      {/* Right panel — login form */}
      <div className="right-panel">
        {/* Mobile logo */}
        <ShuviIcon size={22} mobile/>

        <div className="form-wrapper">
          <div className="form-header">
            <Title mb={"0"} fontSize={"2.4rem"} lineHeight={1.1}  multiLine={[{text: "Welcome back,", color: theme.colors.title}, {text: "athlete.", color: theme.colors.primary}]}/>
            <Description mt={"0.5rem"} fontSize={"0.9rem"} content={"Log in to continue your training journey."} />
          </div>

          <form onSubmit={handleLoginSubmit} className="login-form">
            {/* Email */}
            <InputGroup id={"email"} label={"Email address"} type={"email"} placeholder={"You@gmail.com"} value={email} onChange={(e) => setEmail(e)} />
            {/* Password */}
            <PasswordInputGroup password={password} setPassword={(e)=>setPassword(e)} showForgotPassword={true} />
            {/* Remember me */}
            <Checkbox label={"Keep me logged in for 30 days"} checked={rememberMe} onChange={(e) => setRememberMe(e)}/>
            {/* error box */}
            {/* Submit */}
            <SubmitButton label={"Start Training"}/>

            {/* Divider */}
            <div className="divider-group">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            {/* Social logins */}
            <div className="social-group">
              <SocialButton name="Google"/>
              <SocialButton name="Apple" />
            </div>
          </form>

          <p className="footer-text">
            New to Shuvi?{" "}
            <Link to={PATHS.REGISTER} className="footer-link">
            Create your free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
