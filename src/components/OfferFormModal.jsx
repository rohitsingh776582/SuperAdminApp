import React, { useState, useEffect } from 'react';
import { Ticket, X, AlertCircle } from 'lucide-react';

const OfferFormModal = ({
  isOpen,
  onClose,
  onSave,
  editingOffer,
  formLoading,
  formError,
  setFormError
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Sync state with editingOffer when editingOffer changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingOffer) {
        setCode(editingOffer.code || '');
        setTitle(editingOffer.title || '');
        setDescription(editingOffer.description || '');
        setDiscountType(editingOffer.discount_type || 'percentage');
        setDiscountValue(editingOffer.discount_value ? editingOffer.discount_value.toString() : '');
        setMinOrderAmount(editingOffer.min_order_amount ? editingOffer.min_order_amount.toString() : '0');
        setMaxDiscountAmount(editingOffer.max_discount_amount ? editingOffer.max_discount_amount.toString() : '');
        setStartDate(editingOffer.start_date ? editingOffer.start_date.substring(0, 16) : '');
        setEndDate(editingOffer.end_date ? editingOffer.end_date.substring(0, 16) : '');
        setIsActive(editingOffer.is_active !== false);
      } else {
        setCode('');
        setTitle('');
        setDescription('');
        setDiscountType('percentage');
        setDiscountValue('');
        setMinOrderAmount('0');
        setMaxDiscountAmount('');

        // Set default start date to now (local datetime-local format: YYYY-MM-DDTHH:mm)
        const now = new Date();
        const tzoffset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
        setStartDate(localISOTime);

        // Set default end date to 1 month from now
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const localNextMonthTime = (new Date(nextMonth - tzoffset)).toISOString().slice(0, 16);
        setEndDate(localNextMonthTime);

        setIsActive(true);
      }
    }
  }, [isOpen, editingOffer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !discountValue || !endDate) {
      setFormError('Please fill in all required fields (*).');
      return;
    }

    const valueNum = parseFloat(discountValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setFormError('Discount value must be a positive number.');
      return;
    }

    if (discountType === 'percentage' && valueNum > 100) {
      setFormError('Percentage discount value cannot exceed 100%.');
      return;
    }

    onSave({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: valueNum,
      min_order_amount: parseFloat(minOrderAmount || 0),
      max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      end_date: new Date(endDate).toISOString(),
      is_active: isActive
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Ticket size={18} className="text-blue-500" />
            <span>{editingOffer ? 'Update Promo Coupon' : 'Create Promo Coupon'}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 custom-scrollbar">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Coupon Code */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Coupon Code *</label>
            <input
              type="text"
              placeholder="e.g. WELCOME50, SUPER100, DIWALI20"
              className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none uppercase font-mono tracking-wider font-bold"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\s/g, ''));
                setFormError(null);
              }}
              disabled={!!editingOffer}
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Coupon Title *</label>
            <input
              type="text"
              placeholder="e.g. Save 20% on your first order"
              className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFormError(null);
              }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea
              rows="2"
              placeholder="e.g. Use code WELCOME50 on checkout. Valid for transactions above ₹250."
              className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Setup row placeholder */}

          {/* Discount Setup */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount Type *</label>
              <select
                className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-bold"
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value);
                  setFormError(null);
                }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount Value *</label>
              <input
                type="number"
                min="0.1"
                step="any"
                placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 50'}
                className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-bold"
                value={discountValue}
                onChange={(e) => {
                  setDiscountValue(e.target.value);
                  setFormError(null);
                }}
                required
              />
            </div>
          </div>

          {/* Order amounts and limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min. Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Max. Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Unlimited"
                disabled={discountType === 'flat'}
                className={`w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none ${
                  discountType === 'flat' && 'opacity-50 bg-slate-100/50'
                }`}
                value={discountType === 'flat' ? '' : maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Validity Date</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Expiration Date *</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setFormError(null);
                }}
                required
              />
            </div>
          </div>

          {/* Active Toggle Switch */}
          <div className="flex items-center justify-between border-t border-slate-150 pt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Coupon Status (Active)</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                isActive ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-bold transition-all disabled:opacity-50"
            >
              {formLoading && <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>}
              <span>{editingOffer ? 'Save Changes' : 'Create Coupon'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-150 hover:bg-slate-250 text-slate-700 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferFormModal;
