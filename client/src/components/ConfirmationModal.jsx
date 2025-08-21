// src/components/ConfirmationModal.jsx

import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", confirmColor = "indigo" }) => {

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        indigo: 'bg-indigo-600 hover:bg-indigo-700',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white bg-opacity-80 rounded-lg shadow-xl w-15 max-w-sm overflow-hidden">
                <div className="p-3 text-center rounded-t-lg">
                    <FiAlertTriangle className={`mx-auto mb-4 w-8 h-12 text-${confirmColor}-400`} />
                    <h3 className="text-sm font-bold text-gray-800 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 w-12">{message}</p>
                </div>
                <div className="bg-gray-50 bg-opacity-80 px-4 py-3 sm:px-6 flex justify-center space-x-4 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:w-auto sm:text-sm ${colorClasses[confirmColor]}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;