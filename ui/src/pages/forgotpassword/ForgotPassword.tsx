import { useState } from "react";
import "./ForgotPassword.css";
import theme from "../../config/theme";
import LeftLoginBox from "../../components/ui/box/LeftLoginBox";
import ShuviIcon from "../../components/ui/icon/ShuviIcon";
import Title from "../../components/ui/Text/Title";
import Description from "../../components/ui/Text/Description";
import InputGroup from "../../components/ui/input/InputGroup";
import SubmitButton from "../../components/ui/button/SubmitButton";
import SocialButton from "../../components/ui/button/SocialButton";
import { Link } from 'react-router-dom';
import { PATHS } from '../../routes/paths';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <Title mb={"0"} fontSize={"2.4rem"} lineHeight={1.1}  multiLine={[{text: "Forgot your", color: theme.colors.title}, {text: "Password?", color: theme.colors.primary}]}/>
            <Description mt={"0.5rem"} fontSize={"0.9rem"} content={"Enter your email address and we'll send you a link to reset your password so you can get back to training"} />
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <InputGroup id={"email"} label={"Email address"} type={"email"} placeholder={"You@gmail.com"} value={email} onChange={(e) => setEmail(e)} />
            {/* error box */}
            {/* Submit */}
            <SubmitButton label={"Send Reset Link"}/>

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
