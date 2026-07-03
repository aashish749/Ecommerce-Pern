import { useMutation } from "@tanstack/react-query";
import { checkoutApi } from "../api/checkout";

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export function useCreatePaymentIntent() {
  return useMutation<PaymentIntentResponse, Error>({
    mutationFn: () => checkoutApi.createPaymentIntent(),
  });
}
