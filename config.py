"""
MAISON — Configuration Module
"""

import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "maison-luxury-secret-key-2026")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///instance/maison.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.environ.get("PORT", 5001))
    DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1")
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.maison.luxury")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "atelier@maison.luxury")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
