// PayFast Configuration
// Credentials are read from environment variables to keep them out of source control.
// Merchant ID and Key are required in the HTML form, so they are public in the client-side code by necessity.

const isProduction = process.env.NODE_ENV === 'production';

export const payfastConfig = {
    // Default to Sandbox credentials if env vars are missing
    merchantId: process.env.PAYFAST_MERCHANT_ID || "10000100", 
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a",
    
    // Toggle URL based on environment
    url: isProduction 
        ? "https://www.payfast.co.za/eng/process" 
        : "https://sandbox.payfast.co.za/eng/process"
};

export const generatePaymentData = (amount: number, itemName: string, returnUrl: string, cancelUrl: string, email: string, name?: string) => {
    return {
        merchant_id: payfastConfig.merchantId,
        merchant_key: payfastConfig.merchantKey,
        amount: amount.toFixed(2),
        item_name: itemName,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        email_address: email,
        name_first: name || ''
    };
};