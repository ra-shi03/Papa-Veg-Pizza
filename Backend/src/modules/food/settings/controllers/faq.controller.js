import { FoodFaq } from '../models/faq.model.js';

const defaultSeedFaqs = [
    {
        title: "How do I place an order on Papa Veg Pizza?",
        content: "Browse our menu, select your favourite 100% vegetarian pizzas and sides, add them to your cart, choose your delivery address, and proceed to payment.",
        category: "Ordering",
        order: 1,
        isActive: true
    },
    {
        title: "Can I customize the pizza crust and toppings?",
        content: "Yes! When selecting any pizza, you can customize your crust (such as Cheese Burst, Thin Crust, Pan Pizza) and choose extra vegetarian toppings.",
        category: "Ordering",
        order: 2,
        isActive: true
    },
    {
        title: "Can I modify or cancel my order after placing it?",
        content: "Orders can be cancelled or modified within 2 minutes of placing them before the kitchen starts baking. You can also contact support for prompt assistance.",
        category: "Ordering",
        order: 3,
        isActive: true
    },
    {
        title: "What payment methods do you accept?",
        content: "We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards (Visa, Mastercard, RuPay), Net Banking, Papa Veg Wallet, and Cash on Delivery (COD).",
        category: "Payments",
        order: 1,
        isActive: true
    },
    {
        title: "Is online payment safe and secure?",
        content: "Yes, our payment gateway is 100% PCI-DSS compliant and secured with 256-bit SSL encryption. We never store your full card or banking credentials.",
        category: "Payments",
        order: 2,
        isActive: true
    },
    {
        title: "How do Papa Veg Wallet and Refund Points work?",
        content: "Refund points and promotional credits are stored in your Papa Veg Wallet. 1 Point = ₹1, and they can be redeemed instantly at checkout without any extra fees.",
        category: "Payments",
        order: 3,
        isActive: true
    },
    {
        title: "What are your delivery hours and estimated delivery time?",
        content: "We deliver fresh, hot vegetarian pizzas from 10:00 AM to 11:30 PM. Average delivery time is typically 30 to 45 minutes depending on distance and traffic.",
        category: "Delivery",
        order: 1,
        isActive: true
    },
    {
        title: "How do I track my delivery in real-time?",
        content: "Go to 'My Orders' in your account and select your active order to view live status updates from baking to our rider arriving at your doorstep.",
        category: "Delivery",
        order: 2,
        isActive: true
    },
    {
        title: "Do you deliver to train seats via PNR?",
        content: "Yes! Papa Veg Pizza offers delivery directly to your train coach and seat at participating railway stations. Just enter your PNR during checkout.",
        category: "Delivery",
        order: 3,
        isActive: true
    },
    {
        title: "How do I manage my saved delivery addresses?",
        content: "Go to Profile > My Addresses where you can add new addresses, set a default address, or edit existing Home/Office locations on our interactive map.",
        category: "Account & Profile",
        order: 1,
        isActive: true
    },
    {
        title: "How do I update my mobile number or email?",
        content: "Go to Profile > Profile Details. You can edit your name and personal details. For security, mobile number updates may require OTP verification.",
        category: "Account & Profile",
        order: 2,
        isActive: true
    },
    {
        title: "What is your refund policy?",
        content: "If an order is cancelled before preparation or if there is an issue with your delivery, refunds are credited back to your original payment method (3-5 business days) or instantly to your Papa Veg Wallet.",
        category: "Refunds & Returns",
        order: 1,
        isActive: true
    },
    {
        title: "What should I do if an item is missing or incorrect?",
        content: "Please submit a support ticket via Profile > Need Help or contact support within 2 hours of delivery. Our customer support team will immediately arrange a replacement or refund.",
        category: "Refunds & Returns",
        order: 2,
        isActive: true
    },
    {
        title: "Are all products 100% pure vegetarian?",
        content: "Yes! Papa Veg Pizza is strictly 100% vegetarian. All cheeses, sauces, doughs, and toppings are certified vegetarian.",
        category: "General",
        order: 1,
        isActive: true
    },
    {
        title: "How can I apply coupons and promo codes?",
        content: "During checkout, click on 'Apply Coupon' to view all available discounts and BOGO offers, or manually type your promo code and click Apply.",
        category: "General",
        order: 2,
        isActive: true
    }
];

export const getPublicFaqs = async (req, res) => {
    try {
        let count = await FoodFaq.countDocuments();
        if (count === 0) {
            await FoodFaq.insertMany(defaultSeedFaqs);
        }
        const faqs = await FoodFaq.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: faqs
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAdminFaqs = async (req, res) => {
    try {
        let count = await FoodFaq.countDocuments();
        if (count === 0) {
            await FoodFaq.insertMany(defaultSeedFaqs);
        }
        const faqs = await FoodFaq.find().sort({ order: 1, createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: faqs
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createFaq = async (req, res) => {
    try {
        const { title, content, category, order, isActive } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Question/Title and Answer/Content are required' });
        }
        const faq = await FoodFaq.create({
            title: String(title).trim(),
            content: String(content).trim(),
            category: String(category || 'General').trim(),
            order: Number(order) || 0,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });
        return res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            data: faq
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, order, isActive } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = String(title).trim();
        if (content !== undefined) updateData.content = String(content).trim();
        if (category !== undefined) updateData.category = String(category).trim();
        if (order !== undefined) updateData.order = Number(order);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        const updated = await FoodFaq.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }
        return res.status(200).json({
            success: true,
            message: 'FAQ updated successfully',
            data: updated
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await FoodFaq.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }
        return res.status(200).json({
            success: true,
            message: 'FAQ deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleFaqStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const faq = await FoodFaq.findById(id);
        if (!faq) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }
        faq.isActive = !faq.isActive;
        await faq.save();
        return res.status(200).json({
            success: true,
            message: `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully`,
            data: faq
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

