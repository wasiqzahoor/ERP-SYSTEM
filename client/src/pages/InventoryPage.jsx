// src/pages/InventoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
    FiPlus, FiEdit, FiTrash2, FiDownload, FiSearch, FiUpload, 
    FiChevronLeft, FiChevronRight, FiBox, FiAlertTriangle,
    FiMenu, FiX
} from 'react-icons/fi';
import ProductModal from '../components/ProductModal';
import { toast } from 'react-toastify';

// --- CONFIRMATION MODAL COMPONENT ---
const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", confirmColor = "indigo" }) => {
    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        indigo: 'bg-indigo-600 hover:bg-indigo-700',
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-6 text-center">
                    <FiAlertTriangle className={`mx-auto mb-4 w-12 h-12 ${confirmColor === 'red' ? 'text-red-400' : 'text-indigo-400'}`} />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500">{message}</p>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-center space-x-4">
                    <button type="button" onClick={onCancel} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm">{cancelText}</button>
                    <button type="button" onClick={onConfirm} className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:w-auto sm:text-sm ${colorClasses[confirmColor]}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, icon, color }) => (
    <div className={`p-4 bg-white rounded-xl shadow-md flex items-center gap-4 border-l-4 ${color}`}>
        <div className="text-3xl p-3 bg-gray-100 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// --- MOBILE PRODUCT CARD COMPONENT ---
const MobileProductCard = ({ product, onEdit, onDelete, hasUpdatePermission, hasDeletePermission }) => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.sku}</p>
                <p className="text-sm text-gray-600 mt-1">{product.category}</p>
            </div>
            {(hasUpdatePermission || hasDeletePermission) && (
                <div className="flex gap-2">
                    {hasUpdatePermission && (
                        <button onClick={() => onEdit(product)} className="text-blue-500 p-1">
                            <FiEdit size={18} />
                        </button>
                    )}
                    {hasDeletePermission && (
                        <button onClick={() => onDelete(product)} className="text-red-500 p-1">
                            <FiTrash2 size={18} />
                        </button>
                    )}
                </div>
            )}
        </div>
        
        <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > product.lowStockThreshold ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Stock: {product.stock}
                </span>
                {product.stock <= product.lowStockThreshold && (
                    <FiAlertTriangle className="ml-2 text-red-500" size={16} />
                )}
            </div>
            <span className="font-semibold">${product.price?.toFixed(2)}</span>
        </div>
    </div>
);

// --- MAIN INVENTORY PAGE COMPONENT ---
const InventoryPage = () => {
    const [products, setProducts] = useState([]);
    const { hasPermission } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);
    
    // State for mobile filter visibility
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    
    // Nayi states import/export buttons ke liye
    const [exporting, setExporting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [stats, setStats] = useState({ totalProducts: 0, lowStockCount: 0 });
    const limit = 10;

    const fetchProducts = async (pageToFetch, currentSearchTerm) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/api/products?page=${pageToFetch}&limit=${limit}&search=${currentSearchTerm}`);
            setProducts(res.data.products);
            setCurrentPage(res.data.currentPage);
            setTotalPages(res.data.totalPages);
            setTotalProducts(res.data.totalProducts);
            setStats(res.data.stats);
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast.error('Failed to load products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts(currentPage, searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm]);
    
    // --- IMPORT/EXPORT FUNCTIONS ---

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleImport(file);
        }
    };

    const handleImport = async (file) => {
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('productsCsv', file);
        try {
            const res = await api.post('/api/products/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(res.data.message); 
            if (currentPage === 1) {
                fetchProducts(1, searchTerm);
            } else {
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Failed to import products', error);
            const errorMessage = error.response?.data?.message || 'Failed to import products';
            toast.error(errorMessage);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const handleExport = async () => {
        setExporting(true);
        setError('');
        try {
            const response = await api.get('/api/products/export', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export products', error);
            toast.error('Could not export products.');
        } finally {
            setExporting(false);
        }
    };
    
    // --- Helper Functions ---
    
    const handleSaveProduct = () => {
        fetchProducts(currentPage, searchTerm);
        toast.success('Product saved successfully!');
    };

    const handleOpenAddModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        try {
            await api.delete(`/api/products/${productToDelete._id}`);
            fetchProducts(currentPage, searchTerm);
            toast.success(`Product "${productToDelete.name}" deleted successfully.`);
        } catch (error) {
            toast.error('Failed to delete product.');
        }
        setDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const openDeleteConfirmation = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    return (
        <div className="bg-gray-100 min-h-screen pt-10 pb-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Inventory Management</h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Track and manage your products.</p>
                    </div>
                    <div className="flex flex-row xs:flex-row gap-3">
                        {hasPermission('product:import') && (
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={uploading}
                                className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm sm:text-base"
                            >
                                {uploading ? 'Importing...' : <><FiUpload className="text-sm sm:text-base" /> Import CSV</>}
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />

                        {hasPermission('product:read') && (
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm sm:text-base"
                            >
                                {exporting ? 'Exporting...' : <><FiDownload className="text-sm sm:text-base" /> Export CSV</>}
                            </button>
                        )}
                        {hasPermission('product:create') && (
                            <button
                                onClick={handleOpenAddModal}
                                className="bg-indigo-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                            >
                                <FiPlus className="text-sm sm:text-base" /> Add Product
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <StatCard 
                        title="Total Products" 
                        value={stats.totalProducts} 
                        icon={<FiBox />}
                        color="border-blue-500"
                    />
                    <StatCard 
                        title="Low Stock Items" 
                        value={stats.lowStockCount} 
                        icon={<FiAlertTriangle />}
                        color={stats.lowStockCount > 0 ? "border-red-500" : "border-green-500"}
                    />
                </div>

                {/* Search and Filters */}
                <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, SKU, or category..."
                                className="w-full p-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            className="md:hidden bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center justify-center gap-2"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                            {showMobileFilters ? <FiX /> : <FiMenu />}
                            Filters
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                {/* Products Table - Hidden on mobile */}
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto hidden md:block">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Product Name</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">SKU</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Category</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Price</th>
                                <th className="p-4 text-center text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-6">Loading...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-6 text-gray-500">No products found.</td></tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="p-4">{product.name}</td>
                                        <td className="p-4">{product.sku}</td>
                                        <td className="p-4">{product.category}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > product.lowStockThreshold ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {product.stock}
                                                </span>
                                                {product.stock <= product.lowStockThreshold && (
                                                    <FiAlertTriangle className="text-red-500" title="Stock is at or below the threshold!" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">${product.price?.toFixed(2)}</td>
                                        <td className="p-4 flex justify-center gap-3">
                                            {hasPermission('product:update') && <button onClick={() => handleOpenEditModal(product)} className="text-blue-500 hover:text-blue-700"><FiEdit size={18} /></button>}
                                            {hasPermission('product:delete') && <button onClick={() => openDeleteConfirmation(product)} className="text-red-500 hover:text-red-700"><FiTrash2 size={18} /></button>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Product List - Visible only on mobile */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="text-center p-6">Loading...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center p-6 text-gray-500">No products found.</div>
                    ) : (
                        products.map(product => (
                            <MobileProductCard 
                                key={product._id}
                                product={product}
                                onEdit={handleOpenEditModal}
                                onDelete={openDeleteConfirmation}
                                hasUpdatePermission={hasPermission('product:update')}
                                hasDeletePermission={hasPermission('product:delete')}
                            />
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-6 flex flex-col xs:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-gray-700">
                        Showing <span className="font-semibold">{Math.min(1 + (currentPage - 1) * limit, totalProducts)}</span> to <span className="font-semibold">{Math.min(currentPage * limit, totalProducts)}</span> of <span className="font-semibold">{totalProducts}</span> results
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1 || loading} 
                            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                            <FiChevronLeft />
                        </button>
                        <span className="font-semibold text-sm">Page {currentPage} of {totalPages}</span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            disabled={currentPage === totalPages || loading} 
                            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveProduct}
                />
            )}
            {isDeleteModalOpen && (
                <ConfirmationModal
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteModalOpen(false)}
                    confirmText="Delete"
                    confirmColor="red"
                />
            )}
        </div>
    );
};

export default InventoryPage;