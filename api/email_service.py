import os
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USER = os.getenv('EMAIL_HOST_USER', '').strip()
EMAIL_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '').strip()

def generate_otp() -> str:
    """Generate a random 6-digit OTP code."""
    return f"{random.randint(100000, 999999)}"

def send_otp_email(to_email: str, otp_code: str, purpose: str = 'email_verification') -> bool:
    """
    Send an OTP email to the recipient via SMTP.
    Fallback to console logging if SMTP fails or is not configured.
    """
    subject_title = "Verify Your Email Address" if purpose == 'email_verification' else "Password Reset OTP Code"
    header_title = "Welcome to Shuvi Gym!" if purpose == 'email_verification' else "Password Reset Request"
    body_intro = (
        "Thank you for registering with Shuvi Gym. Please use the following 6-digit OTP code to complete your email verification."
        if purpose == 'email_verification'
        else "We received a request to reset your Shuvi Gym account password. Use the following 6-digit OTP code to set a new password."
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0d0d; color: #f5f5f5; margin: 0; padding: 24px; }}
        .container {{ max-width: 520px; margin: 0 auto; background-color: #171717; border-radius: 16px; border: 1px solid rgba(56, 189, 248, 0.2); padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(56, 189, 248, 0.08); }}
        .badge {{ display: inline-block; padding: 4px 12px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 9999px; color: #38bdf8; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }}
        .logo {{ font-size: 24px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }}
        .title {{ font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; line-height: 1.2; }}
        .text {{ font-size: 15px; color: #a3a3a3; line-height: 1.6; margin-bottom: 24px; }}
        .otp-box {{ background-color: #0a0a0a; border: 2px solid #38bdf8; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; box-shadow: 0 0 20px rgba(56, 189, 248, 0.15); }}
        .otp-code {{ font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 10px rgba(56, 189, 248, 0.3); }}
        .footer {{ font-size: 13px; color: #525252; text-align: center; border-top: 1px solid #262626; padding-top: 20px; margin-top: 28px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">Security Code</div>
        <div class="logo">⚡ SHUVI GYM</div>
        <div class="title">{header_title}</div>
        <div class="text">{body_intro} This code is valid for <strong style="color: #ffffff;">10 minutes</strong>.</div>
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
        </div>
        <div class="text" style="font-size: 13px;">If you did not request this, please ignore this email or contact support.</div>
        <div class="footer">&copy; 2026 Shuvi Gym. All rights reserved.</div>
      </div>
    </body>
    </html>
    """

    print(f"\n==========================================")
    print(f"[OTP GENERATED] To: {to_email} | Purpose: {purpose}")
    print(f"[OTP CODE]: {otp_code}")
    print(f"==========================================\n")

    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("[SMTP Notice] EMAIL_HOST_USER or EMAIL_HOST_PASSWORD not set. Using console OTP logging.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[{otp_code}] {subject_title} - Shuvi Gym"
        msg["From"] = f"Shuvi Gym <{EMAIL_USER}>"
        msg["To"] = to_email

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        
        print(f"[SMTP Success] OTP Email successfully delivered to {to_email}")
        return True

    except Exception as e:
        print(f"[SMTP Warning] Could not send email via SMTP ({e}). OTP code logged to console above.")
        return False
