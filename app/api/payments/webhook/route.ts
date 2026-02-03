import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LEMON_SQUEEZY_CONFIG } from '@/lib/lemonsqueezy';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('X-Signature');

    // Verify webhook signature (CRITICAL SECURITY STEP)
    if (!verifySignature(rawBody, signature)) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        {
          error: 'Invalid signature',
        },
        { status: 401 }
      );
    }

    // Parse webhook data
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    console.log('[Webhook] Received event:', eventName);
    console.log('[Webhook] Payload structure:', {
      event: eventName,
      dataType: payload.data?.type,
      hasAttributes: !!payload.data?.attributes,
    });

    // Only process order_created events
    if (eventName !== 'order_created') {
      console.log('[Webhook] Ignored event:', eventName);
      return NextResponse.json(
        {
          message: 'Event ignored',
        },
        { status: 200 }
      );
    }

    const orderId = payload.data.id;
    const orderData = payload.data.attributes;

    // Extract custom data from checkout_data.custom
    const customData = orderData.checkout_data?.custom || {};

    console.log('[Webhook] Custom data:', customData);

    const userId = customData.user_id;
    const creditsAmount = parseInt(customData.credits_amount, 10);

    if (!userId || !creditsAmount) {
      console.error('[Webhook] Missing user_id or credits_amount', {
        userId,
        creditsAmount,
        customData,
      });
      return NextResponse.json(
        {
          error: 'Invalid custom data',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Idempotency: Check if credits already granted
    const { data: existingOrder } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingOrder?.credits_granted) {
      console.log('[Webhook] Credits already granted:', orderId);
      return NextResponse.json(
        {
          message: 'Already processed',
        },
        { status: 200 }
      );
    }

    // Grant credits to paid_credits
    await grantCredits(userId, creditsAmount, supabase);

    // Update payment order status
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        order_id: orderId,
        status: 'paid',
        credits_granted: true,
        credits_granted_at: new Date().toISOString(),
        webhook_received_at: new Date().toISOString(),
        webhook_event_name: eventName,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (updateError) {
      console.error('[Webhook] Failed to update order:', updateError);
      // Continue anyway - credits were granted
    }

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: creditsAmount,
      type: 'purchase',
      description: `Purchased ${creditsAmount} credits via Lemon Squeezy`,
      payment_order_id: existingOrder?.id,
    });

    console.log('[Webhook] Successfully processed:', orderId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    // Return 200 to prevent infinite retries
    return NextResponse.json(
      {
        error: 'Processing failed',
      },
      { status: 200 }
    );
  }
}

/**
 * Verify HMAC SHA-256 signature from Lemon Squeezy webhook
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = LEMON_SQUEEZY_CONFIG.webhookSecret;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  return crypto.timingSafeEqual(digest, signatureBuffer);
}

/**
 * Grant credits to user's paid_credits column
 */
async function grantCredits(
  userId: string,
  amount: number,
  supabase: any
): Promise<void> {
  const { data } = await supabase
    .from('user_credits')
    .select('paid_credits')
    .eq('user_id', userId)
    .maybeSingle();

  const currentPaid = data?.paid_credits || 0;

  await supabase
    .from('user_credits')
    .update({
      paid_credits: currentPaid + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}
