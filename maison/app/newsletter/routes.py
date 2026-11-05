"""
MAISON — Newsletter Subscription Module
"""

from maison.app.models.db import get_db


def handle_subscribe_newsletter(data: dict) -> tuple:
    email = (data.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return {"error": "Please provide a valid email address."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM newsletter_subscribers WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return {"message": "You are already a valued subscriber to MAISON Journal."}, 200

    cursor.execute("INSERT INTO newsletter_subscribers (email) VALUES (?)", (email,))
    conn.commit()
    conn.close()

    return {"message": "Welcome to MAISON. You will receive private previews and runway releases."}, 201
