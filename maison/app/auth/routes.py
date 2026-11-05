"""
MAISON — Auth Module
Handles user registration, login, profile, security, and addresses.
"""

import json
import secrets
from datetime import datetime
from maison.app.models.db import get_db, hash_password, verify_password

# In-memory active tokens mapping: token -> {user_id, email, role, expires}
ACTIVE_TOKENS = {}


def generate_token(user_id: int, email: str, role: str) -> str:
    token = secrets.token_hex(24)
    ACTIVE_TOKENS[token] = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "created_at": datetime.utcnow().timestamp()
    }
    return token


def authenticate_token(token: str):
    if not token:
        return None
    # Strip Bearer prefix if present
    if token.startswith("Bearer "):
        token = token[7:].strip()
    return ACTIVE_TOKENS.get(token)


def handle_register(data: dict) -> tuple:
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not email or not password or not full_name:
        return {"error": "Email, password, and full name are required."}, 400

    if len(password) < 8:
        return {"error": "Password must be at least 8 characters long."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return {"error": "An account with this email already exists."}, 409

    pw_hash = hash_password(password)
    cursor.execute("""
    INSERT INTO users (email, password_hash, full_name, phone, role)
    VALUES (?, ?, ?, ?, 'customer')
    """, (email, pw_hash, full_name, phone))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    token = generate_token(user_id, email, "customer")
    return {
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "phone": phone,
            "role": "customer"
        }
    }, 201


def handle_login(data: dict) -> tuple:
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return {"error": "Email and password are required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, password_hash, full_name, phone, role FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(user["password_hash"], password):
        return {"error": "Invalid email or password."}, 401

    token = generate_token(user["id"], user["email"], user["role"])
    return {
        "message": "Welcome back to MAISON.",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user["phone"],
            "role": user["role"]
        }
    }, 200


def handle_get_me(auth_info: dict) -> tuple:
    if not auth_info:
        return {"error": "Unauthorized"}, 401

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, phone, role, profile_image FROM users WHERE id = ?", (auth_info["user_id"],))
    user = cursor.fetchone()

    cursor.execute("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC", (auth_info["user_id"],))
    addresses = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if not user:
        return {"error": "User not found."}, 404

    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user["phone"],
            "role": user["role"],
            "profile_image": user["profile_image"],
            "addresses": addresses
        }
    }, 200


def handle_update_profile(auth_info: dict, data: dict) -> tuple:
    if not auth_info:
        return {"error": "Unauthorized"}, 401

    full_name = data.get("full_name")
    phone = data.get("phone")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone)
    WHERE id = ?
    """, (full_name, phone, auth_info["user_id"]))
    conn.commit()
    conn.close()

    return {"message": "Profile updated successfully."}, 200


def handle_add_address(auth_info: dict, data: dict) -> tuple:
    if not auth_info:
        return {"error": "Unauthorized"}, 401

    full_name = data.get("full_name", "")
    phone = data.get("phone", "")
    street = data.get("street", "")
    city = data.get("city", "")
    postal_code = data.get("postal_code", "")
    country = data.get("country", "")
    is_default = 1 if data.get("is_default") else 0

    if not street or not city or not postal_code or not country:
        return {"error": "Complete address details are required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    if is_default:
        cursor.execute("UPDATE addresses SET is_default = 0 WHERE user_id = ?", (auth_info["user_id"],))

    cursor.execute("""
    INSERT INTO addresses (user_id, full_name, phone, street, city, postal_code, country, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (auth_info["user_id"], full_name, phone, street, city, postal_code, country, is_default))
    conn.commit()
    conn.close()

    return {"message": "Address saved successfully."}, 201
