"""
MAISON — Reviews & Customer Ratings Module
"""

from maison.app.models.db import get_db


def handle_get_reviews(product_id: int) -> tuple:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM reviews 
    WHERE product_id = ? AND status = 'approved' 
    ORDER BY created_at DESC
    """, (product_id,))
    reviews = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"reviews": reviews}, 200


def handle_submit_review(data: dict, user_id=None) -> tuple:
    product_id = data.get("product_id")
    author_name = (data.get("author_name") or "Verified Patron").strip()
    rating = int(data.get("rating", 5))
    title = (data.get("title") or "").strip()
    comment = (data.get("comment") or "").strip()

    if not product_id or not title or not comment:
        return {"error": "Rating, headline title, and review notes are required."}, 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO reviews (product_id, user_id, author_name, rating, title, comment, is_verified_purchase, status)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'approved')
    """, (product_id, user_id, author_name, rating, title, comment))

    # Recalculate average rating & review count for the product
    cursor.execute("""
    SELECT AVG(rating) as avg_rating, COUNT(*) as rev_count
    FROM reviews WHERE product_id = ? AND status = 'approved'
    """, (product_id,))
    stats = cursor.fetchone()
    avg_r = round(stats["avg_rating"], 1) if stats["avg_rating"] else 5.0
    cnt = stats["rev_count"]

    cursor.execute("""
    UPDATE products SET rating = ?, review_count = ? WHERE id = ?
    """, (avg_r, cnt, product_id))

    conn.commit()
    conn.close()

    return {"message": "Thank you. Your review has been published.", "new_rating": avg_r, "review_count": cnt}, 201
