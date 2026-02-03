import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

// Initialize SDK
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('[Lemon Squeezy] Error:', error),
});

export const LEMON_SQUEEZY_CONFIG = {
  storeId: +process.env.LEMONSQUEEZY_STORE_ID!,
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET!,
  variants: {
    starter: +process.env.LEMONSQUEEZY_VARIANT_STARTER!,
    popular: +process.env.LEMONSQUEEZY_VARIANT_POPULAR!,
    best: +process.env.LEMONSQUEEZY_VARIANT_BEST!,
  },
};

export const PRICING_TIERS = {
  starter: {
    credits: 2000,
    price: 5,
    variantId: LEMON_SQUEEZY_CONFIG.variants.starter,
  },
  popular: {
    credits: 4200,
    price: 10,
    variantId: LEMON_SQUEEZY_CONFIG.variants.popular,
  },
  best: {
    credits: 22000,
    price: 50,
    variantId: LEMON_SQUEEZY_CONFIG.variants.best,
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;
