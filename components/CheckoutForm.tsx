'use client';
import { useState, useEffect } from 'react';
import { initiateRazorpayPayment, createRazorpayOrder, verifyRazorpayPayment } from '@/lib/razorpay';
import { useAuth } from '@/contexts/AuthContext';
import { CartItem } from '@/contexts/CartContext';
interface CheckoutFormProps {
  total: number;
  subtotal: number;
  shipping: number;
  onShippingChange: (shipping: number) => void;
  items: CartItem[];
  onOrderSuccess: (orderId: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}
export default function CheckoutForm({
  total,
  subtotal,
  shipping,
  onShippingChange,
  items,
  onOrderSuccess,
  isProcessing,
  setIsProcessing,
}: CheckoutFormProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [shippingCharge, setShippingCharge] = useState(shipping);
  const [standardShippingCharge, setStandardShippingCharge] =
    useState(shipping);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'air'>(
    'standard'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
  const pincode = formData.pincode.trim();
  if (!/^\d{6}$/.test(pincode)) {
    setShippingCharge(shipping);
    onShippingChange(shipping);
    setLocationError('');
    return;
  }
  const checkPincode = async () => {
    try {
      setLocationLoading(true);
      setLocationError('');
      const response = await fetch(
        `/api/shipping?pincode=${encodeURIComponent(pincode)}&subtotal=${subtotal}&items=${encodeURIComponent(JSON.stringify(items.map((item) => ({ productId: item.productId, quantity: item.quantity }))))}`
      );
      if (!response.ok) {
        throw new Error('Unable to calculate shipping');
      }
      const data = await response.json();
      const state = data.state || '';
      const city = data.city || '';
      const standardShipping = Number(data.shipping);
      setFormData((prev) => ({
        ...prev,
        state,
        city,
      }));
      setStandardShippingCharge(standardShipping);
      setShippingCharge(standardShipping);
      if (deliveryMethod === 'standard') {
        onShippingChange(standardShipping);
      }
    } catch (error) {
      console.error('Shipping calculation failed:', error);
      setLocationError('Unable to calculate shipping. Please check the PIN code and try again.');
    } finally {
      setLocationLoading(false);
    }
  };
  checkPincode();
}, [formData.pincode, subtotal, shipping, items, deliveryMethod, onShippingChange]);
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Invalid email address. Please enter a valid email (e.g., name\@example.com)';
      }
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number (10 digits required)';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Invalid pincode (6 digits required)';
    }
    // Always set errors, even if empty, to ensure state updates
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    // Debug: log errors for email field
    if (newErrors.email) {
      console.log('Email validation error:', newErrors.email, 'Email value:', formData.email);
    }
    // Scroll to first error field after state update
    if (!isValid) {
      setTimeout(() => {
        const firstErrorKey = Object.keys(newErrors)[0];
        if (firstErrorKey) {
          const errorElement = document.getElementById(firstErrorKey);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
          }
        }
      }, 100);
    }
    return isValid;
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing (only if error exists)
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: value }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      // Force re-render to show errors
      setErrors((prev) => ({ ...prev }));
      return;
    }
    setIsProcessing(true);
    try {
      // The server prices the cart and writes the order, for guests as well
      // as signed-in customers, before any payment is attempted.
      const placeResponse = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentMethod: 'razorpay',
          deliveryMethod,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
          })),
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
        }),
      });
      const placed = await placeResponse.json().catch(() => ({}));
      if (!placeResponse.ok || !placed.orderId) {
        throw new Error(placed.error || 'Could not place the order');
      }
      const orderId: string = placed.orderId;
      try {
          // The server prices the cart and opens the Razorpay order; the
          // amount is never taken from the browser.
         const created = await createRazorpayOrder(
  items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  })),
  orderId,
  formData.pincode,
  deliveryMethod
);
          await initiateRazorpayPayment({
            key: created.keyId,
            amount: created.amount,
            currency: created.currency,
            name: 'Rangrez',
            description: `Order ${orderId}`,
            order_id: created.razorpayOrderId,
            handler: async (response) => {
              try {
                // Only the server can tell a real payment from a forged one.
                await verifyRazorpayPayment(response, orderId);
                onOrderSuccess(orderId);
              } catch (error) {
                console.error('Verification error:', error);
                alert(
                  'We could not confirm your payment. If money was debited, contact us on WhatsApp and we will sort it out.'
                );
                setIsProcessing(false);
              }
            },
            prefill: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              contact: formData.phone,
            },
            theme: {
              color: '#000000',
            },
          });
      } catch (error: any) {
        console.error('Payment error:', error);
        alert(error?.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Order processing error:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.firstName 
                ? 'border-red-500 text-red-700' 
                : 'border-gray-300 text-gray-900'
            }`}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm font-medium text-red-600">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.lastName 
                ? 'border-red-500 text-red-700' 
                : 'border-gray-300 text-gray-900'
            }`}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm font-medium text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.email 
              ? 'border-red-500 text-red-700' 
              : 'border-gray-300 text-gray-900'
          }`}
          placeholder="john@example.com"
        />
        {errors.email ? (
          <p className="mt-1 text-sm font-medium text-red-600" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>
      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.phone 
              ? 'border-red-500 text-red-700' 
              : 'border-gray-300 text-gray-900'
          }`}
          placeholder="9876543210"
          maxLength={10}
        />
        {errors.phone && (
          <p className="mt-1 text-sm font-medium text-red-600">{errors.phone}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">10-digit mobile number</p>
      </div>
      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors.address 
              ? 'border-red-500 text-red-700' 
              : 'border-gray-300 text-gray-900'
          }`}
          placeholder="House/Flat No., Building Name, Street"
        />
        {errors.address && (
          <p className="mt-1 text-sm font-medium text-red-600">{errors.address}</p>
        )}
      </div>
      {/* City, State, Pincode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.city 
                ? 'border-red-500 text-red-700' 
                : 'border-gray-300 text-gray-900'
            }`}
            placeholder="Mumbai"
          />
          {errors.city && (
            <p className="mt-1 text-sm font-medium text-red-600">{errors.city}</p>
          )}
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.state 
                ? 'border-red-500 text-red-700' 
                : 'border-gray-300 text-gray-900'
            }`}
            placeholder="Maharashtra"
          />
          {errors.state && (
            <p className="mt-1 text-sm font-medium text-red-600">{errors.state}</p>
          )}
        </div>
        <div>
          <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.pincode 
                ? 'border-red-500 text-red-700' 
                : 'border-gray-300 text-gray-900'
            }`}
            placeholder="400001"
            maxLength={6}
          />
          {errors.pincode && (
            <p className="mt-1 text-sm font-medium text-red-600">{errors.pincode}</p>
          )}
        </div>
      </div>
      {/* Delivery Method */}
<div className="mb-8">
  <h3 className="text-xl font-bold text-gray-900 mb-4">
    Delivery Method
  </h3>
  <div className="space-y-3">
    <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer">
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name="deliveryMethod"
          value="standard"
          checked={deliveryMethod === 'standard'}
          onChange={() => {
  setDeliveryMethod('standard');
  setShippingCharge(standardShippingCharge);
  onShippingChange(standardShippingCharge);
}}
        />
        <div>
          <p className="font-semibold text-gray-900">
            Standard Delivery
          </p>
          <p className="text-sm text-gray-500">
            Regular delivery
          </p>
        </div>
      </div>
      <span className="font-semibold">
        {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
      </span>
    </label>
    <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer">
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name="deliveryMethod"
          value="air"
          checked={deliveryMethod === 'air'}
        onChange={() => {
  setDeliveryMethod('air');
  setShippingCharge(175);
  onShippingChange(175);
}}
        />
        <div>
          <p className="font-semibold text-gray-900">
            Air / Express Delivery
          </p>
          <p className="text-sm text-gray-500">
            Faster delivery
          </p>
        </div>
      </div>
      <span className="font-semibold">₹175</span>
    </label>
  </div>
</div>
      {/* Payment Method */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>
        <div className="space-y-3">
          <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="razorpay"
              checked
              className="w-4 h-4 text-gray-900 focus:ring-gray-900"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">Online Payment (Razorpay)</span>
              <p className="text-sm text-gray-600">Pay securely with credit/debit card, UPI, or wallet</p>
            </div>
          </label>

        </div>
      </div>
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
          isProcessing
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
        }`}
      >
        {isProcessing
          ? 'Processing...'
          : `Pay ₹${(subtotal + shippingCharge).toLocaleString('en-IN')}`}
      </button>
    </form>
  );
}
