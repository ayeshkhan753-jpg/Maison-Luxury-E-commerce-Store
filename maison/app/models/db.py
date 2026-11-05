"""
MAISON — Database Layer & SQLite Schema Management
Handles database initialization, relational tables, migrations, and luxury seed data.
"""

import os
import sqlite3
import hashlib
import json
from decimal import Decimal
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "instance")
DB_PATH = os.path.join(DB_DIR, "maison.db")


def get_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def hash_password(password: str) -> str:
    salt = "maison_luxury_salt_2026"
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()


def verify_password(stored_hash: str, password: str) -> bool:
    return stored_hash == hash_password(password)


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        role TEXT DEFAULT 'customer',
        profile_image TEXT DEFAULT '',
        is_verified INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Addresses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        delivery_notes TEXT DEFAULT '',
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # Categories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0
    );
    """)

    # Products
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category_slug TEXT NOT NULL,
        base_price REAL NOT NULL,
        discount_price REAL,
        is_featured INTEGER DEFAULT 0,
        is_new_arrival INTEGER DEFAULT 0,
        is_bestseller INTEGER DEFAULT 0,
        rating REAL DEFAULT 5.0,
        review_count INTEGER DEFAULT 0,
        material TEXT DEFAULT 'Pure Cashmere / Mulberry Silk',
        specifications TEXT DEFAULT '',
        care_instructions TEXT DEFAULT 'Dry clean only by luxury garment specialist.',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Product Images
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        alt_text TEXT DEFAULT '',
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
    """)

    # Product Variants (Sizes, Colors, Stock)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        color_code TEXT DEFAULT '#000000',
        stock_quantity INTEGER DEFAULT 10,
        sku TEXT UNIQUE NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
    """)

    # Carts & Cart Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        variant_id INTEGER,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
    """)

    # Wishlists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wishlist_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wishlist_id) REFERENCES wishlists (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE (wishlist_id, product_id)
    );
    """)

    # Coupons
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_type TEXT NOT NULL, -- 'percent' or 'fixed'
        discount_value REAL NOT NULL,
        min_order_value REAL DEFAULT 0,
        max_discount REAL,
        usage_limit INTEGER DEFAULT 1000,
        times_used INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        expiry_date TEXT
    );
    """)

    # Orders & Order Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        session_id TEXT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        shipping_street TEXT NOT NULL,
        shipping_city TEXT NOT NULL,
        shipping_postal TEXT NOT NULL,
        shipping_country TEXT NOT NULL,
        delivery_instructions TEXT DEFAULT '',
        subtotal REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        coupon_code TEXT DEFAULT '',
        shipping_fee REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL, -- 'stripe_sandbox', 'cod', 'local_gateway'
        payment_status TEXT DEFAULT 'Pending', -- 'Paid', 'Pending', 'Failed'
        order_status TEXT DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'
        tracking_number TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        image_url TEXT DEFAULT '',
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );
    """)

    # Reviews
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id INTEGER,
        author_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT NOT NULL,
        comment TEXT NOT NULL,
        is_verified_purchase INTEGER DEFAULT 1,
        status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
    """)

    # Newsletter
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    seed_initial_data(conn)
    conn.close()


def seed_initial_data(conn):
    cursor = conn.cursor()

    # Seed Admin and Client Users
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, phone, role, is_verified)
        VALUES 
        ('admin@maison.luxury', ?, 'Maison Atelier Administrator', '+1 (212) 555-0199', 'admin', 1),
        ('client@maison.luxury', ?, 'Genevieve Laurent', '+1 (212) 555-0144', 'customer', 1);
        """, (hash_password("MaisonAdmin2026!"), hash_password("MaisonClient2026!")))

        # Add initial customer address
        cursor.execute("""
        INSERT INTO addresses (user_id, full_name, phone, street, city, postal_code, country, is_default)
        VALUES (2, 'Genevieve Laurent', '+1 (212) 555-0144', '740 Park Avenue, Penthouse B', 'New York', '10021', 'United States', 1);
        """)

    # Seed Categories
    cursor.execute("SELECT COUNT(*) as count FROM categories")
    if cursor.fetchone()["count"] == 0:
        categories = [
            ("womens-clothing", "Women's Collection", "Refined silhouettes, architectural draping, and noble fabrics.", "/src/assets/images/campaign_womens_couture_1793861001519.jpg", 1),
            ("mens-clothing", "Men's Collection", "Sartorial craftsmanship, unstructured Italian tailoring, and fine fibers.", "/src/assets/images/campaign_mens_tailoring_1793861002197.jpg", 2),
            ("accessories", "Handbags & Accessories", "Artisanal calfskin leather goods, jewelry, and iconic pieces.", "/src/assets/images/campaign_luxury_accessories_1793861003226.jpg", 3),
            ("outerwear", "Luxury Outerwear", "Double-faced cashmere coats, trench capes, and shearling coats.", "/src/assets/images/hero_luxury_editorial_1793861001211.jpg", 4),
            ("shoes", "Footwear Atelier", "Hand-welted leather loafers, sculptural boots, and evening pumps.", "/src/assets/images/campaign_luxury_accessories_1793861003226.jpg", 5),
            ("luxury-essentials", "Luxury Essentials", "Timeless silk camisoles, Supima cotton poplin shirts, and knitwear.", "/src/assets/images/campaign_womens_couture_1793861001519.jpg", 6),
        ]
        cursor.executemany("""
        INSERT INTO categories (slug, name, description, image_url, display_order)
        VALUES (?, ?, ?, ?, ?)
        """, categories)

    # Seed Products
    cursor.execute("SELECT COUNT(*) as count FROM products")
    if cursor.fetchone()["count"] == 0:
        products = [
            # 1
            ("atelier-cashmere-overcoat", "Atelier Double-Faced Cashmere Overcoat", 
             "Masterfully tailored from hand-brushed Mongolian double-faced cashmere. Features an architectural drop shoulder, concealed horn button placket, and a soft self-tie sash.",
             "outerwear", 1850.00, 1650.00, 1, 1, 1, 4.9, 18,
             "100% Mongolian Cashmere, horn buttons",
             "Architectural notched lapels, dual side slash pockets, hand-stitched borders",
             "Specialist luxury dry clean only. Store on shaped wooden hanger with breathable cedar protector."),
            
            # 2
            ("sculptural-silk-pleated-gown", "Sculptural Silk Draped Evening Gown",
             "Cut on the bias in heavy mulberry silk crepe de chine. Dramatic fluid pleating cascades across the bodice into an ethereal floor-skimming silhouette.",
             "womens-clothing", 1420.00, None, 1, 1, 0, 5.0, 12,
             "100% Heavy Mulberry Silk (32mm)",
             "Interior boned bodice for subtle structure, invisible back zip, fully silk lined",
             "Dry clean only. Steam gently on reverse."),

            # 3
            ("charcoal-flannel-tailored-blazer", "Sartorial Charcoal Wool-Flannel Blazer",
             "Crafted in Biella, Italy using super 150s virgin wool flannel. Half-canvas interior construction delivers effortless drape with natural shoulder pads.",
             "mens-clothing", 1290.00, 1150.00, 1, 0, 1, 4.8, 24,
             "95% Super 150s Virgin Wool, 5% Cashmere; Bemberg cupro lining",
             "Soft Neapolitan shoulder, genuine mother-of-pearl buttons, functioning surgical cuffs",
             "Dry clean only. Air out after wearing."),

            # 4
            ("artisan-calfskin-lock-bag", "The Aurora Handcrafted Calfskin Top-Handle",
             "Hand-stitched by Tuscan master leather artisans using full-grain French box calfskin. Finished with custom 24k gold-plated brass lock hardware and detachable shoulder strap.",
             "accessories", 2100.00, None, 1, 1, 1, 5.0, 31,
             "Full-grain French Box Calfskin, Lambskin nappa interior lining",
             "Key clochette, 2 interior zip compartments, protective brass bottom feet",
             "Condition periodically with neutral beeswax leather balm. Keep in felt dustbag."),

            # 5
            ("monochrome-merino-knit-dress", "Architectural Ribbed Merino Midi Dress",
             "Spun from ultra-fine 16-gauge Australian merino wool. Ergonomic contour ribbing flatters the form without restricting graceful movement.",
             "womens-clothing", 680.00, 590.00, 0, 1, 0, 4.7, 15,
             "100% Extra-Fine Merino Wool (Woolmark Certified)",
             "Seamless knit technology, midi length, high boat neck",
             "Hand wash cold in cashmere wash or professional dry clean. Dry flat."),

            # 6
            ("raw-edge-cashmere-scarf", "Brushed Cashmere Grand Shawl",
             "Sumptuously lightweight yet cocooning warmth. Delicate eyelash fringing along every edge with subtle woven MAISON monogram tone-on-tone embroidery.",
             "accessories", 450.00, None, 0, 0, 1, 4.9, 42,
             "100% Grade-A Mongolian Cashmere",
             "200cm x 90cm oversized generous wrap proportions",
             "Hand wash delicately in cold water with wool conditioner."),

            # 7
            ("pleated-silk-poplin-shirt", "The Signature Italian Poplin Shirt",
             "Woven from high-twist 2-ply Egyptian Giza cotton poplin with a silky, crisp hand. Styled with an elongated cuff and refined concealed placket.",
             "luxury-essentials", 390.00, 340.00, 0, 1, 1, 4.9, 19,
             "100% Egyptian Giza 87 Extra-Long Staple Cotton",
             "Australian Mother-of-Pearl buttons, French seams, back box pleat",
             "Machine wash cold delicate or professional hand press."),

            # 8
            ("sculpted-heel-leather-pump", "The Velo Sculptural Block Pump",
             "Carved from Italian glove-soft nappa leather. Features an asymmetrical curved 70mm architectural heel balanced by a cushioned leather insole.",
             "shoes", 820.00, None, 0, 0, 0, 4.6, 9,
             "100% Lambskin Nappa upper, Italian leather sole with rubber injection",
             "70mm architectural block heel, reinforced heel counter",
             "Store with cedar shoe trees in individual dust bags.")
        ]

        cursor.executemany("""
        INSERT INTO products (
            slug, name, description, category_slug, base_price, discount_price, 
            is_featured, is_new_arrival, is_bestseller, rating, review_count, 
            material, specifications, care_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, products)

        # Product Images mapping
        product_img_map = {
            1: [
                ("/src/assets/images/hero_luxury_editorial_1793861001211.jpg", 1),
                ("/src/assets/images/campaign_womens_couture_1793861001519.jpg", 0)
            ],
            2: [
                ("/src/assets/images/campaign_womens_couture_1793861001519.jpg", 1),
                ("/src/assets/images/hero_luxury_editorial_1793861001211.jpg", 0)
            ],
            3: [
                ("/src/assets/images/campaign_mens_tailoring_1793861002197.jpg", 1),
                ("/src/assets/images/hero_luxury_editorial_1793861001211.jpg", 0)
            ],
            4: [
                ("/src/assets/images/campaign_luxury_accessories_1793861003226.jpg", 1),
                ("/src/assets/images/campaign_womens_couture_1793861001519.jpg", 0)
            ],
            5: [
                ("/src/assets/images/campaign_womens_couture_1793861001519.jpg", 1),
                ("/src/assets/images/hero_luxury_editorial_1793861001211.jpg", 0)
            ],
            6: [
                ("/src/assets/images/campaign_luxury_accessories_1793861003226.jpg", 1)
            ],
            7: [
                ("/src/assets/images/campaign_mens_tailoring_1793861002197.jpg", 1)
            ],
            8: [
                ("/src/assets/images/campaign_luxury_accessories_1793861003226.jpg", 1)
            ]
        }

        for pid, imgs in product_img_map.items():
            for idx, (url, is_primary) in enumerate(imgs):
                cursor.execute("""
                INSERT INTO product_images (product_id, image_url, is_primary, alt_text, display_order)
                VALUES (?, ?, ?, ?, ?)
                """, (pid, url, is_primary, f"Product {pid} view {idx+1}", idx))

        # Product Variants (Sizes & Colors)
        sizes_apparel = ["XS", "S", "M", "L", "XL"]
        sizes_shoes = ["EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41"]
        sizes_onesize = ["One Size"]

        colors_palette = [
            ("Onyx Black", "#171717"),
            ("Ivory Cream", "#F5F2EB"),
            ("Camel Cashmere", "#C19A6B"),
            ("Charcoal Slate", "#334155")
        ]

        for p_id in range(1, 9):
            if p_id in [4, 6]: # Bag & Scarf
                for c_name, c_hex in colors_palette[:2]:
                    cursor.execute("""
                    INSERT INTO product_variants (product_id, size, color, color_code, stock_quantity, sku)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (p_id, "One Size", c_name, c_hex, 12, f"MSN-P{p_id}-OS-{c_name[:3].upper()}"))
            elif p_id == 8: # Shoes
                for sz in sizes_shoes[:4]:
                    for c_name, c_hex in [("Onyx Black", "#171717"), ("Ivory Cream", "#F5F2EB")]:
                        cursor.execute("""
                        INSERT INTO product_variants (product_id, size, color, color_code, stock_quantity, sku)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, (p_id, sz, c_name, c_hex, 8, f"MSN-P{p_id}-{sz.replace(' ', '')}-{c_name[:3].upper()}"))
            else: # Apparel
                for sz in sizes_apparel[:4]:
                    for c_name, c_hex in [("Onyx Black", "#171717"), ("Camel Cashmere", "#C19A6B"), ("Ivory Cream", "#F5F2EB")]:
                        cursor.execute("""
                        INSERT INTO product_variants (product_id, size, color, color_code, stock_quantity, sku)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, (p_id, sz, c_name, c_hex, 10, f"MSN-P{p_id}-{sz}-{c_name[:3].upper()}"))

    # Seed Coupons
    cursor.execute("SELECT COUNT(*) as count FROM coupons")
    if cursor.fetchone()["count"] == 0:
        coupons = [
            ("MAISON10", "percent", 10.0, 300.0, 300.0, 1000, 4, 1, "2027-12-31"),
            ("LUXURY20", "percent", 20.0, 1000.0, 500.0, 500, 12, 1, "2027-12-31"),
            ("WELCOME50", "fixed", 50.0, 250.0, 50.0, 1000, 48, 1, "2027-12-31"),
        ]
        cursor.executemany("""
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, times_used, is_active, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, coupons)

    # Seed Initial Reviews
    cursor.execute("SELECT COUNT(*) as count FROM reviews")
    if cursor.fetchone()["count"] == 0:
        reviews = [
            (1, 2, "Genevieve Laurent", 5, "Unmatched drape and cloud-like warmth",
             "The double-faced cashmere is sublime. The drop shoulder creates an exquisite silhouette that transitions seamlessly from day to evening.", 1, "approved"),
            (1, 2, "Helena Vance", 5, "An investment piece for decades",
             "Exceeded my highest expectations. The stitching along the notched lapels is done by hand with immaculate precision.", 1, "approved"),
            (2, 2, "Victoria St. Claire", 5, "Pure runway elegance",
             "Wore this to the Opera Garnier opening gala. Received endless compliments on the bias drape and fluid movement.", 1, "approved"),
            (4, 2, "Claire Dupont", 5, "The leather scent and brass hardware are divine",
             "The box calfskin is smooth as silk with just the right structure. Beautifully packaged with cedar shavings and custom silk ribbon.", 1, "approved")
        ]
        cursor.executemany("""
        INSERT INTO reviews (product_id, user_id, author_name, rating, title, comment, is_verified_purchase, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, reviews)

    # Seed an Initial Completed Order for Client account
    cursor.execute("SELECT COUNT(*) as count FROM orders")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO orders (
            order_number, user_id, customer_name, customer_email, customer_phone,
            shipping_street, shipping_city, shipping_postal, shipping_country, delivery_instructions,
            subtotal, discount_amount, coupon_code, shipping_fee, tax_amount, total_amount,
            payment_method, payment_status, order_status, tracking_number
        ) VALUES (
            'MSN-2026-8812', 2, 'Genevieve Laurent', 'client@maison.luxury', '+1 (212) 555-0144',
            '740 Park Avenue, Penthouse B', 'New York', '10021', 'United States', 'Leave with concierge.',
            2100.00, 0.00, '', 0.00, 178.50, 2278.50,
            'stripe_sandbox', 'Paid', 'Delivered', 'MSN-FEDEX-998821'
        );
        """)
        cursor.execute("""
        INSERT INTO order_items (
            order_id, product_id, product_name, size, color, quantity, unit_price, subtotal, image_url
        ) VALUES (
            1, 4, 'The Aurora Handcrafted Calfskin Top-Handle', 'One Size', 'Onyx Black', 1, 2100.00, 2100.00,
            '/src/assets/images/campaign_luxury_accessories_1793861003226.jpg'
        );
        """)

    conn.commit()


if __name__ == "__main__":
    init_db()
    print("Maison database initialized and seeded successfully.")
