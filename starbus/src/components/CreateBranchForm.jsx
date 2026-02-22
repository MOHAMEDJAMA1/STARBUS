import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin } from 'lucide-react';

export default function CreateBranchForm({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', location: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await supabase.from('branches').insert([formData]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Branch created successfully!' });
            setFormData({ name: '', location: '' });
            if (onSuccess) onSuccess();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                <MapPin size={20} />
                Add New Branch
            </h3>

            {message.text && (
                <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    backgroundColor: message.type === 'error' ? '#FEE2E2' : '#D1FAE5',
                    color: message.type === 'error' ? 'var(--color-error)' : 'var(--color-success)'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Mogadishu Main"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location / City</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Bakara Market"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors"
                    style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Creating...' : 'Create Branch'}
                </button>
            </form>
        </div>
    );
}
