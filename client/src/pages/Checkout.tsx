import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  CreditCard,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useCreatePaymentIntent } from "@/hooks/useCheckout";
import { useCreateOrder } from "@/hooks/useOrders";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { toast } from "sonner";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

interface ShippingAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
}

interface CheckoutFormProps {
  clientSecret: string;
  total: number;
  shippingAddress: ShippingAddress;
  onAddressChange: (address: ShippingAddress) => void;
  onPaymentSuccess: () => void;
}

function CheckoutForm({
  clientSecret,
  total,
  shippingAddress,
  onAddressChange,
  onPaymentSuccess,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<keyof ShippingAddress, string>>
  >({});

  const validateAddress = (): boolean => {
    const errors: Partial<Record<keyof ShippingAddress, string>> = {};
    if (!shippingAddress.street.trim())
      errors.street = "Street address is required";
    if (!shippingAddress.city.trim()) errors.city = "City is required";
    if (!shippingAddress.zip.trim()) errors.zip = "ZIP code is required";
    if (!shippingAddress.country.trim()) errors.country = "Country is required";
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAddress()) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    if (!stripe || !elements) {
      toast.error("Stripe has not loaded yet. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Payment form error");
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/order-success`,
            payment_method_data: {
              billing_details: {
                address: {
                  line1: shippingAddress.street,
                  city: shippingAddress.city,
                  postal_code: shippingAddress.zip,
                  country: shippingAddress.country,
                },
              },
            },
          },
          redirect: "if_required",
        });

      if (confirmError) {
        toast.error(
          confirmError.message || "Payment failed. Please try again.",
        );
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        onPaymentSuccess();
      } else {
        toast.error("Payment was not successful. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Shipping Address
          </CardTitle>
          <CardDescription>Where should we deliver your order?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              placeholder="123 Main Street, Apt 4B"
              value={shippingAddress.street}
              onChange={(e) =>
                onAddressChange({ ...shippingAddress, street: e.target.value })
              }
              className={addressErrors.street ? "border-destructive" : ""}
            />
            {addressErrors.street && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {addressErrors.street}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Lisbon"
                value={shippingAddress.city}
                onChange={(e) =>
                  onAddressChange({ ...shippingAddress, city: e.target.value })
                }
                className={addressErrors.city ? "border-destructive" : ""}
              />
              {addressErrors.city && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {addressErrors.city}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                placeholder="1000-001"
                value={shippingAddress.zip}
                onChange={(e) =>
                  onAddressChange({ ...shippingAddress, zip: e.target.value })
                }
                className={addressErrors.zip ? "border-destructive" : ""}
              />
              {addressErrors.zip && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {addressErrors.zip}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="Portugal"
                value={shippingAddress.country}
                onChange={(e) =>
                  onAddressChange({
                    ...shippingAddress,
                    country: e.target.value,
                  })
                }
                className={addressErrors.country ? "border-destructive" : ""}
              />
              {addressErrors.country && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {addressErrors.country}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Details
          </CardTitle>
          <CardDescription>
            All transactions are secure and encrypted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full text-base"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            Pay €{total.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Your payment is secured with Stripe. We never store your card details.
      </p>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, fetchCart } = useCartStore();
  const cartTotal = useCartStore((state) => state.cartTotal());
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentFetched, setPaymentIntentFetched] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    zip: "",
    country: "",
  });

  const createPaymentIntent = useCreatePaymentIntent();
  const createOrder = useCreateOrder();

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Create payment intent once we have cart items
  useEffect(() => {
    if (
      items.length > 0 &&
      !paymentIntentFetched &&
      !createPaymentIntent.isPending &&
      !createPaymentIntent.isError
    ) {
      createPaymentIntent
        .mutateAsync()
        .then((result) => {
          setClientSecret(result.clientSecret);
          setPaymentIntentFetched(true);
        })
        .catch((err) => {
          console.error("Failed to create payment intent:", err);
        });
    }
  }, [
    items.length,
    paymentIntentFetched,
    createPaymentIntent.isPending,
    createPaymentIntent.isError,
  ]);

  const handlePaymentSuccess = async () => {
    try {
      const paymentIntentId = createPaymentIntent.data?.paymentIntentId;
      if (!paymentIntentId) {
        toast.error("Could not complete order: missing payment reference");
        return;
      }

      const order = await createOrder.mutateAsync({
        payment_intent_id: paymentIntentId,
        shipping_address: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          zip: shippingAddress.zip,
          country: shippingAddress.country,
        },
      });
      navigate(`/order-success?order_id=${order.id}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      toast.error(
        "Payment succeeded but order creation failed. Please contact support.",
      );
    }
  };

  // Empty cart state
  if (items.length === 0 && !createPaymentIntent.isPending) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-12 text-center">
          <CardContent className="space-y-4 pt-6">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Your cart is empty</h2>
            <p className="text-muted-foreground">
              Add some products to your cart before checking out.
            </p>
            <Button onClick={() => navigate("/products")} size="lg">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          className="mb-4 pl-0 hover:pl-2 transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-1">
          Complete your order by providing shipping and payment details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Forms */}
        <div className="lg:col-span-2">
          {createPaymentIntent.isPending ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Preparing checkout...</p>
              </CardContent>
            </Card>
          ) : createPaymentIntent.isError ? (
            <Card className="border-destructive">
              <CardContent className="p-8 text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <h3 className="text-lg font-semibold">Checkout Error</h3>
                <p className="text-muted-foreground">
                  Failed to initialize payment. Please try again.
                </p>
                <Button
                  onClick={() => {
                    setPaymentIntentFetched(false);
                  }}
                  variant="outline"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : clientSecret ? (
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#6366f1",
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <CheckoutForm
                clientSecret={clientSecret}
                total={cartTotal}
                shippingAddress={shippingAddress}
                onAddressChange={setShippingAddress}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </Elements>
          ) : null}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <div className="h-14 w-14 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product?.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product?.name}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">
                          {item.variant.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      €
                      {(
                        Number(item.product?.price ?? 0) * item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 pt-2 text-muted-foreground">
                <div className="flex items-center gap-1 text-xs">
                  <Lock className="h-3 w-3" />
                  SSL Encrypted
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CreditCard className="h-3 w-3" />
                  Stripe Secured
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
