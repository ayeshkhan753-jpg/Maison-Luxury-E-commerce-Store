"""
MAISON — Wishlist Module
Enables saving pieces, viewing saved curations, and transferring items to the shopping bag.
"""

from maison.app.models.db import get_db


def get_or_create_wishlist(conn, user_id=None, session_id=None):
    cursor = conn.cursor()
    wl = None

    if user_id:
        cursor.execute("SELECT id FROM wishlists WHERE user_id = ?", (user_id,))
        wl = cursor.fetchone()
        if not wl and session_id:
            cursor.execute("SELECT id FROM wishlists WHERE session_id = ? AND user_id IS NULL", (session_id,))
            wl = cursor.fetchone()
            if wl:
                cursor.execute("UPDATE wishlists SET user_id = ? WHERE id = ?", (user_id, wl["id"]))
                conn.commit()

    if not wl and session_id:
        cursor.execute("SELECT id FROM wishlists WHERE session_id = ?", (session_id,))
        wl = cursor.fetchone()

    if not wl:
        cursor.execute("INSERT INTO wishlists (user_id, session_id) VALUES (?, ?)", (user_id, session_id))
        conn.commit()
        wl_id = cursor.lastrowid
    else:
        wl_id = wl["id"]

    return wl_id


def handle_get_wishlist(user_id=None, session_id=None) -> tuple:
    if not user_id and not session_id:
        return {"items": []}, 200

    conn = get_db()
    cursor = conn.cursor()
    wl_id = get_or_create_wishlist(conn, user_id, session_id)

    cursor.execute("""
    SELECT wi.id as wishlist_item_id, wi.product_id, wi.created_at,
           p.name, p.slug, p.base_price, p.discount_price, p.category_slug,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image_url
    FROM wishlist_items wi
    JOIN products p ON wi.product_id = p.id
    WHERE wi.wishlist_id = ?
    ORDER BY wi.created_at DESC
    """, (wl_id,))
    rows = cursor.fetchall()
    items = [dict(r) for r in rows]
    conn.close()

    return {"wishlist_id": wl_id, "items": items}, 200


def handle_toggle_wishlist(data: dict, user_id=None, session_id=None) -> tuple:
    product_id = data.get("product_id")
    if not product_id:
        return {"error": "Product ID is required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    wl_id = get_or_create_wishlist(conn, user_id, session_id)

    cursor.execute("SELECT id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?", (wl_id, product_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("DELETE FROM wishlist_items WHERE id = ?", (existing["id"],))
        action = "removed"
    else:
        cursor.execute("INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)", (wl_id, product_id))
        action = "added"

    conn.commit()
    conn.close()

    res, _ = handle_get_wishlist(user_id, session_id)
    res["action"] = action
    return res, 200
