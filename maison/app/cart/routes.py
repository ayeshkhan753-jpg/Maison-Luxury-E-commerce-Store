"""
MAISON — Shopping Cart Module
Manages cart persistence for logged-in and guest users, stock verification,
and server-side Decimal price calculations.
"""

from maison.app.models.db import get_db
from maison.app.services.pricing import calculate_cart_totals


def get_or_create_cart(conn, user_id=None, session_id=None):
    cursor = conn.cursor()
    cart = None

    if user_id:
        cursor.execute("SELECT id FROM carts WHERE user_id = ?", (user_id,))
        cart = cursor.fetchone()
        if not cart and session_id:
            # Check if there is a guest cart to adopt
            cursor.execute("SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL", (session_id,))
            cart = cursor.fetchone()
            if cart:
                cursor.execute("UPDATE carts SET user_id = ? WHERE id = ?", (user_id, cart["id"]))
                conn.commit()

    if not cart and session_id:
        cursor.execute("SELECT id FROM carts WHERE session_id = ?", (session_id,))
        cart = cursor.fetchone()

    if not cart:
        cursor.execute("INSERT INTO carts (user_id, session_id) VALUES (?, ?)", (user_id, session_id))
        conn.commit()
        cart_id = cursor.lastrowid
    else:
        cart_id = cart["id"]

    return cart_id


def handle_get_cart(user_id=None, session_id=None, coupon_code=None) -> tuple:
    if not user_id and not session_id:
        return {"items": [], "totals": calculate_cart_totals([])}, 200

    conn = get_db()
    cursor = conn.cursor()
    cart_id = get_or_create_cart(conn, user_id, session_id)

    cursor.execute("""
    SELECT ci.id as item_id, ci.product_id, ci.variant_id, ci.size, ci.color, ci.quantity, ci.unit_price,
           p.name as product_name, p.slug as product_slug,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image_url,
           pv.stock_quantity
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ?
    """, (cart_id,))
    rows = cursor.fetchall()
    items = [dict(r) for r in rows]

    # Fetch coupon details if supplied
    coupon_data = None
    if coupon_code:
        cursor.execute("SELECT * FROM coupons WHERE code = ? AND is_active = 1", (coupon_code.upper().strip(),))
        c_row = cursor.fetchone()
        if c_row:
            coupon_data = dict(c_row)

    totals = calculate_cart_totals(items, coupon_data)
    conn.close()

    return {"cart_id": cart_id, "items": items, "totals": totals}, 200


def handle_add_to_cart(data: dict, user_id=None, session_id=None) -> tuple:
    product_id = data.get("product_id")
    size = data.get("size", "One Size")
    color = data.get("color", "Default")
    quantity = int(data.get("quantity", 1))

    if not product_id:
        return {"error": "Product ID is required."}, 400

    if quantity <= 0:
        return {"error": "Quantity must be greater than zero."}, 400

    conn = get_db()
    cursor = conn.cursor()

    # Verify product exists
    cursor.execute("SELECT id, base_price, discount_price, name FROM products WHERE id = ?", (product_id,))
    prod = cursor.fetchone()
    if not prod:
        conn.close()
        return {"error": "Product not found."}, 404

    unit_price = prod["discount_price"] if prod["discount_price"] else prod["base_price"]

    # Verify variant & stock
    cursor.execute("""
    SELECT id, stock_quantity FROM product_variants 
    WHERE product_id = ? AND size = ? AND color = ?
    """, (product_id, size, color))
    variant = cursor.fetchone()

    variant_id = None
    if variant:
        variant_id = variant["id"]
        if variant["stock_quantity"] < quantity:
            conn.close()
            return {"error": f"Only {variant['stock_quantity']} units remaining in selected variant."}, 400

    cart_id = get_or_create_cart(conn, user_id, session_id)

    # Check if this exact product+variant is already in cart
    cursor.execute("""
    SELECT id, quantity FROM cart_items 
    WHERE cart_id = ? AND product_id = ? AND size = ? AND color = ?
    """, (cart_id, product_id, size, color))
    existing_item = cursor.fetchone()

    if existing_item:
        new_qty = existing_item["quantity"] + quantity
        if variant and variant["stock_quantity"] < new_qty:
            conn.close()
            return {"error": f"Cannot add more. Inventory limit is {variant['stock_quantity']} units."}, 400

        cursor.execute("UPDATE cart_items SET quantity = ?, unit_price = ? WHERE id = ?", 
                       (new_qty, unit_price, existing_item["id"]))
    else:
        cursor.execute("""
        INSERT INTO cart_items (cart_id, product_id, variant_id, size, color, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (cart_id, product_id, variant_id, size, color, quantity, unit_price))

    conn.commit()
    conn.close()

    # Return updated cart
    return handle_get_cart(user_id, session_id, data.get("coupon_code"))


def handle_update_cart_quantity(data: dict, user_id=None, session_id=None) -> tuple:
    item_id = data.get("item_id")
    quantity = int(data.get("quantity", 1))

    if not item_id:
        return {"error": "Item ID is required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cart_id = get_or_create_cart(conn, user_id, session_id)

    if quantity <= 0:
        cursor.execute("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", (item_id, cart_id))
    else:
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?", (quantity, item_id, cart_id))

    conn.commit()
    conn.close()

    return handle_get_cart(user_id, session_id, data.get("coupon_code"))


def handle_remove_from_cart(data: dict, user_id=None, session_id=None) -> tuple:
    item_id = data.get("item_id")
    if not item_id:
        return {"error": "Item ID is required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cart_id = get_or_create_cart(conn, user_id, session_id)
    cursor.execute("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", (item_id, cart_id))
    conn.commit()
    conn.close()

    return handle_get_cart(user_id, session_id, data.get("coupon_code"))


def handle_apply_coupon(data: dict, user_id=None, session_id=None) -> tuple:
    code = (data.get("code") or "").upper().strip()
    if not code:
        return {"error": "Promotional coupon code is required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coupons WHERE code = ? AND is_active = 1", (code,))
    coupon = cursor.fetchone()
    conn.close()

    if not coupon:
        return {"error": "Invalid or expired promotional code."}, 404

    # Calculate with this coupon
    return handle_get_cart(user_id, session_id, code)
