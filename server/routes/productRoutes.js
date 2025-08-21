// server/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { logAction } = require('../middleware/auditMiddleware');
const multer = require('multer');
const { createProduct, getAllProducts, updateProduct, deleteProduct , exportProducts, importProductsCSV} = require('../controllers/productController');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const upload = multer({ storage: multer.memoryStorage() });


router.get('/export', protect, checkPermission('product:read'),logAction('Product'), exportProducts);
router.post('/import', protect, checkPermission('product:import'), upload.single('productsCsv'),logAction('Product'), importProductsCSV);
router.route('/')
    .post(protect, logAction('Product'), checkPermission('product:create'), createProduct)
    .get(protect,logAction('Product'), checkPermission('product:read'), getAllProducts);

router.route('/:id')
    .put(protect, logAction('Product'), checkPermission('product:update'), updateProduct)
    .delete(protect,logAction('Product'), checkPermission('product:delete'), deleteProduct);

module.exports = router;