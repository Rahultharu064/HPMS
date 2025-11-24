import React, { useState, useEffect, useMemo } from 'react';
import { serviceOrderService } from '../../../services/serviceOrderService';
import extraServiceService from '../../../services/extraServiceService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NonResidentialService = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('list'); // list, create
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);

    // Selection state
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');

    // Create form state
    const [formData, setFormData] = useState({
        guest: {
            firstName: '',
            lastName: '',
            email: '',
            phone: ''
        },
        items: [] // { extraServiceId, quantity, price, name, image }
    });

    useEffect(() => {
        loadServices();
        loadOrders();
    }, []);

    const loadServices = async () => {
        try {
            const res = await extraServiceService.getExtraServices();
            setServices(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error('Failed to load services', error);
        }
    };

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await serviceOrderService.getAll();
            setOrders(res.data || []);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // Derive unique categories from services
    const categories = useMemo(() => {
        const unique = new Set();
        const cats = [];
        services.forEach(s => {
            const catName = s.category?.name || 'Uncategorized';
            if (!unique.has(catName)) {
                unique.add(catName);
                cats.push({ id: s.categoryId, name: catName });
            }
        });
        return cats;
    }, [services]);

    // Filter services based on selected category
    const filteredServices = useMemo(() => {
        if (!selectedCategory) return [];
        return services.filter(s => (s.category?.name || 'Uncategorized') === selectedCategory);
    }, [services, selectedCategory]);

    const handleAddSelectedService = () => {
        if (!selectedServiceId) return;

        const service = services.find(s => s.id === Number(selectedServiceId));
        if (!service) return;

        setFormData(prev => {
            const existing = prev.items.find(i => i.extraServiceId === service.id);
            if (existing) {
                return {
                    ...prev,
                    items: prev.items.map(i => i.extraServiceId === service.id ? { ...i, quantity: i.quantity + 1 } : i)
                };
            }
            return {
                ...prev,
                items: [...prev.items, {
                    extraServiceId: service.id,
                    quantity: 1,
                    price: service.price,
                    name: service.name,
                    image: service.image
                }]
            };
        });

        // Reset selection
        setSelectedServiceId('');
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleQuantityChange = (index, delta) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i === index) {
                    const newQ = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQ };
                }
                return item;
            })
        }));
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            toast.error('Please add at least one service');
            return;
        }

        try {
            const payload = {
                guest: formData.guest,
                items: formData.items.map(i => ({
                    extraServiceId: i.extraServiceId,
                    quantity: i.quantity
                }))
            };

            await serviceOrderService.create(payload);
            toast.success('Service order created successfully');
            setActiveTab('list');
            loadOrders();
            setFormData({
                guest: { firstName: '', lastName: '', email: '', phone: '' },
                items: []
            });
            setSelectedCategory('');
            setSelectedServiceId('');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create order');
        }
    };

    const API_BASE_URL = 'http://localhost:5000'; // Or import from config

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Non-Residential Services</h2>
                    <p className="text-gray-500">Manage services for walk-in guests</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                    >
                        Orders List
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                    >
                        New Service Order
                    </button>
                </div>
            </div>

            {activeTab === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Guest Details & Service Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">Guest Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.guest.firstName}
                                        onChange={e => setFormData(s => ({ ...s, guest: { ...s.guest, firstName: e.target.value } }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.guest.lastName}
                                        onChange={e => setFormData(s => ({ ...s, guest: { ...s.guest, lastName: e.target.value } }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.guest.email}
                                        onChange={e => setFormData(s => ({ ...s, guest: { ...s.guest, email: e.target.value } }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.guest.phone}
                                        onChange={e => setFormData(s => ({ ...s, guest: { ...s.guest, phone: e.target.value } }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">Add Service</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedCategory}
                                        onChange={e => {
                                            setSelectedCategory(e.target.value);
                                            setSelectedServiceId('');
                                        }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedServiceId}
                                        onChange={e => setSelectedServiceId(e.target.value)}
                                        disabled={!selectedCategory}
                                    >
                                        <option value="">Select Service</option>
                                        {filteredServices.map(service => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} - ₹{service.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <button
                                        onClick={handleAddSelectedService}
                                        disabled={!selectedServiceId}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Add to Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-6">
                            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

                            {formData.items.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-xl">
                                    No items added
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.items.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            {item.image ? (
                                                <img
                                                    src={`${API_BASE_URL}${item.image}`}
                                                    alt={item.name}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                                    <span className="text-xs">No Img</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{item.name}</div>
                                                <div className="text-sm text-gray-500">₹{item.price} x {item.quantity}</div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button onClick={() => handleQuantityChange(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-white border rounded hover:bg-gray-100">-</button>
                                                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => handleQuantityChange(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-white border rounded hover:bg-gray-100">+</button>
                                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-500 ml-auto text-sm">Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span>Total</span>
                                            <span>₹{calculateTotal()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Create Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium text-gray-600">Order ID</th>
                                <th className="p-4 font-medium text-gray-600">Guest</th>
                                <th className="p-4 font-medium text-gray-600">Items</th>
                                <th className="p-4 font-medium text-gray-600">Total</th>
                                <th className="p-4 font-medium text-gray-600">Status</th>
                                <th className="p-4 font-medium text-gray-600">Date</th>
                                <th className="p-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No orders found</td></tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">#{order.id}</td>
                                        <td className="p-4">
                                            <div className="font-medium">{order.guest?.firstName} {order.guest?.lastName}</div>
                                            <div className="text-xs text-gray-500">{order.guest?.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-600">
                                                {order.items?.map(i => i.extraService?.name).join(', ')}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium">₹{order.totalAmount}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <button className="text-blue-600 hover:underline text-sm">View</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default NonResidentialService;
