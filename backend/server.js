import dotenv from 'dotenv';
import express from 'express';
import Razorpay from 'razorpay';
import cors from 'cors';
import crypto from 'crypto';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order
app.post("/create-order", async (req, res) => {
    try {
        const { amount, currency } = req.body;

        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: currency || "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify Payment
app.post("/verify-payment", async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature === razorpay_signature) {
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Handle Webhook Events (Payment Success, Failure, etc.)
app.post("/webhook", (req, res) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];
    const generatedSignature = crypto.createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (receivedSignature === generatedSignature) {
        console.log("Webhook Verified", req.body);
        // Handle different payment statuses
        if (req.body.event === "payment.captured") {
            console.log("Payment Successful");
            // Update DB for successful payment
        } else if (req.body.event === "payment.failed") {
            console.log("Payment Failed");
            // Handle failed payment
        }
        res.status(200).json({ status: "ok" });
    } else {
        res.status(400).json({ error: "Invalid signature" });
    }
});

// Get Payment Status
app.get("/payment-status/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await razorpay.orders.fetch(orderId);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Refund Payment
app.post("/refund-payment", async (req, res) => {
    try {
        const { paymentId, amount } = req.body;
        const refund = await razorpay.payments.refund(paymentId, { amount: amount * 100 });
        res.json({ success: true, refund });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Retry Payment (Create new order for failed payments)
app.post("/retry-payment", async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await razorpay.orders.fetch(orderId);
        
        if (order.status !== "paid") {
            const newOrder = await razorpay.orders.create({
                amount: order.amount,
                currency: order.currency,
                receipt: `retry_${Date.now()}`,
            });
            res.json({ success: true, newOrder });
        } else {
            res.status(400).json({ success: false, message: "Order is already paid" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
