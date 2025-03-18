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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
