// Product & Transaction module
export type PaymentInitResponse = {
  paymentUrl: string;
  orderId: string;
  tranId: string;
};

export const initSslCommerzPayment = async (
  apiUrl: string,
  orderId: string
): Promise<PaymentInitResponse> => {
  const response = await fetch(`${apiUrl}/api/payment/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ orderId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to initialize payment");
  }

  if (!data?.paymentUrl) {
    throw new Error("Payment gateway URL was not returned");
  }

  return {
    paymentUrl: data.paymentUrl,
    orderId: data.orderId,
    tranId: data.tranId,
  };
};

export const redirectToPaymentGateway = (paymentUrl: string) => {
  window.location.href = paymentUrl;
};
