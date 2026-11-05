"""
MAISON — Pricing & Financial Calculation Service
Uses Python's Decimal module with strict rounding for financial accuracy.
Handles subtotal, tiered luxury shipping, VAT/tax, and promotional coupons.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional

TAX_RATE = Decimal("0.085") # 8.5% Luxury VAT/Sales Tax
FREE_SHIPPING_THRESHOLD = Decimal("300.00") # Free white-glove delivery over $300
STANDARD_SHIPPING_FEE = Decimal("25.00") # $25 Express Global Courier


def to_decimal(val) -> Decimal:
    if val is None:
        return Decimal("0.00")
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_cart_totals(items: list, coupon_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Given cart items: [{'unit_price': float/Decimal, 'quantity': int}, ...],
    computes accurate subtotal, coupon discount, shipping fee, tax, and final total.
    """
    subtotal = Decimal("0.00")
    for item in items:
        price = to_decimal(item.get("unit_price") or item.get("price"))
        qty = Decimal(str(item.get("quantity", 1)))
        subtotal += (price * qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    discount_amount = Decimal("0.00")
    applied_coupon = None

    if coupon_data and coupon_data.get("is_active"):
        min_order = to_decimal(coupon_data.get("min_order_value", 0))
        if subtotal >= min_order:
            disc_type = coupon_data.get("discount_type")
            disc_val = to_decimal(coupon_data.get("discount_value", 0))

            if disc_type == "percent":
                calculated_discount = (subtotal * (disc_val / Decimal("100.00"))).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                max_disc = to_decimal(coupon_data.get("max_discount"))
                if max_disc > 0 and calculated_discount > max_disc:
                    calculated_discount = max_disc
                discount_amount = min(calculated_discount, subtotal)
            elif disc_type == "fixed":
                discount_amount = min(disc_val, subtotal)

            applied_coupon = {
                "code": coupon_data.get("code"),
                "discount_type": disc_type,
                "discount_value": float(disc_val),
                "discount_amount": float(discount_amount)
            }

    discounted_subtotal = max(Decimal("0.00"), subtotal - discount_amount)

    # Shipping threshold calculation
    if discounted_subtotal == Decimal("0.00") or discounted_subtotal >= FREE_SHIPPING_THRESHOLD:
        shipping_fee = Decimal("0.00")
    else:
        shipping_fee = STANDARD_SHIPPING_FEE

    # Tax calculation
    tax_amount = (discounted_subtotal * TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Final Total
    total_amount = discounted_subtotal + shipping_fee + tax_amount

    return {
        "subtotal": float(subtotal),
        "discount_amount": float(discount_amount),
        "shipping_fee": float(shipping_fee),
        "tax_amount": float(tax_amount),
        "total_amount": float(total_amount),
        "coupon": applied_coupon,
        "is_free_shipping": shipping_fee == Decimal("0.00")
    }
