import React from 'react';
import { Save, FilePlus } from 'lucide-react';

export default function SaveDialog({ onSaveExisting, onSaveNew, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Save Billing</h2>
                <p className="text-gray-600 mb-6">
                    You are editing an existing billing. How would you like to save your changes?
                </p>

                <div className="space-y-3">
                    <button
                        onClick={onSaveExisting}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg font-medium"
                    >
                        <Save size={20} />
                        Save as Existing File
                    </button>

                    <button
                        onClick={onSaveNew}
                        className="w-full flex items-center justify-center gap-3 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg font-medium"
                    >
                        <FilePlus size={20} />
                        Save as New File
                    </button>

                    <button
                        onClick={onCancel}
                        className="w-full flex items-center justify-center gap-3 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
