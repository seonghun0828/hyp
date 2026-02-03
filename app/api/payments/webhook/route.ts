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
    const customData = payload.meta.custom_data;

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

    // Check if this order was already processed (idempotency)
    const { data: alreadyProcessed } = await supabase
      .from('payment_orders')
      .select('id, credits_granted')
      .eq('order_id', orderId)
      .maybeSingle();

    if (alreadyProcessed?.credits_granted) {
      console.log('[Webhook] Credits already granted:', orderId);
      return NextResponse.json(
        {
          message: 'Already processed',
        },
        { status: 200 }
      );
    }

    // Find the pending payment order for this user
    // Match by user_id and status='pending' (most recent one)
    const { data: pendingOrder } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pendingOrder) {
      console.error('[Webhook] No pending order found', { userId, orderId });
      return NextResponse.json(
        {
          error: 'No pending order found',
        },
        { status: 400 }
      );
    }

    console.log('[Webhook] Found pending order:', pendingOrder.id);

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
      .eq('id', pendingOrder.id);

    if (updateError) {
      console.error('[Webhook] Failed to update order:', updateError);
      // Continue anyway - credits were granted
    } else {
      console.log('[Webhook] Updated payment order:', pendingOrder.id);
    }

    // Log transaction with the correct payment_order_id
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditsAmount,
        type: 'purchase',
        description: `Purchased ${creditsAmount} credits via Lemon Squeezy`,
        payment_order_id: pendingOrder.id,
      });

    if (transactionError) {
      console.error('[Webhook] Failed to log transaction:', transactionError);
    } else {
      console.log('[Webhook] Logged transaction for order:', pendingOrder.id);
    }

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
