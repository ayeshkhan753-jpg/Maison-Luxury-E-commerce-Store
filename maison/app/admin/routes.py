"""
MAISON — Admin Atelier Dashboard Module
Provides full administrative control over orders, inventory, pricing, products, coupons, and business metrics.
"""

from maison.app.models.db import get_db


def verify_admin(auth_info: dict) -> bool:
    return auth_info and auth_info.get("role") == "admin"


def handle_admin_dashboard(auth_info: dict) -> tuple:
    if not verify_admin(auth_info):
        return {"error": "Admin privilege required."}, 403

    conn = get_db()
    cursor = conn.cursor()

    # Revenue
    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE payment_status = 'Paid'")
    total_revenue = cursor.fetchone()["total_revenue"]

    # Orders count
    cursor.execute("SELECT COUNT(*) as total_orders FROM orders")
    total_orders = cursor.fetchone()["total_orders"]

    # Customers count
    cursor.execute("SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer'")
    total_customers = cursor.fetchone()["total_customers"]

    # Products count
    cursor.execute("SELECT COUNT(*) as total_products FROM products")
    total_products = cursor.fetchone()["total_products"]

    # Recent Orders
    cursor.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 6")
    recent_orders = [dict(r) for r in cursor.fetchall()]

    # Low stock variants (< 5)
    cursor.execute("""
    SELECT pv.id as variant_id, pv.size, pv.color, pv.stock_quantity, pv.sku,
           p.name as product_name, p.id as product_id
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.stock_quantity <= 5
    ORDER BY pv.stock_quantity ASC
    LIMIT 10
    """)
    low_stock_items = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "stats": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "total_customers": total_customers,
            "total_products": total_products
        },
        "recent_orders": recent_orders,
        "low_stock_items": low_stock_items
    }, 200


def handle_admin_get_orders(auth_info: dict) -> tuple:
    if not verify_admin(auth_info):
        return {"error": "Admin privilege required."}, 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
    orders = [dict(r) for r in cursor.fetchall()]
    for ord_obj in orders:
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (ord_obj["id"],))
        ord_obj["items"] = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"orders": orders}, 200


def handle_admin_update_order_status(auth_info: dict, data: dict) -> tuple:
    if not verify_admin(auth_info):
        return {"error": "Admin privilege required."}, 403

    order_id = data.get("order_id")
    order_status = data.get("order_status")
    payment_status = data.get("payment_status")

    if not order_id:
        return {"error": "Order ID is required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE orders 
    SET order_status = COALESCE(?, order_status),
        payment_status = COALESCE(?, payment_status)
    WHERE id = ?
    """, (order_status, payment_status, order_id))
    conn.commit()
    conn.close()

    return {"message": "Order status updated."}, 200


def handle_admin_add_product(auth_info: dict, data: dict) -> tuple:
    if not verify_admin(auth_info):
        return {"error": "Admin privilege required."}, 403

    name = data.get("name")
    category_slug = data.get("category_slug")
    base_price = float(data.get("base_price", 0))
    discount_price = float(data.get("discount_price")) if data.get("discount_price") else None
    description = data.get("description", "")
    material = data.get("material", "Luxury Fabric")
    image_url = data.get("image_url", "/src/assets/images/campaign_womens_couture_1793861001519.jpg")

    slug = name.lower().replace(" ", "-").replace("'", "")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO products (slug, name, description, category_slug, base_price, discount_price, material, is_featured, is_new_arrival)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
    """, (slug, name, description, category_slug, base_price, discount_price, material))
    product_id = cursor.lastrowid

    # Insert primary image
    cursor.execute("""
    INSERT INTO product_images (product_id, image_url, is_primary)
    VALUES (?, ?, 1)
    """, (product_id, image_url))

    # Add default variants
    for sz in ["S", "M", "L"]:
        cursor.execute("""
        INSERT INTO product_variants (product_id, size, color, stock_quantity, sku)
        VALUES (?, ?, 'Onyx Black', 10, ?)
        """, (product_id, sz, f"MSN-{product_id}-{sz}-BLK"))

    conn.commit()
    conn.close()

    return {"message": "Product created successfully.", "product_id": product_id}, 201


def handle_admin_update_inventory(auth_info: dict, data: dict) -> tuple:
    if not verify_admin(auth_info):
        return {"error": "Admin privilege required."}, 403

    variant_id = data.get("variant_id")
    stock_quantity = int(data.get("stock_quantity", 0))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE product_variants SET stock_quantity = ? WHERE id = ?", (stock_quantity, variant_id))
    conn.commit()
    conn.close()

    return {"message": "Stock updated successfully."}, 200


def handle_admin_get_coupons(auth_info: dict) -> tuple:
    if not verify_admin(auth_info):
        return {"error": "Admin privilege required."}, 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coupons ORDER BY code ASC")
    coupons = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"coupons": coupons}, 200


def handle_admin_create_coupon(auth_info: dict, data: dict) -> tuple:
    if not verify_admin(auth_info):
        return {"error": "Admin privilege required."}, 403

    code = (data.get("code") or "").upper().strip()
    discount_type = data.get("discount_type", "percent")
    discount_value = float(data.get("discount_value", 10))
    min_order_value = float(data.get("min_order_value", 0))

    if not code:
        return {"error": "Coupon code is required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO coupons (code, discount_type, discount_value, min_order_value, is_active)
    VALUES (?, ?, ?, ?, 1)
    """, (code, discount_type, discount_value, min_order_value))
    conn.commit()
    conn.close()

    return {"message": "Coupon created successfully."}, 201
