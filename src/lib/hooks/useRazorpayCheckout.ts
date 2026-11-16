'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CreditPackage } from '@/lib/supabase/db';

export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const loadCheckoutScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const startCheckout = async (
    pack: CreditPackage,
    user: { id: string; email: string; name?: string },
    onSuccess?: (res: any) => void,
    onError?: (err: any) => void
  ) => {
    setIsProcessing(true);
    const loaded = await loadCheckoutScript();
    if (!loaded) {
      setIsProcessing(false);
      const msg = 'Razorpay payment gateway failed to load. Please check your internet connection.';
      if (onError) onError(new Error(msg));
      else alert(msg);
      return;
    }

    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Tz9TU5AYYJCplL';
    const totalCredits = pack.credits + (pack.bonus_credits || 0);

    const options = {
      key,
      amount: Math.round(pack.price_inr * 100), // paise
      currency: 'INR',
      name: 'CraftAI Studio',
      description: `${pack.name} — ${totalCredits} Credits`,
      prefill: {
        email: user.email,
        name: user.name || '',
      },
      theme: { color: '#6366F1' },
      handler: async (response: any) => {
        try {
          const supabase = createClient();
          if (supabase) {
            const { data, error } = await supabase.rpc('fulfill_credit_purchase', {
              p_user_id: user.id,
              p_package_id: pack.package_id || pack.id,
              p_order_id: response.razorpay_order_id || null,
              p_payment_id: response.razorpay_payment_id,
              p_signature: response.razorpay_signature || null,
              p_payment_method: 'razorpay',
            });

            if (error) {
              console.warn('[useRazorpayCheckout] RPC fulfill_credit_purchase error:', error);
            }
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('craftai_wallet_updated'));
          }

          if (onSuccess) {
            onSuccess(response);
          }
        } catch (err: any) {
          console.error('[useRazorpayCheckout] Handler error:', err);
          if (onError) onError(err);
          else alert('Error updating credits: ' + (err.message || 'Payment fulfillment error'));
        } finally {
          setIsProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setIsProcessing(false);
        const failMsg = resp.error?.description || 'Payment was declined or cancelled.';
        if (onError) onError(new Error(failMsg));
        else alert(`Payment Failed: ${failMsg}`);
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessing(false);
      if (onError) onError(err);
      else alert('Failed to launch Razorpay checkout modal: ' + err.message);
    }
  };

  return { startCheckout, isProcessing };
}

