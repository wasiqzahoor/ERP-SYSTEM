// src/components/ProductModal.jsx

import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify'; 
const ProductModal = ({ product, onClose, onSave }) => {
    const isEditMode = Boolean(product);

    // Form ke data ke liye state
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category: '',
        stock: 0,
        price: 0,
    });
    
    // Loading aur error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Yeh useEffect hook tab chalta hai jab component load hota hai ya 'product' prop badalta hai.
    // Iska kaam 'edit' mode mein form ko purane data se bharna hai.
    useEffect(() => {
        if (isEditMode) {
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                description: product.description || '',
                category: product.category || '',
                stock: product.stock || 0,
                price: product.price || 0,
            });
        }
        // Agar 'add' mode mein hain to form khali rahega, jo ke useState ki default value hai.
    }, [product, isEditMode]);

    // Yeh function har input field mein type karne par state ko update karta hai.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    // Form submit hone par yeh function chalta hai.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let response;
            if (isEditMode) {
                // Edit Mode: Backend ko PUT request bhej kar product update karein.
                response = await api.put(`/api/products/${product._id}`, formData);
            } else {
                // Add Mode: Backend ko POST request bhej kar naya product banayein.
                response = await api.post('/api/products', formData);
            }
            // Kamyabi par, 'onSave' function call karein taake InventoryPage ka UI update ho.
            onSave(response.data);
            // Modal ko band kar dein.
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save product.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Modal ka background
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            {/* Modal ka main container */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                {/* Modal ka title, jo 'edit' ya 'add' ke hisab se badalta hai */}
                <h2 className="text-2xl font-bold mb-4">
                    {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h2>
                
                {/* Product Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required className="p-2 border rounded-md"/>
                        <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="SKU" required className="p-2 border rounded-md"/>
                    </div>
                    
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="mt-4 w-full p-2 border rounded-md"></textarea>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category" required className="p-2 border rounded-md"/>
                        <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" required className="p-2 border rounded-md"/>
                        <input type="number" name="price" step="0.01" value={formData.price} onChange={handleChange} placeholder="Price" required className="p-2 border rounded-md"/>
                    </div>
                    
                    {/* Error message yahan show hoga */}
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    
                    {/* Form ke action buttons */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;