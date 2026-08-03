import { useState } from "react";
import "./Register.css";
import theme from "../../config/theme";
import LeftLoginBox from "../../components/ui/box/LeftLoginBox";
import Title from "../../components/ui/Text/Title";
import Description from "../../components/ui/Text/Description";
import InputGroup from "../../components/ui/input/InputGroup";
import PasswordInputGroup from "../../components/ui/input/PasswordInputGroup";
import Checkbox from "../../components/ui/input/Checkbox";
import SubmitButton from "../../components/ui/button/SubmitButton";
import SocialButton from "../../components/ui/button/SocialButton";
import { Link } from 'react-router-dom';
import { PATHS } from '../../routes/paths';


export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };
  
  return (
    <div className="login-wrapper" style={{backgroundColor: theme.colors.background}}>
      {/* Left panel — gym photo */}
      <LeftLoginBox/>
      {/* Right panel — login form */}
      <div className="right-panel">

        <div className="form-wrapper">
          <div className="form-header">
            <Title mb={"0"} fontSize={"2.4rem"} lineHeight={1.1}  multiLine={[{text: "Join the elite,", color: theme.colors.title}, {text: "athlete.", color: theme.colors.primary}]}/>
            <Description mt={"0.5rem"} fontSize={"0.9rem"} content={"Create your account to start your training journey."} />
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Name */}
            <InputGroup id={"name"} label={"Full name"} type={"text"} placeholder={"Your name"} value={name} onChange={(e) => setName(e)} />
            {/* Email */}
            <InputGroup id={"email"} label={"Email address"} type={"email"} placeholder={"You@gmail.com"} value={email} onChange={(e) => setEmail(e)} />
            {/* Password */}
            <PasswordInputGroup password={password} setPassword={(e)=>setPassword(e)} showForgotPassword={false}/>
            {/* Remember me */}
            <Checkbox label={"Keep me logged in for 30 days"} checked={rememberMe} onChange={(e) => setRememberMe(e)}/>
            {/* error box */}
            {/* Submit */}
            <SubmitButton label={"Create Account"}/>

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
            Already have an account?{" "}
            <Link to={PATHS.LOGIN} className="footer-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
