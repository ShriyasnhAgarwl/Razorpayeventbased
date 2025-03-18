import React from "react";

const PaymentComponent = ({ amount, orderId, currency }) => {
    const loadRazorpay = () => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
    };

    const initiatePayment = async () => {
        loadRazorpay();
        const response = await fetch("http://localhost:5000/create-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount, currency }),
        });

        const data = await response.json();

        if (!data.success) {
            alert("Failed to initiate payment");
            return;
        }

        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: data.order.amount,
            currency: data.order.currency,
            name: "Your Business Name",
            description: "Order Payment",
            order_id: data.order.id,
            handler: function (response) {
                alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
                // Send payment ID to backend to verify and update order status
            },
            prefill: {
                name: "User Name",
                email: "user@example.com",
                contact: "9876543210",
            },
            notes: {
                address: "Some Address",
            },
            theme: {
                color: "#3399cc",
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <div>
            <button onClick={initiatePayment}>Pay ₹{amount}</button>
        </div>
    );
};

export default PaymentComponent;
