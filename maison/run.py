"""
MAISON — Python REST Backend Server
Runs an HTTP REST server on port 5001 providing 100% Python-powered business logic.
"""

import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs

# Ensure maison directory is on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from maison.app.models.db import init_db
from maison.app.auth.routes import (
    handle_register, handle_login, handle_get_me, handle_update_profile,
    handle_add_address, authenticate_token
)
from maison.app.products.routes import (
    handle_get_categories, handle_get_products, handle_get_product_detail,
    handle_get_featured_showcase
)
from maison.app.cart.routes import (
    handle_get_cart, handle_add_to_cart, handle_update_cart_quantity,
    handle_remove_from_cart, handle_apply_coupon
)
from maison.app.wishlist.routes import (
    handle_get_wishlist, handle_toggle_wishlist
)
from maison.app.checkout.routes import (
    handle_place_order
)
from maison.app.orders.routes import (
    handle_get_orders, handle_get_order_detail, handle_cancel_order,
    handle_return_order, handle_get_invoice
)
from maison.app.admin.routes import (
    handle_admin_dashboard, handle_admin_get_orders, handle_admin_update_order_status,
    handle_admin_add_product, handle_admin_update_inventory, handle_admin_get_coupons,
    handle_admin_create_coupon
)
from maison.app.reviews.routes import (
    handle_get_reviews, handle_submit_review
)
from maison.app.newsletter.routes import (
    handle_subscribe_newsletter
)


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


class MaisonAPIHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-ID")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            raw_data = self.rfile.read(content_length)
            try:
                return json.loads(raw_data.decode("utf-8"))
            except Exception:
                return {}
        return {}

    def get_auth_and_session(self):
        auth_header = self.headers.get("Authorization", "")
        session_id = self.headers.get("X-Session-ID", "guest_session_default")
        auth_info = authenticate_token(auth_header)
        user_id = auth_info["user_id"] if auth_info else None
        return auth_info, user_id, session_id

    def respond_json(self, data, status_code=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def respond_html(self, html_text, status_code=200):
        body = html_text.encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        query = parse_qs(parsed.query)
        auth_info, user_id, session_id = self.get_auth_and_session()

        try:
            # Health check
            if path == "/api/health":
                return self.respond_json({
                    "status": "healthy",
                    "platform": "MAISON Luxury E-Commerce",
                    "engine": "Python 3.10 REST Engine",
                    "active": True
                })

            # Auth
            if path == "/api/auth/me":
                res, status = handle_get_me(auth_info)
                return self.respond_json(res, status)

            # Products & Categories
            if path == "/api/categories":
                res, status = handle_get_categories()
                return self.respond_json(res, status)

            if path == "/api/products/featured":
                res, status = handle_get_featured_showcase()
                return self.respond_json(res, status)

            if path == "/api/products":
                res, status = handle_get_products(query)
                return self.respond_json(res, status)

            if path.startswith("/api/products/"):
                slug_or_id = path[len("/api/products/"):]
                res, status = handle_get_product_detail(slug_or_id)
                return self.respond_json(res, status)

            # Cart
            if path == "/api/cart":
                coupon_code = query.get("coupon", [""])[0]
                res, status = handle_get_cart(user_id, session_id, coupon_code)
                return self.respond_json(res, status)

            # Wishlist
            if path == "/api/wishlist":
                res, status = handle_get_wishlist(user_id, session_id)
                return self.respond_json(res, status)

            # Orders
            if path == "/api/orders":
                res, status = handle_get_orders(user_id, session_id)
                return self.respond_json(res, status)

            if path.startswith("/api/orders/") and path.endswith("/invoice"):
                order_num = path.split("/")[3]
                html, status = handle_get_invoice(order_num)
                return self.respond_html(html, status)

            if path.startswith("/api/orders/"):
                order_num = path[len("/api/orders/"):]
                res, status = handle_get_order_detail(order_num, user_id)
                return self.respond_json(res, status)

            # Reviews
            if path.startswith("/api/reviews/product/"):
                pid = int(path[len("/api/reviews/product/"):])
                res, status = handle_get_reviews(pid)
                return self.respond_json(res, status)

            # Admin
            if path == "/api/admin/dashboard":
                res, status = handle_admin_dashboard(auth_info)
                return self.respond_json(res, status)

            if path == "/api/admin/orders":
                res, status = handle_admin_get_orders(auth_info)
                return self.respond_json(res, status)

            if path == "/api/admin/coupons":
                res, status = handle_admin_get_coupons(auth_info)
                return self.respond_json(res, status)

            self.respond_json({"error": "Endpoint not found"}, 404)

        except Exception as e:
            print(f"[API ERROR GET] {path}: {str(e)}")
            self.respond_json({"error": str(e)}, 500)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        data = self.read_json_body()
        auth_info, user_id, session_id = self.get_auth_and_session()

        try:
            # Auth
            if path == "/api/auth/register":
                res, status = handle_register(data)
                return self.respond_json(res, status)

            if path == "/api/auth/login":
                res, status = handle_login(data)
                return self.respond_json(res, status)

            if path == "/api/auth/profile":
                res, status = handle_update_profile(auth_info, data)
                return self.respond_json(res, status)

            if path == "/api/auth/addresses":
                res, status = handle_add_address(auth_info, data)
                return self.respond_json(res, status)

            # Cart
            if path == "/api/cart/add":
                res, status = handle_add_to_cart(data, user_id, session_id)
                return self.respond_json(res, status)

            if path == "/api/cart/update":
                res, status = handle_update_cart_quantity(data, user_id, session_id)
                return self.respond_json(res, status)

            if path == "/api/cart/remove":
                res, status = handle_remove_from_cart(data, user_id, session_id)
                return self.respond_json(res, status)

            if path == "/api/cart/apply-coupon":
                res, status = handle_apply_coupon(data, user_id, session_id)
                return self.respond_json(res, status)

            # Wishlist
            if path == "/api/wishlist/toggle":
                res, status = handle_toggle_wishlist(data, user_id, session_id)
                return self.respond_json(res, status)

            # Checkout
            if path == "/api/checkout/place-order":
                res, status = handle_place_order(data, user_id, session_id)
                return self.respond_json(res, status)

            # Order Actions
            if path.startswith("/api/orders/") and path.endswith("/cancel"):
                order_num = path.split("/")[3]
                res, status = handle_cancel_order(order_num, user_id)
                return self.respond_json(res, status)

            if path.startswith("/api/orders/") and path.endswith("/return"):
                order_num = path.split("/")[3]
                reason = data.get("reason", "Customer request")
                res, status = handle_return_order(order_num, reason, user_id)
                return self.respond_json(res, status)

            # Reviews
            if path == "/api/reviews/submit":
                res, status = handle_submit_review(data, user_id)
                return self.respond_json(res, status)

            # Newsletter
            if path == "/api/newsletter/subscribe":
                res, status = handle_subscribe_newsletter(data)
                return self.respond_json(res, status)

            # Admin
            if path == "/api/admin/orders/status":
                res, status = handle_admin_update_order_status(auth_info, data)
                return self.respond_json(res, status)

            if path == "/api/admin/products":
                res, status = handle_admin_add_product(auth_info, data)
                return self.respond_json(res, status)

            if path == "/api/admin/inventory":
                res, status = handle_admin_update_inventory(auth_info, data)
                return self.respond_json(res, status)

            if path == "/api/admin/coupons":
                res, status = handle_admin_create_coupon(auth_info, data)
                return self.respond_json(res, status)

            self.respond_json({"error": "Endpoint not found"}, 404)

        except Exception as e:
            print(f"[API ERROR POST] {path}: {str(e)}")
            self.respond_json({"error": str(e)}, 500)


def run_server(port=5001):
    init_db()
    server_address = ("127.0.0.1", port)
    httpd = ThreadedHTTPServer(server_address, MaisonAPIHandler)
    print(f"=== MAISON Luxury Python Backend active on http://127.0.0.1:{port} ===")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Maison Python Backend...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    run_server(port)
