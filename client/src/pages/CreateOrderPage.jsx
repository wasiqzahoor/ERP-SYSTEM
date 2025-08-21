// src/pages/CreateOrderPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
    return (
        <select value={value} onChange={onChange} className="w-full p-2 border rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
            <option value="">{placeholder}</option>
            {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    );
};

const CreateOrderPage = () => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1 }]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [customersRes, productsRes] = await Promise.all([
                    // --- YAHAN PAR CHANGE HAI ---
                    api.get('/api/customers?all=true'), // Request ALL customers
                    api.get('/api/products?all=true')
                ]);

                // customersRes.data will now be a simple array, so .map() will work
                setCustomers(customersRes.data);
                setProducts(productsRes.data);
                
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast.error("Could not load customers or products. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;
        setOrderItems(newItems);
    };

    const addItem = () => {
        setOrderItems([...orderItems, { productId: '', quantity: 1 }]);
    };

    const removeItem = (index) => {
        if (orderItems.length > 1) {
            const newItems = [...orderItems];
            newItems.splice(index, 1);
            setOrderItems(newItems);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomer || orderItems.some(item => !item.productId || item.quantity < 1)) {
            toast.warn("Please select a customer and a product for all items, and ensure quantity is at least 1.");
            return;
        }
        setLoading(true);
        try {
            await api.post('/api/sales/orders', {
                customerId: selectedCustomer,
                items: orderItems,
            });
            toast.success("Order created successfully!");
            navigate('/sales');
        } catch (error) {
            console.error("Failed to create order", error);
            const errorMessage = error.response?.data?.message || 'Failed to create order. Please check your inputs.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-8 bg-gray-100 min-h-screen font-sans antialiased">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Order</h1>
                
                {loading && <div className="text-center text-indigo-600 mb-4"><p>Loading customers and products...</p></div>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block font-semibold mb-2 text-gray-700">1. Select Customer</label>
                        <SearchableSelect
                            placeholder="Select a customer..."
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                            options={customers.map(c => ({ value: c._id, label: c.name }))}
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-2 text-gray-700">2. Add Products</label>
                        <div className="space-y-4">
                            {orderItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50 shadow-sm">
                                    <div className="flex-grow">
                                        <SearchableSelect
                                            placeholder="Select a product..."
                                            value={item.productId}
                                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                            options={products.map(p => ({ value: p._id, label: `${p.name} (Stock: ${p.stock})` }))}
                                        />
                                    </div>
                                    <input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))} className="w-20 p-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors" disabled={orderItems.length <= 1} aria-label="Remove product"><FiTrash2 size={20} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="button" onClick={addItem} className="text-indigo-600 font-semibold flex items-center gap-2 hover:text-indigo-800 transition-colors"><FiPlus size={20} /> Add another product</button>
                    <div className="text-right border-t pt-6">
                        <button type="submit" disabled={loading || !selectedCustomer || orderItems.some(item => !item.productId || item.quantity < 1)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors">{loading ? 'Creating Order...' : 'Create Order'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOrderPage;