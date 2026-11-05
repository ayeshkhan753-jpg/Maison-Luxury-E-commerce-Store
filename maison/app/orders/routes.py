"""
MAISON — Orders & Tracking Module
Provides historical order retrieval, tracking statuses, cancellation, return requests, and invoice generation.
"""

from maison.app.models.db import get_db
from maison.app.services.invoice import generate_invoice_html


def handle_get_orders(user_id=None, session_id=None) -> tuple:
    if not user_id and not session_id:
        return {"orders": []}, 200

    conn = get_db()
    cursor = conn.cursor()

    if user_id:
        cursor.execute("""
        SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
        """, (user_id,))
    else:
        cursor.execute("""
        SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC
        """, (session_id,))

    orders = [dict(r) for r in cursor.fetchall()]

    for ord_obj in orders:
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (ord_obj["id"],))
        ord_obj["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"orders": orders}, 200


def handle_get_order_detail(order_number: str, user_id=None) -> tuple:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE order_number = ?", (order_number,))
    order_row = cursor.fetchone()

    if not order_row:
        conn.close()
        return {"error": "Order not found."}, 404

    order = dict(order_row)
    cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],))
    order["items"] = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"order": order}, 200


def handle_cancel_order(order_number: str, user_id=None) -> tuple:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE order_number = ?", (order_number,))
    order = cursor.fetchone()

    if not order:
        conn.close()
        return {"error": "Order not found."}, 404

    if order["order_status"] in ["Shipped", "Delivered"]:
        conn.close()
        return {"error": "Order has already been dispatched and cannot be cancelled directly. Please initiate a return instead."}, 400

    cursor.execute("UPDATE orders SET order_status = 'Cancelled' WHERE order_number = ?", (order_number,))
    conn.commit()
    conn.close()

    return {"message": f"Order {order_number} has been cancelled successfully."}, 200


def handle_return_order(order_number: str, reason: str, user_id=None) -> tuple:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE order_number = ?", (order_number,))
    order = cursor.fetchone()

    if not order:
        conn.close()
        return {"error": "Order not found."}, 404

    cursor.execute("UPDATE orders SET order_status = 'Return Requested' WHERE order_number = ?", (order_number,))
    conn.commit()
    conn.close()

    return {"message": f"Return request for {order_number} registered. Our courier team will reach out for collection."}, 200


def handle_get_invoice(order_number: str) -> tuple:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE order_number = ?", (order_number,))
    order_row = cursor.fetchone()

    if not order_row:
        conn.close()
        return "Order not found", 404

    order = dict(order_row)
    cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],))
    items = [dict(r) for r in cursor.fetchall()]
    conn.close()

    html = generate_invoice_html(order, items)
    return html, 200
