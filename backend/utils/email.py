import os
import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SMTP_EMAIL = os.environ.get('SMTP_EMAIL')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))

async def send_registration_pending_email(to_email: str, name: str) -> bool:
    """Send registration pending email to new user"""
    
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.error("Email credentials not configured")
        return False
    
    subject = "Your Payload application is pending approval"
    
    body = f"""Hello {name},

Your application is pending approval by the Director. You are one step closer to getting funded.

Please look out for your confirmation or denial email.

Once your registration is approved you will be sent further instructions.

Best,
Payload Team"""

    try:
        message = MIMEMultipart()
        message["From"] = SMTP_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))
        
        logger.info(f"Attempting to send email to {to_email}...")
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_EMAIL,
            password=SMTP_PASSWORD,
        )
        
        logger.info(f"✓ Registration pending email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to send email to {to_email}: {str(e)}")
        return False
