import Razorpay from 'razorpay';

export type PaymentMode = 'LIVE' | 'SIMULATION';

interface RazorpayConfig {
  instance: Razorpay | null;
  mode: PaymentMode;
  keyId: string | null;
}

/**
 * Initialize Razorpay SDK. 
 * Automatically switches to SIMULATION mode if environment variables are missing.
 */
export const getRazorpayConfig = (): RazorpayConfig => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('--- RAZORPAY CONFIG: Missing keys. Defaulting to SIMULATION mode. ---');
    return {
      instance: null,
      mode: 'SIMULATION',
      keyId: null
    };
  }

  try {
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    
    return {
      instance,
      mode: 'LIVE',
      keyId
    };
  } catch (error) {
    console.error('--- RAZORPAY CONFIG: Initialization failed. Falling back to SIMULATION. ---', error);
    return {
      instance: null,
      mode: 'SIMULATION',
      keyId: null
    };
  }
};
