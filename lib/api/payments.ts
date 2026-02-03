import { PricingTier } from '@/lib/lemonsqueezy';

/**
 * Creates a checkout session with Lemon Squeezy.
 * @param tier The pricing tier to purchase (starter, popular, or best)
 * @returns The checkout URL to redirect the user to
 */
export async function createCheckout(tier: PricingTier): Promise<{
  success: boolean;
  checkoutUrl: string;
}> {
  const response = await fetch('/api/payments/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Checkout creation failed');
  }

  return await response.json();
}
