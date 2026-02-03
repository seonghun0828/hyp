import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { createClient } from '@/lib/supabase/server';
import {
  LEMON_SQUEEZY_CONFIG,
  PRICING_TIERS,
  PricingTier,
} from '@/lib/lemonsqueezy';
import { t } from '@/lib/api-messages';

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json();

    // Validate tier
    if (!tier || !(tier in PRICING_TIERS)) {
      return NextResponse.json(
        {
          error: 'Invalid tier',
        },
        { status: 400 }
      );
    }

    const tierConfig = PRICING_TIERS[tier as PricingTier];

    // Check user is logged in (REQUIRED - per user decision)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: t(request, 'loginRequired'),
        },
        { status: 401 }
      );
    }

    // Get locale from request for redirect URL
    const locale = request.headers.get('referer')?.includes('/ko/')
      ? 'ko'
      : 'en';

    // Create checkout with Lemon Squeezy
    const checkout = await createCheckout(
      LEMON_SQUEEZY_CONFIG.storeId,
      tierConfig.variantId,
      {
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
          desc: true,
          discount: true,
          buttonColor: '#5A78FF', // HYP primary color
        },
        checkoutData: {
          email: user.email || undefined,
          custom: {
            user_id: user.id,
            credits_amount: tierConfig.credits.toString(),
            tier: tier,
          },
        },
        productOptions: {
          enabledVariants: [tierConfig.variantId],
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/payment-success`,
        },
      }
    );

    // Handle error response from Lemon Squeezy
    if (checkout.error) {
      console.error('[Checkout] Lemon Squeezy error:', {
        error: checkout.error,
        statusCode: checkout.statusCode,
      });
      return NextResponse.json(
        {
          error: 'CHECKOUT_FAILED',
          message: t(request, 'checkoutFailed'),
        },
        { status: 500 }
      );
    }

    // Store pending order in database
    const { error: insertError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: user.id,
        checkout_id: checkout.data.data.id,
        variant_id: tierConfig.variantId,
        status: 'pending',
        amount_usd: tierConfig.price,
        credits_amount: tierConfig.credits,
        customer_email: user.email,
        tier: tier,
      });

    if (insertError) {
      console.error('[Checkout] Failed to store order:', insertError);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: t(request, 'serverError'),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.data.data.attributes.url,
    });
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      {
        error: 'CHECKOUT_FAILED',
        message: t(request, 'serverError'),
      },
      { status: 500 }
    );
  }
}
