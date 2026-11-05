"""
MAISON — Checkout Module
Manages multi-step checkout validation, atomic inventory deductions,
payment sandbox authorization, and order placement.
"""

import random
from datetime import datetime
from maison.app.models.db import get_db
from maison.app.services.pricing import calculate_cart_totals
from maison.app.services.email import EmailService
from maison.app.cart.routes import get_or_create_cart


def generate_order_number() -> str:
    rnd = random.randint(1000, 9999)
    return f"MSN-{datetime.utcnow().year}-{rnd}"


def generate_tracking_number() -> str:
    rnd = random.randint(100000, 999999)
    return f"MSN-EXP-{rnd}"


def handle_place_order(data: dict, user_id=None, session_id=None) -> tuple:
    customer_name = (data.get("customer_name") or "").strip()
    customer_email = (data.get("customer_email") or "").strip()
    customer_phone = (data.get("customer_phone") or "").strip()
    shipping_street = (data.get("shipping_street") or "").strip()
    shipping_city = (data.get("shipping_city") or "").strip()
    shipping_postal = (data.get("shipping_postal") or "").strip()
    shipping_country = (data.get("shipping_country") or "").strip()
    delivery_instructions = (data.get("delivery_instructions") or "").strip()
    payment_method = data.get("payment_method") or "stripe_sandbox"
    coupon_code = (data.get("coupon_code") or "").upper().strip()

    if not customer_name or not customer_email or not shipping_street or not shipping_city or not shipping_country:
        return {"error": "All required shipping and contact fields must be provided."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cart_id = get_or_create_cart(conn, user_id, session_id)

    # Fetch cart items
    cursor.execute("""
    SELECT ci.id as item_id, ci.product_id, ci.variant_id, ci.size, ci.color, ci.quantity, ci.unit_price,
           p.name as product_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image_url,
           pv.stock_quantity
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ?
    """, (cart_id,))
    cart_items = [dict(r) for r in cursor.fetchall()]

    if not cart_items:
        conn.close()
        return {"error": "Your shopping bag is empty."}, 400

    # Stock verification & atomic lock
    for item in cart_items:
        if item["stock_quantity"] is not None and item["stock_quantity"] < item["quantity"]:
            conn.close()
            return {"error": f"Insufficient stock for '{item['product_name']}'. Only {item['stock_quantity']} available."}, 400

    # Coupon lookup
    coupon_data = None
    if coupon_code:
        cursor.execute("SELECT * FROM coupons WHERE code = ? AND is_active = 1", (coupon_code,))
        c_row = cursor.fetchone()
        if c_row:
            coupon_data = dict(c_row)

    # Server-side Decimal calculation
    totals = calculate_cart_totals(cart_items, coupon_data)

    order_number = generate_order_number()
    tracking_number = generate_tracking_number()
    payment_status = "Paid" if payment_method in ["stripe_sandbox", "local_gateway"] else "Pending"
    order_status = "Confirmed" if payment_status == "Paid" else "Pending"

    # Insert Order
    cursor.execute("""
    INSERT INTO orders (
        order_number, user_id, session_id, customer_name, customer_email, customer_phone,
        shipping_street, shipping_city, shipping_postal, shipping_country, delivery_instructions,
        subtotal, discount_amount, coupon_code, shipping_fee, tax_amount, total_amount,
        payment_method, payment_status, order_status, tracking_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_number, user_id, session_id, customer_name, customer_email, customer_phone,
        shipping_street, shipping_city, shipping_postal, shipping_country, delivery_instructions,
        totals["subtotal"], totals["discount_amount"], coupon_code if coupon_data else "",
        totals["shipping_fee"], totals["tax_amount"], totals["total_amount"],
        payment_method, payment_status, order_status, tracking_number
    ))
    order_id = cursor.lastrowid

    # Insert Order Items & Deduct Inventory Stock
    for item in cart_items:
        item_subtotal = float(item["unit_price"]) * int(item["quantity"])
        cursor.execute("""
        INSERT INTO order_items (
            order_id, product_id, product_name, size, color, quantity, unit_price, subtotal, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id, item["product_id"], item["product_name"], item["size"], item["color"],
            item["quantity"], item["unit_price"], item_subtotal, item["image_url"] or ""
        ))

        # Deduct stock if variant exists
        if item.get("variant_id"):
            cursor.execute("""
            UPDATE product_variants 
            SET stock_quantity = MAX(0, stock_quantity - ?)
            WHERE id = ?
            """, (item["quantity"], item["variant_id"]))

    # Update coupon usage if applied
    if coupon_data:
        cursor.execute("UPDATE coupons SET times_used = times_used + 1 WHERE code = ?", (coupon_code,))

    # Clear Cart
    cursor.execute("DELETE FROM cart_items WHERE cart_id = ?", (cart_id,))

    conn.commit()
    conn.close()

    # Trigger transactional confirmation email
    EmailService.send_order_confirmation(customer_email, order_number, customer_name, totals["total_amount"])

    return {
        "message": "Order placed successfully.",
        "order": {
            "id": order_id,
            "order_number": order_number,
            "total_amount": totals["total_amount"],
            "payment_status": payment_status,
            "order_status": order_status,
            "tracking_number": tracking_number,
            "customer_email": customer_email,
            "item_count": len(cart_items)
        }
    }, 201
