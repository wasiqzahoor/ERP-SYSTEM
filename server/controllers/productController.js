const Product = require('../models/productModel');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const stream = require('stream');

exports.createProduct = async (req, res) => {
    const { name, sku, description, category, stock, price } = req.body;
    try {
        const product = await Product.create({
            name, sku, description, category, stock, price,
            createdBy: req.user._id,
            tenant: req.tenant._id // This is correct
        });
        res.status(201).json(product);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A product with this SKU already exists in your company.' });
        }
        res.status(400).json({ message: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        // --- YEH NAYI LOGIC HAI ---
        // Check karein ke kahin frontend se saare products to nahi maange gaye
        if (req.query.all === 'true') {
            const allProducts = await Product.find({ tenant: req.tenant._id }).sort({ name: 1 });
            return res.status(200).json(allProducts); // Sirf simple array bhejein
        }

        // --- PURANI PAGINATION WALI LOGIC ---
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchTerm = req.query.search || '';

        let query = { tenant: req.tenant._id };
        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { sku: { $regex: searchTerm, $options: 'i' } },
                { category: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const [products, totalProducts, lowStockCount] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip),
            Product.countDocuments(query),
            Product.countDocuments({
                tenant: req.tenant._id,
                $expr: { $lte: ['$stock', '$lowStockThreshold'] } 
            })
        ]);
        
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages,
            totalProducts,
            stats: {
                totalProducts: await Product.countDocuments({ tenant: req.tenant._id }),
                lowStockCount
            }
        });

    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.status(500).json({ message: 'Server error fetching products.' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        // --- THIS IS THE FIX ---
        // Use findOneAndUpdate to check both the ID and the tenantId
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, tenant: req.tenant._id }, // Condition: Must match ID AND tenant
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found in your company.' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        // --- THIS IS THE FIX ---
        // First, find the product ensuring it belongs to the correct tenant
        const product = await Product.findOne({ _id: req.params.id, tenant: req.tenant._id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found in your company.' });
        }
        
        // If found, then delete it
        await product.deleteOne();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.exportProducts = async (req, res) => {
    try {
        const products = await Product.find({ tenant: req.tenant._id }) // This is correct
            .populate('createdBy', 'username')
            .lean();
        
        if (products.length === 0) {
            return res.status(200).send('No products to export.');
        }
        
        const fields = ['name', 'sku', 'description', 'category', 'stock', 'price', 'createdBy.username'];
        const parser = new Parser({ fields });
        const csv = parser.parse(products);

        res.header('Content-Type', 'text/csv');
        res.attachment('products.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: 'Server error while exporting products.' });
    }
};

exports.importProductsCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() })) // headers ko lowercase kar lein
        .on('data', (row) => results.push(row))
        .on('end', async () => {
            const operations = results.map(row => {
                // Har row ko Product model ke hisab se format karein
                return {
                    updateOne: {
                        filter: { sku: row.sku, tenant: req.tenant._id }, // SKU ko unique key ke tor par istemal karein
                        update: {
                            $set: {
                                name: row.name,
                                sku: row.sku,
                                category: row.category,
                                description: row.description || '',
                                price: parseFloat(row.price) || 0,
                                stock: parseInt(row.stock, 10) || 0,
                                createdBy: req.user._id,
                                tenant: req.tenant._id
                            }
                        },
                        upsert: true // Agar SKU mojood nahi to naya product banayein, warna update karein
                    }
                };
            });

            try {
                if (operations.length > 0) {
                    await Product.bulkWrite(operations);
                }
                res.status(200).json({ message: `${operations.length} products have been successfully imported/updated.` });
            } catch (error) {
                res.status(500).json({ message: 'Error processing CSV.', error: error.message });
            }
        });
};