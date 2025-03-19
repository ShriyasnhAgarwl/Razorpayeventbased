import React, { useState, useEffect } from "react";
import "./Payment.css";

const PaymentComponent = ({ amount, currency = "INR" }) => {
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [orderId, setOrderId] = useState(null);

    useEffect(() => {
        if (orderId) {
            fetchPaymentStatus(orderId);
        }
    }, [orderId]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const fetchPaymentStatus = async (orderId) => {
        try {
            const response = await fetch(`http://localhost:5000/payment-status/${orderId}`);
            const data = await response.json();

            if (data.success) {
                setPaymentStatus(data.order.status);
            }
        } catch (error) {
            console.error("Error fetching payment status:", error);
        }
    };

    const retryPayment = async () => {
        try {
            const response = await fetch("http://localhost:5000/retry-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            const data = await response.json();

            if (!data.success) {
                alert("Failed to retry payment");
                return;
            }

            setOrderId(data.newOrder.id);
            initiatePayment(data.newOrder.id);
        } catch (error) {
            console.error("Error retrying payment:", error);
        }
    };

    const requestRefund = async () => {
        try {
            const response = await fetch("http://localhost:5000/refund-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: "your_payment_id", amount: amount }),
            });

            const data = await response.json();

            if (data.success) {
                alert("Refund has been initiated!");
            } else {
                alert("Refund request failed");
            }
        } catch (error) {
            console.error("Error initiating refund:", error);
        }
    };

    const initiatePayment = async (orderId = null) => {
        try {
            setLoading(true);
            const scriptLoaded = await loadRazorpay();
            if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");
            if (!process.env.REACT_APP_RAZORPAY_KEY_ID) throw new Error("Razorpay Key ID is not configured");

            const response = await fetch("http://localhost:5000/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(amount), currency }),
            });
            
            if (!response.ok) throw new Error("Failed to create order");

            const data = await response.json();
            if (!data.success || !data.order) throw new Error(data.error || "Failed to create order");

            setOrderId(data.order.id);
            
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Your Business Name",
                description: "Order Payment",
                order_id: data.order.id,
                handler: async (response) => {
                    try {
                        const verifyResponse = await fetch("http://localhost:5000/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(response),
                        });
                        
                        const verifyData = await verifyResponse.json();
                        if (verifyData.success) {
                            alert("✅ Payment Successful!");
                        } else {
                            alert("❌ Payment verification failed");
                        }
                    } catch (error) {
                        alert("❌ Payment verification failed: " + error.message);
                    }
                },
                prefill: {
                    name: "User Name",
                    email: "user@example.com",
                    contact: "9876543210",
                },
                theme: { color: "#3399cc" },
                modal: {
                    ondismiss: () => alert("⚠️ Payment process was interrupted!"),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            alert(error.message);
            console.error("Payment error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-container">
            <button className="payment-button" onClick={initiatePayment} disabled={loading}>
                {loading ? "Processing..." : `Pay ₹${amount}`}
            </button>

            {paymentStatus === "failed" && (
                <button className="retry-button" onClick={retryPayment}>
                    Retry Payment
                </button>
            )}

            {paymentStatus === "captured" && (
                <button className="refund-button" onClick={requestRefund}>
                    Request Refund
                </button>
            )}
        </div>
    );
};

export default PaymentComponent;
