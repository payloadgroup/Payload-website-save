import os
import logging
import asyncio
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

# Tier display names mapping
TIER_DISPLAY_NAMES = {
    'junior_recruit': 'JUNIOR RECRUIT',
    'front_line': 'FRONT-LINE',
    'mid_level_manager': 'MID-LEVEL MANAGER',
    'senior_manager': 'SENIOR MANAGER',
    'top_leadership': 'TOP LEADERSHIP'
}


async def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Internal helper to send an email"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.error("Email credentials not configured")
        return False
    
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
        
        logger.info(f"✓ Email sent successfully to {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to send email to {to_email}: {str(e)}")
        return False


async def send_registration_pending_email(to_email: str, name: str) -> bool:
    """Send registration pending email to new user"""
    
    subject = "Your Payload application is pending approval"
    
    body = f"""Hello {name},

Your application is pending approval by the Director. You are one step closer to getting funded.

Please look out for your confirmation or denial email.

Once your registration is approved you will be sent further instructions.

Best,
Payload Team"""

    return await _send_email(to_email, subject, body)


async def send_approval_email(to_email: str, name: str) -> bool:
    """Send approval email when admin approves a member"""
    
    subject = "Your Payload membership has been approved"
    
    body = f"""Hello {name},

Your membership application has been approved by the Director. Welcome to Payload.

You are now eligible to proceed to the next steps in the funding process. Further instructions will be sent to you shortly, including how to access your member portal and submit any required documentation.

Please have your credit score rating information at hand as you will need this once you log in. There are several services that allow you to obtain your credit score for free. Simple google what's my credit score.

Best,
Payload Team"""

    return await _send_email(to_email, subject, body)


async def send_credentials_email(to_email: str, name: str, password: str, tier: str) -> bool:
    """Send credentials email with login details and tier level"""
    
    tier_display = TIER_DISPLAY_NAMES.get(tier, tier.upper().replace('_', ' '))
    
    subject = "Your Payload access credentials and mission briefing"
    
    body = f"""Hello {name},

Here are your login credentials for your Payload account:

Email: {to_email}
Password: {password}
Tier level: {tier_display}

Congratulations, you are one of the few who have made it.

The Payload company operates in stealth and conducts real business that generates real revenue. Our mission is to stay censored whilst creating great exposure. You will be shown how to do this as you start your operation and rank up your tier.

Head over to our custom mission control centre and log in to your dashboard. Welcome aboard, recruit.

Payload
The Director"""

    return await _send_email(to_email, subject, body)


async def send_approval_email_workflow(to_email: str, name: str, password: str, tier: str):
    """
    Complete approval email workflow:
    1. Send approval email immediately
    2. Wait 2 minutes
    3. Send credentials email
    """
    logger.info(f"Starting approval email workflow for {to_email}")
    
    # Send first email (approval)
    approval_sent = await send_approval_email(to_email, name)
    
    if approval_sent:
        logger.info(f"Approval email sent to {to_email}. Scheduling credentials email in 2 minutes...")
        
        # Wait 2 minutes (120 seconds)
        await asyncio.sleep(120)
        
        # Send second email (credentials)
        credentials_sent = await send_credentials_email(to_email, name, password, tier)
        
        if credentials_sent:
            logger.info(f"✓ Credentials email sent to {to_email}. Workflow complete.")
        else:
            logger.error(f"✗ Failed to send credentials email to {to_email}")
    else:
        logger.error(f"✗ Failed to send approval email to {to_email}. Skipping credentials email.")
