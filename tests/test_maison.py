"""
MAISON — Automated Python Test Suite
Validates authentication, Decimal pricing, coupon logic, inventory, and order flows.
"""

import unittest
import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from maison.app.models.db import init_db, get_db, hash_password, verify_password
from maison.app.services.pricing import calculate_cart_totals
from maison.app.auth.routes import handle_register, handle_login
from maison.app.products.routes import handle_get_products, handle_get_product_detail
from maison.app.cart.routes import handle_add_to_cart, handle_get_cart
from maison.app.checkout.routes import handle_place_order


class MaisonTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_password_hashing(self):
        pw = "LuxuryCouture2026!"
        hsh = hash_password(pw)
        self.assertTrue(verify_password(hsh, pw))
        self.assertFalse(verify_password(hsh, "WrongPassword"))

    def test_decimal_pricing_service(self):
        # 2 items of $1,650.00
        items = [{"unit_price": 1650.00, "quantity": 2}]
        # Subtotal: $3,300.00
        # Coupon: 10% off (capped at $300.00)
        coupon = {"code": "MAISON10", "discount_type": "percent", "discount_value": 10.0, "min_order_value": 300.0, "max_discount": 300.0, "is_active": 1}
        totals = calculate_cart_totals(items, coupon)

        self.assertEqual(totals["subtotal"], 3300.00)
        self.assertEqual(totals["discount_amount"], 300.00) # capped
        self.assertEqual(totals["shipping_fee"], 0.00) # free over $300
        # Tax: (3300 - 300) * 0.085 = 3000 * 0.085 = 255.00
        self.assertEqual(totals["tax_amount"], 255.00)
        self.assertEqual(totals["total_amount"], 3255.00)

    def test_product_catalog(self):
        res, status = handle_get_products({})
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(res["products"]), 8)

        # Check detail
        detail, d_status = handle_get_product_detail("atelier-cashmere-overcoat")
        self.assertEqual(d_status, 200)
        self.assertEqual(detail["product"]["name"], "Atelier Double-Faced Cashmere Overcoat")
        self.assertGreater(len(detail["product"]["available_sizes"]), 0)

    def test_cart_and_order_flow(self):
        session_id = "test_test_session_999"
        # Add product to cart
        add_res, add_status = handle_add_to_cart({
            "product_id": 1,
            "size": "M",
            "color": "Onyx Black",
            "quantity": 1
        }, session_id=session_id)
        self.assertEqual(add_status, 200)
        self.assertEqual(len(add_res["items"]), 1)

        # Place order
        order_res, order_status = handle_place_order({
            "customer_name": "Eleanor Rigby",
            "customer_email": "eleanor@example.com",
            "customer_phone": "+1 555-0199",
            "shipping_street": "123 Fashion Ave",
            "shipping_city": "New York",
            "shipping_postal": "10001",
            "shipping_country": "United States",
            "payment_method": "stripe_sandbox"
        }, session_id=session_id)

        self.assertEqual(order_status, 201)
        self.assertTrue(order_res["order"]["order_number"].startswith("MSN-"))
        self.assertEqual(order_res["order"]["payment_status"], "Paid")


if __name__ == "__main__":
    unittest.main()
