"""
MAISON — Invoice Generation Service
Generates formal luxury e-commerce invoices and printable HTML/PDF representations.
"""

from typing import Dict, Any


def generate_invoice_html(order: Dict[str, Any], items: list) -> str:
    """
    Renders an elegant, printable HTML invoice for the order.
    """
    items_rows = ""
    for it in items:
        unit_price = f"${float(it['unit_price']):,.2f}"
        subtot = f"${float(it['subtotal']):,.2f}"
        items_rows += f"""
        <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #e7e5e4;">
                <div style="font-weight: 600; color: #1c1917;">{it['product_name']}</div>
                <div style="font-size: 13px; color: #78716c;">Variant: {it['color']} · Size {it['size']}</div>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #e7e5e4; text-align: center; color: #44403c;">{it['quantity']}</td>
            <td style="padding: 14px 0; border-bottom: 1px solid #e7e5e4; text-align: right; color: #44403c; font-family: monospace;">{unit_price}</td>
            <td style="padding: 14px 0; border-bottom: 1px solid #e7e5e4; text-align: right; font-weight: 600; color: #1c1917; font-family: monospace;">{subtot}</td>
        </tr>
        """

    subtotal_fmt = f"${float(order['subtotal']):,.2f}"
    discount_fmt = f"-${float(order['discount_amount']):,.2f}" if float(order.get('discount_amount', 0)) > 0 else "$0.00"
    shipping_fmt = "COMPLIMENTARY" if float(order['shipping_fee']) == 0 else f"${float(order['shipping_fee']):,.2f}"
    tax_fmt = f"${float(order['tax_amount']):,.2f}"
    total_fmt = f"${float(order['total_amount']):,.2f}"

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {order['order_number']} — MAISON</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #faf8f5;
            color: #1c1917;
            margin: 0;
            padding: 40px 20px;
        }}
        .invoice-card {{
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e7e5e4;
            padding: 48px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #1c1917;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }}
        .brand-logo {{
            font-family: "Cormorant Garamond", Georgia, serif;
            font-size: 32px;
            letter-spacing: 0.15em;
            font-weight: 700;
            margin: 0;
        }}
        .brand-tagline {{
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #78716c;
            margin-top: 4px;
        }}
        .invoice-meta {{
            text-align: right;
            font-size: 14px;
            color: #44403c;
        }}
        .grid-2 {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 36px;
            gap: 24px;
        }}
        .col {{
            flex: 1;
            font-size: 14px;
            line-height: 1.6;
            color: #44403c;
        }}
        .col-title {{
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a8a29e;
            font-weight: 600;
            margin-bottom: 8px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }}
        th {{
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a8a29e;
            padding-bottom: 12px;
            border-bottom: 1px solid #d6d3d1;
        }}
        .totals-table {{
            width: 320px;
            margin-left: auto;
            font-size: 14px;
        }}
        .totals-row {{
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: #57534e;
        }}
        .totals-final {{
            display: flex;
            justify-content: space-between;
            padding: 16px 0 0 0;
            border-top: 1px solid #1c1917;
            font-weight: 700;
            font-size: 18px;
            color: #1c1917;
        }}
        .footer-note {{
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid #e7e5e4;
            font-size: 12px;
            color: #78716c;
            text-align: center;
            line-height: 1.5;
        }}
        @media print {{
            body {{ background: #fff; padding: 0; }}
            .invoice-card {{ border: none; box-shadow: none; padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="max-width: 800px; margin: 0 auto 16px auto; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #1c1917; color: #fff; border: none; cursor: pointer; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">
            Print / Save as PDF
        </button>
    </div>

    <div class="invoice-card">
        <div class="header">
            <div>
                <h1 class="brand-logo">MAISON</h1>
                <div class="brand-tagline">Where Elegance Meets Everyday Luxury</div>
            </div>
            <div class="invoice-meta">
                <div style="font-size: 18px; font-weight: 700; color: #1c1917;">INVOICE</div>
                <div style="font-family: monospace; font-weight: 600; margin-top: 4px;">{order['order_number']}</div>
                <div style="margin-top: 4px; color: #78716c;">Date: {order['created_at'][:10]}</div>
                <div style="margin-top: 2px; color: #15803d; font-weight: 500;">Status: {order['payment_status']}</div>
            </div>
        </div>

        <div class="grid-2">
            <div class="col">
                <div class="col-title">Billed & Shipped To</div>
                <div style="font-weight: 600; color: #1c1917;">{order['customer_name']}</div>
                <div>{order['shipping_street']}</div>
                <div>{order['shipping_city']}, {order['shipping_postal']}</div>
                <div>{order['shipping_country']}</div>
                <div style="margin-top: 6px;">{order['customer_email']} · {order['customer_phone']}</div>
            </div>
            <div class="col" style="text-align: right;">
                <div class="col-title">Atelier Dispatch</div>
                <div style="font-weight: 600; color: #1c1917;">Maison Paris & New York</div>
                <div>740 Madison Avenue</div>
                <div>New York, NY 10065</div>
                <div>concierge@maison.luxury</div>
                <div style="margin-top: 6px;">Payment: {order['payment_method'].replace('_', ' ').title()}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Item & Specifications</th>
                    <th style="text-align: center; width: 15%;">Qty</th>
                    <th style="text-align: right; width: 15%;">Unit Price</th>
                    <th style="text-align: right; width: 20%;">Total</th>
                </tr>
            </thead>
            <tbody>
                {items_rows}
            </tbody>
        </table>

        <div class="totals-table">
            <div class="totals-row">
                <span>Subtotal</span>
                <span style="font-family: monospace;">{subtotal_fmt}</span>
            </div>
            <div class="totals-row">
                <span>Promotional Discount</span>
                <span style="font-family: monospace; color: #15803d;">{discount_fmt}</span>
            </div>
            <div class="totals-row">
                <span>White-Glove Shipping</span>
                <span style="font-family: monospace;">{shipping_fmt}</span>
            </div>
            <div class="totals-row">
                <span>VAT / Sales Tax (8.5%)</span>
                <span style="font-family: monospace;">{tax_fmt}</span>
            </div>
            <div class="totals-final">
                <span>Total Paid</span>
                <span style="font-family: monospace;">{total_fmt}</span>
            </div>
        </div>

        <div class="footer-note">
            Thank you for choosing MAISON. Each piece is covered by our Atelier Lifetime Craftsmanship Guarantee.<br>
            Complimentary returns and exchanges are available within 30 days of receipt.
        </div>
    </div>
</body>
</html>
"""
