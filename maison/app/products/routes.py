"""
MAISON — Products Module
Handles product browsing, filtering by category, price, size, color, search, sorting, and detail views.
"""

from urllib.parse import parse_qs
from maison.app.models.db import get_db


def handle_get_categories() -> tuple:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.slug = p.category_slug
    GROUP BY c.id
    ORDER BY c.display_order ASC
    """)
    categories = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"categories": categories}, 200


def handle_get_products(query_params: dict) -> tuple:
    category = query_params.get("category", [""])[0]
    search = query_params.get("search", [""])[0].strip()
    min_price = query_params.get("min_price", [""])[0]
    max_price = query_params.get("max_price", [""])[0]
    size = query_params.get("size", [""])[0]
    color = query_params.get("color", [""])[0]
    sort_by = query_params.get("sort", ["featured"])[0]
    page = int(query_params.get("page", ["1"])[0])
    limit = int(query_params.get("limit", ["12"])[0])
    offset = (page - 1) * limit

    conn = get_db()
    cursor = conn.cursor()

    sql = """
    SELECT DISTINCT p.*, 
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) as primary_image,
           c.name as category_name
    FROM products p
    JOIN categories c ON p.category_slug = c.slug
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    WHERE 1=1
    """
    params = []

    if category and category != "all":
        sql += " AND p.category_slug = ?"
        params.append(category)

    if search:
        sql += " AND (p.name LIKE ? OR p.description LIKE ? OR p.material LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])

    if min_price:
        try:
            sql += " AND COALESCE(p.discount_price, p.base_price) >= ?"
            params.append(float(min_price))
        except ValueError:
            pass

    if max_price:
        try:
            sql += " AND COALESCE(p.discount_price, p.base_price) <= ?"
            params.append(float(max_price))
        except ValueError:
            pass

    if size and size != "all":
        sql += " AND pv.size = ?"
        params.append(size)

    if color and color != "all":
        sql += " AND pv.color LIKE ?"
        params.append(f"%{color}%")

    # Sorting
    if sort_by == "price_asc":
        sql += " ORDER BY COALESCE(p.discount_price, p.base_price) ASC"
    elif sort_by == "price_desc":
        sql += " ORDER BY COALESCE(p.discount_price, p.base_price) DESC"
    elif sort_by == "newest":
        sql += " ORDER BY p.is_new_arrival DESC, p.created_at DESC"
    elif sort_by == "bestseller":
        sql += " ORDER BY p.is_bestseller DESC, p.rating DESC"
    else: # featured
        sql += " ORDER BY p.is_featured DESC, p.id ASC"

    # Count total matching
    count_sql = f"SELECT COUNT(*) as total FROM ({sql})"
    cursor.execute(count_sql, params)
    total_count = cursor.fetchone()["total"]

    # Pagination
    sql += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    products = [dict(row) for row in rows]

    # Fetch variants & colors for each product to show swatches and available sizes
    for prod in products:
        cursor.execute("SELECT DISTINCT size FROM product_variants WHERE product_id = ?", (prod["id"],))
        prod["available_sizes"] = [r["size"] for r in cursor.fetchall()]
        cursor.execute("SELECT DISTINCT color, color_code FROM product_variants WHERE product_id = ?", (prod["id"],))
        prod["available_colors"] = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "products": products,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1
    }, 200


def handle_get_product_detail(slug_or_id: str) -> tuple:
    conn = get_db()
    cursor = conn.cursor()

    if slug_or_id.isdigit():
        cursor.execute("SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_slug = c.slug WHERE p.id = ?", (int(slug_or_id),))
    else:
        cursor.execute("SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_slug = c.slug WHERE p.slug = ?", (slug_or_id,))
    
    prod_row = cursor.fetchone()
    if not prod_row:
        conn.close()
        return {"error": "Product not found."}, 404

    prod = dict(prod_row)

    # Images
    cursor.execute("SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC", (prod["id"],))
    prod["images"] = [dict(r) for r in cursor.fetchall()]

    # Variants
    cursor.execute("SELECT * FROM product_variants WHERE product_id = ?", (prod["id"],))
    prod["variants"] = [dict(r) for r in cursor.fetchall()]

    # Available sizes & colors
    cursor.execute("SELECT DISTINCT size FROM product_variants WHERE product_id = ? AND stock_quantity > 0", (prod["id"],))
    prod["available_sizes"] = [r["size"] for r in cursor.fetchall()]
    cursor.execute("SELECT DISTINCT color, color_code FROM product_variants WHERE product_id = ? AND stock_quantity > 0", (prod["id"],))
    prod["available_colors"] = [dict(r) for r in cursor.fetchall()]

    # Reviews
    cursor.execute("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC", (prod["id"],))
    prod["reviews"] = [dict(r) for r in cursor.fetchall()]

    # Related products in same category
    cursor.execute("""
    SELECT p.*, 
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image
    FROM products p
    WHERE p.category_slug = ? AND p.id != ?
    LIMIT 4
    """, (prod["category_slug"], prod["id"]))
    prod["related_products"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"product": prod}, 200


def handle_get_featured_showcase() -> tuple:
    """
    Returns collections for the homepage: Hero campaign, New Arrivals, Bestsellers, and Collections
    """
    conn = get_db()
    cursor = conn.cursor()

    def get_prods_by_flag(flag: str, limit: int = 4):
        cursor.execute(f"""
        SELECT p.*, 
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image,
               c.name as category_name
        FROM products p
        JOIN categories c ON p.category_slug = c.slug
        WHERE p.{flag} = 1
        LIMIT ?
        """, (limit,))
        return [dict(r) for r in cursor.fetchall()]

    featured = get_prods_by_flag("is_featured", 6)
    new_arrivals = get_prods_by_flag("is_new_arrival", 4)
    bestsellers = get_prods_by_flag("is_bestseller", 4)

    conn.close()
    return {
        "featured": featured,
        "new_arrivals": new_arrivals,
        "bestsellers": bestsellers
    }, 200
