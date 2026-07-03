import api from "./axios";

export const checkoutApi = {
  createPaymentIntent: async () => {
    const { data } = await api.post("/api/checkout/create-payment-intent");
    return data as {
      clientSecret: string;
      paymentIntentId: string;
      amount: number;
    };
  },
};
