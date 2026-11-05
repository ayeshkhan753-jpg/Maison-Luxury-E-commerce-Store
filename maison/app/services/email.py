"""
MAISON — Transactional Email & Customer Communication Service
Logs and formats luxury email templates for order confirmation, shipping notices, and account security.
"""

from datetime import datetime


class EmailService:
    @staticmethod
    def send_order_confirmation(to_email: str, order_number: str, customer_name: str, total: float):
        log_entry = {
            "to": to_email,
            "subject": f"Your MAISON Order {order_number} is Confirmed",
            "timestamp": datetime.utcnow().isoformat(),
            "content": f"Dear {customer_name},\n\nWe have received your order {order_number} for ${total:,.2f}. Our artisans in the Paris and Biella ateliers are preparing your pieces with bespoke care.\n\nWarm regards,\nMAISON Client Relations"
        }
        print(f"[EMAIL DISPATCHED] To: {to_email} | Subject: {log_entry['subject']}")
        return True

    @staticmethod
    def send_shipping_notification(to_email: str, order_number: str, tracking_number: str):
        print(f"[EMAIL DISPATCHED] Order {order_number} has shipped with tracking {tracking_number}")
        return True

    @staticmethod
    def send_password_reset(to_email: str, reset_token: str):
        print(f"[EMAIL DISPATCHED] Password reset link for {to_email}: token={reset_token}")
        return True
