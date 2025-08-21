const Customer = require('../models/customerModel');
const Order = require('../models/orderModel');
exports.createCustomer = async (req, res) => {
    const { name, email, phone, address } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Customer name is required.' });
    }

    try {
        const customer = await Customer.create({
            name,
            email,
            phone,
            address,
            tenant: req.tenant._id,
            createdBy: req.user._id,
        });
        res.status(201).json(customer);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A customer with this email already exists.' });
        }
        res.status(500).json({ message: 'Server error creating customer.' });
    }
};


exports.getAllCustomers = async (req, res) => {
    try {
        // --- NAYI LOGIC: Check for 'all=true' query parameter ---
        if (req.query.all === 'true') {
            const allCustomers = await Customer.find({ tenant: req.tenant._id }).sort({ name: 1 });
            return res.status(200).json(allCustomers); // Return simple array and stop
        }

        // --- PURANI PAGINATION WALI LOGIC ---
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const searchTerm = req.query.search || '';

        let query = { tenant: req.tenant._id };
        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const [
            customers, totalCustomers, newCustomersThisMonth, revenueData
        ] = await Promise.all([
            Customer.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip),
            Customer.countDocuments(query),
            Customer.countDocuments({
                tenant: req.tenant._id,
                createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }),
            Order.aggregate([
                { $match: { tenant: req.tenant._id, status: { $in: ['Paid', 'Shipped'] } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);
        
        const totalPages = Math.ceil(totalCustomers / limit);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        res.status(200).json({
            customers,
            currentPage: page,
            totalPages,
            totalCustomers,
            stats: {
                totalCustomers: await Customer.countDocuments({ tenant: req.tenant._id }),
                newCustomersThisMonth,
                totalRevenue
            }
        });

    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ message: 'Server error fetching customers.' });
    }
};



exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        // Security check: User can only update customers in their own tenant
        if(customer.tenant.toString() !== req.tenant._id.toString()){
            return res.status(403).json({ message: 'Forbidden' });
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        // Security check
        if(customer.tenant.toString() !== req.tenant._id.toString()){
            return res.status(403).json({ message: 'Forbidden' });
        }
        await customer.deleteOne();
        res.status(200).json({ message: 'Customer deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting customer.' });
    }
};