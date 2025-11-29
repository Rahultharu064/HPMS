import React, { useState, useEffect, useMemo } from 'react';
import { serviceOrderService } from '../../../services/serviceOrderService';
import extraServiceService from '../../../services/extraServiceService';
import { paymentService } from '../../../services/paymentService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NonResidentialService = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('list'); // list, create, addToOrder
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);

    // Selection state
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');

    // Add to order state
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [currentOrderItems, setCurrentOrderItems] = useState([]);

    // Payment Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentOrder, setPaymentOrder] = useState(null);
    const [allowDiscount, setAllowDiscount] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const taxPercent = 13; // Fixed GST 13%
    const serviceChargePercent = 10; // Fixed Service Charge 10%

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

    // Payment tracking helpers
    const getTotalPaid = (order) => {
        if (!order.payments || order.payments.length === 0) return 0;
        return order.payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + Number(p.amount), 0);
    };

    const getRemainingBalance = (order) => {
        const totalPaid = getTotalPaid(order);
        const remaining = Number(order.totalAmount) - totalPaid;
        return remaining > 0 ? remaining : 0;
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

    // Payment calculations for modal
    const calculatePaymentSubtotal = (order) => {
        return order?.totalAmount || 0;
    };

    const calculatePaymentDiscount = (order) => {
        if (!allowDiscount) return 0;
        return (calculatePaymentSubtotal(order) * discountPercent) / 100;
    };

    const calculatePaymentServiceCharge = (order) => {
        const subtotal = calculatePaymentSubtotal(order);
        const discount = calculatePaymentDiscount(order);
        return ((subtotal - discount) * serviceChargePercent) / 100;
    };

    const calculatePaymentTax = (order) => {
        const subtotal = calculatePaymentSubtotal(order);
        const discount = calculatePaymentDiscount(order);
        const serviceCharge = calculatePaymentServiceCharge(order);
        const taxableAmount = (subtotal - discount) + serviceCharge;
        return (taxableAmount * taxPercent) / 100;
    };

    const calculatePaymentGrandTotal = (order) => {
        const subtotal = calculatePaymentSubtotal(order);
        const discount = calculatePaymentDiscount(order);
        const serviceCharge = calculatePaymentServiceCharge(order);
        const tax = calculatePaymentTax(order);
        return (subtotal - discount) + serviceCharge + tax;
    };

    const handleViewOrder = (order) => {
        alert(`Order #${order.id}\nGuest: ${order.guest?.firstName} ${order.guest?.lastName}\nTotal: NPR ${order.totalAmount}\nItems: ${order.items?.map(i => i.extraService?.name).join(', ')}`);
    };

    const startAddToOrder = (order) => {
        setSelectedOrderId(order.id);
        setCurrentOrderItems(order.items.map(item => ({
            id: item.id,
            extraServiceId: item.extraServiceId,
            quantity: item.quantity,
            price: item.unitPrice,
            name: item.extraService.name,
            image: item.extraService.image
        })));
        setFormData({ ...formData, items: [] });
        setActiveTab('addToOrder');
    };

    const handleAddMoreToOrder = async () => {
        if (formData.items.length === 0) {
            toast.error('Please add at least one service');
            return;
        }

        try {
            const itemsToAdd = formData.items.map(i => ({
                extraServiceId: i.extraServiceId,
                quantity: i.quantity
            }));

            await serviceOrderService.addItems(selectedOrderId, itemsToAdd);
            toast.success('Items added to order successfully');
            setActiveTab('list');
            loadOrders();
            setFormData({ ...formData, items: [] });
            setSelectedCategory('');
            setSelectedServiceId('');
            setSelectedOrderId(null);
            setCurrentOrderItems([]);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add items');
        }
    };

    const openPaymentModal = (order) => {
        setPaymentOrder(order);
        setAllowDiscount(false);
        setDiscountPercent(0);
        setPaymentMethod('cash');
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        if (!paymentOrder) return;

        try {
            const finalAmount = calculatePaymentGrandTotal(paymentOrder);
            await paymentService.createPayment({
                serviceOrderId: paymentOrder.id,
                method: paymentMethod,
                amount: finalAmount
            });
            toast.success('Payment processed successfully');
            setShowPaymentModal(false);
            setPaymentOrder(null);
            loadOrders();
        } catch (error) {
            toast.error('Payment failed');
        }
    };

    const downloadPDF = async (order) => {
        if (!order) return;

        try {
            const { default: jsPDF } = await import('jspdf');

            // Thermal receipt config
            const width = 80;
            const margin = 5;
            const largeHeight = 2000;

            const formatCurrency = (v) => `NPR ${Number(v || 0).toLocaleString()}`;

            // Column positions
            const colRightX = width - margin;
            const colUnitX = colRightX - 20;
            const colQtyX = colUnitX - 18;
            const colLeftX = margin;

            const renderContent = (doc, yRef) => {
                const addCenter = (text, size = 10, bold = false) => {
                    doc.setFontSize(size);
                    doc.setFont('helvetica', bold ? 'bold' : 'normal');
                    const wrapped = doc.splitTextToSize(String(text || ''), width - margin * 2);
                    wrapped.forEach((line) => {
                        doc.text(line, width / 2, yRef.value, { align: 'center' });
                        yRef.value += size * 0.7;
                    });
                };

                const addLeft = (text, size = 9) => {
                    doc.setFontSize(size);
                    doc.setFont('helvetica', 'normal');
                    const wrapped = doc.splitTextToSize(String(text || ''), width - margin * 2);
                    wrapped.forEach((line) => {
                        doc.text(line, margin, yRef.value);
                        yRef.value += size * 0.6;
                    });
                };

                const addLine = (thickness = 0.2) => {
                    doc.setLineWidth(thickness);
                    doc.line(margin, yRef.value, width - margin, yRef.value);
                    yRef.value += 3;
                };

                // Header
                addCenter('INCHOTEL HOTEL', 12, true);
                addCenter('Itahari, Nepal', 8);
                addCenter('Phone: 025-585701/588202', 8);
                addCenter('Email:itaharinamunacollege@gmaio.com', 8);
                addCenter('Service Order Invoice', 10);
                addCenter(`Order #${order.id}`, 9);
                yRef.value += 2;
                addLine();

                // Guest Details
                addLeft(`Guest: ${order.guest?.firstName || ''} ${order.guest?.lastName || ''}`, 9);
                addLeft(`Email: ${order.guest?.email || 'N/A'}`, 9);
                addLeft(`Phone: ${order.guest?.phone || 'N/A'}`, 9);
                const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
                addLeft(`Date: ${created}`, 9);
                addLeft(`Status: ${order.status || 'N/A'}`, 9);
                yRef.value += 2;
                addLine();

                // Table header
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Service', colLeftX, yRef.value);
                doc.text('Qty', colQtyX, yRef.value, { align: 'right' });
                doc.text('Unit', colUnitX, yRef.value, { align: 'right' });
                doc.text('Total', colRightX, yRef.value, { align: 'right' });
                yRef.value += 4;
                doc.setFont('helvetica', 'normal');

                // Items
                (order.items || []).forEach((item) => {
                    const name = item.extraService?.name || 'Service';
                    const nameWidth = Math.max(colQtyX - colLeftX - 4, 20);
                    const nameLines = doc.splitTextToSize(String(name), nameWidth);

                    nameLines.forEach((ln, idx) => {
                        doc.text(ln, colLeftX, yRef.value);

                        if (idx === 0) {
                            const qtyText = String(item.quantity ?? '');
                            const unitText = formatCurrency(item.unitPrice);
                            const totalText = formatCurrency(item.totalPrice);

                            doc.text(qtyText, colQtyX, yRef.value, { align: 'right' });
                            doc.text(unitText, colUnitX, yRef.value, { align: 'right' });
                            doc.text(totalText, colRightX, yRef.value, { align: 'right' });
                        }

                        yRef.value += 4;
                    });
                });

                yRef.value += 2;
                addLine();

                // Financial breakdown
                const totalPaid = getTotalPaid(order);
                const remaining = getRemainingBalance(order);
                const itemsSubtotal = (order.items || []).reduce((s, it) => s + Number(it.totalPrice || 0), 0);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                // Subtotal
                doc.text('Subtotal:', margin, yRef.value);
                doc.text(formatCurrency(itemsSubtotal), colRightX, yRef.value, { align: 'right' });
                yRef.value += 4;

                // Calculate discount if payment was made
                if (totalPaid > 0 && totalPaid < itemsSubtotal) {
                    const discountAmount = itemsSubtotal - totalPaid;
                    const discountPercent = ((discountAmount / itemsSubtotal) * 100).toFixed(1);
                    doc.text('Discount:', margin, yRef.value);
                    doc.text(`${discountPercent}%`, colRightX, yRef.value, { align: 'right' });
                    yRef.value += 4;
                }

                // Service Charge
                doc.text('Service Charge:', margin, yRef.value);
                doc.text('10%', colRightX, yRef.value, { align: 'right' });
                yRef.value += 4;

                // GST
                doc.text('GST:', margin, yRef.value);
                doc.text('13%', colRightX, yRef.value, { align: 'right' });
                yRef.value += 4;

                addLine();

                // Calculate grand total
                const discountAmount = (totalPaid > 0 && totalPaid < itemsSubtotal) ? (itemsSubtotal - totalPaid) : 0;
                const afterDiscount = itemsSubtotal - discountAmount;
                const serviceCharge = (afterDiscount * 10) / 100;
                const beforeTax = afterDiscount + serviceCharge;
                const gst = (beforeTax * 13) / 100;
                const grandTotal = beforeTax + gst;

                // Grand Total
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Grand Total:', margin, yRef.value);
                doc.text(formatCurrency(grandTotal), colRightX, yRef.value, { align: 'right' });
                yRef.value += 5;

                if (totalPaid > 0) {
                    doc.setFont('helvetica', 'normal');
                    doc.text('Paid:', margin, yRef.value);
                    doc.text(formatCurrency(totalPaid), colRightX, yRef.value, { align: 'right' });
                    yRef.value += 5;
                }

                if (remaining > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Balance Due:', margin, yRef.value);
                    doc.text(formatCurrency(remaining), colRightX, yRef.value, { align: 'right' });
                    yRef.value += 5;
                }

                addLine();

                // Footer
                addCenter('Thank you for your service!', 8);
                addCenter(new Date().toLocaleString(), 7);
                yRef.value += 4;
            };

            // Measure and create final document
            const tempDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [width, largeHeight] });
            const measureY = { value: 10 };
            renderContent(tempDoc, measureY);
            const requiredHeight = Math.ceil(measureY.value + 8);
            const minHeight = 100;
            const finalHeight = Math.max(requiredHeight, minHeight);

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [width, finalHeight] });
            const renderY = { value: 10 };
            renderContent(doc, renderY);

            doc.save(`ServiceOrder_${order.id}.pdf`);
            toast.success('PDF downloaded successfully!');
        } catch (err) {
            console.error('Failed to create PDF', err);
            toast.error('Failed to generate PDF');
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await serviceOrderService.update(orderId, { status: newStatus });
            toast.success('Order status updated');
            loadOrders();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status');
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

            {activeTab === 'addToOrder' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Add More Services to Order #{selectedOrderId}</h3>
                            <p className="text-gray-500">Current items in the order:</p>
                        </div>
                        <button
                            onClick={() => setActiveTab('list')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Back to Orders
                        </button>
                    </div>

                    {/* Current Order Items Display */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <h4 className="text-lg font-semibold mb-4">Current Order Items</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentOrderItems.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
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
                                    <div className="flex-1">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-600">NPR{item.price} x {item.quantity}</div>
                                        <div className="text-sm font-medium text-green-600">Subtotal: NPR{item.price * item.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Service Selection for additional items */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Add More Services</h3>
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
                                                    {service.name} - NPR{service.price}
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

                        {/* Additional Items Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-6">
                                <h3 className="text-lg font-semibold mb-4">Additional Items</h3>

                                {formData.items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-xl">
                                        No additional items added
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
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
                                                    <div className="text-sm text-gray-500">NPR{item.price} x {item.quantity}</div>
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
                                            <div className="text-center text-sm text-gray-600 mb-2">Additional Total</div>
                                            <div className="flex justify-between items-center text-lg font-bold text-blue-600">
                                                <span>+ NPR{calculateTotal()}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAddMoreToOrder}
                                            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>Add to Order</span>
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                        <td className="p-4">
                                            <div className="font-medium">NPR {order.totalAmount?.toLocaleString()}</div>
                                            {getTotalPaid(order) > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    Paid: NPR {getTotalPaid(order).toLocaleString()}
                                                </div>
                                            )}
                                            {getRemainingBalance(order) > 0 && getTotalPaid(order) > 0 && (
                                                <div className="text-xs text-red-600 font-semibold">
                                                    Due: NPR {getRemainingBalance(order).toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            <button
                                                onClick={() => handleViewOrder(order)}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                View
                                            </button>
                                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                                                <>
                                                    <button
                                                        onClick={() => startAddToOrder(order)}
                                                        className="text-green-600 hover:underline text-sm"
                                                    >
                                                        Add More
                                                    </button>
                                                    {getRemainingBalance(order) > 0 && (
                                                        <button
                                                            onClick={() => openPaymentModal(order)}
                                                            className="text-purple-600 hover:underline text-sm"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                onClick={() => downloadPDF(order)}
                                                className="text-orange-600 hover:underline text-sm"
                                            >
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && paymentOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Process Payment</h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Order #{paymentOrder.id}</p>
                            <p className="font-semibold">{paymentOrder.guest?.firstName} {paymentOrder.guest?.lastName}</p>
                        </div>

                        {/* Discount Toggle */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowDiscount}
                                        onChange={(e) => {
                                            setAllowDiscount(e.target.checked);
                                            if (!e.target.checked) setDiscountPercent(0);
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Allow Discount</span>
                                </label>
                            </div>

                            {allowDiscount && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discountPercent}
                                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <div className="text-xs text-gray-500 mt-3">
                                <p>Service Charge: {serviceChargePercent}% (Fixed)</p>
                                <p>GST: {taxPercent}% (Fixed)</p>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Subtotal</span>
                                <span>NPR {calculatePaymentSubtotal(paymentOrder).toLocaleString()}</span>
                            </div>

                            {allowDiscount && discountPercent > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span>Discount ({discountPercent}%)</span>
                                    <span>- NPR {calculatePaymentDiscount(paymentOrder).toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-gray-600">
                                <span>Service Charge ({serviceChargePercent}%)</span>
                                <span>+ NPR {calculatePaymentServiceCharge(paymentOrder).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-600">
                                <span>GST ({taxPercent}%)</span>
                                <span>+ NPR {calculatePaymentTax(paymentOrder).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                                <span>Grand Total</span>
                                <span className="text-blue-600">NPR {calculatePaymentGrandTotal(paymentOrder).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="esewa">eSewa</option>
                                <option value="khalti">Khalti</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                                Process Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NonResidentialService;
