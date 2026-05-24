import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Trash2, ShoppingBag, ArrowRight, Sparkles, CheckCircle2, X, AlertTriangle, MapPin, Phone, User, FileText } from "lucide-react";
import type { AppDispatch, RootState } from "@/stores/store";
import {
  updateCartThunk,
  updateCartLocal,
  removeFromCartThunk,
  removeFromCartLocal,
  clearCartThunk,
  clearCartLocal,
  fetchCartThunk,
  removeCheckedOutItemsLocal,
  removeMultipleFromCartThunk,
  removeMultipleFromCartLocal,
} from "@/stores/cartSlice";
import orderApi from "@/services/orderApi";

const Cart = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { items, totalPrice, loading } = useSelector((state: RootState) => state.cart);

  // Cart item selection state
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  useEffect(() => {
    if (!hasInitializedSelection && items.length > 0) {
      setSelectedKeys(items.map(item => item.field_key || String(item.product_id)));
      setHasInitializedSelection(true);
    }
  }, [items, hasInitializedSelection]);

  // Keep selection valid in case items are deleted
  const allItemKeys = items.map((item) => item.field_key || String(item.product_id));
  const validSelectedKeys = selectedKeys.filter((k) => allItemKeys.includes(k));

  const selectedItems = items.filter((item) =>
    validSelectedKeys.includes(item.field_key || String(item.product_id))
  );

  const selectedTotalPrice = selectedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeys(items.map((item) => item.field_key || String(item.product_id)));
    } else {
      setSelectedKeys([]);
    }
  };

  const handleSelectItem = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedKeys((prev) => [...prev, key]);
    } else {
      setSelectedKeys((prev) => prev.filter((k) => k !== key));
    }
  };

  // Mock coupon state
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Confirmation Popups State (Replacing browser confirm())
  const [confirmPopup, setConfirmPopup] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Checkout modal state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: "",
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Success payment/order state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price));

  const handleQuantityChange = (productId: number, fieldKey: string | undefined, newQty: number, maxStock: number) => {
    const qty = Math.max(0, Math.min(newQty, maxStock));

    if (qty === 0) {
      handleRemoveItem(productId, fieldKey);
      return;
    }

    if (isAuthenticated) {
      dispatch(updateCartThunk({ productId, quantity: qty, fieldKey }));
    } else {
      dispatch(updateCartLocal({ productId, quantity: qty, fieldKey }));
    }
  };

  const handleRemoveItem = (productId: number, fieldKey: string | undefined) => {
    setConfirmPopup({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      onConfirm: () => {
        if (isAuthenticated) {
          dispatch(removeFromCartThunk(fieldKey || productId));
        } else {
          dispatch(removeFromCartLocal({ productId, fieldKey }));
        }
        setConfirmPopup(null);
      },
    });
  };

  const handleClearCart = () => {
    setConfirmPopup({
      isOpen: true,
      message: "Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng?",
      onConfirm: () => {
        if (isAuthenticated) {
          dispatch(clearCartThunk());
        } else {
          dispatch(clearCartLocal());
        }
        setDiscount(0);
        setCouponSuccess("");
        setConfirmPopup(null);
      },
    });
  };

  const handleRemoveMultipleItems = () => {
    if (validSelectedKeys.length === 0) return;
    setConfirmPopup({
      isOpen: true,
      message: `Bạn có chắc chắn muốn xóa ${validSelectedKeys.length} sản phẩm đã chọn khỏi giỏ hàng?`,
      onConfirm: () => {
        if (isAuthenticated) {
          dispatch(removeMultipleFromCartThunk(validSelectedKeys));
        } else {
          dispatch(removeMultipleFromCartLocal(validSelectedKeys));
        }
        setSelectedKeys([]);
        setConfirmPopup(null);
      },
    });
  };

  const handleApplyCoupon = () => {
    setCouponError("");
    setCouponSuccess("");
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError("Vui lòng nhập mã giảm giá");
      return;
    }

    if (code === "UTESHOP") {
      setDiscount(0.2); // 20% Discount
      setCouponSuccess("Áp dụng mã UTESHOP thành công! Giảm ngay 20% tổng giá trị đơn hàng.");
    } else if (code === "FREESHIP") {
      setCouponSuccess("Áp dụng mã miễn phí vận chuyển thành công!");
    } else {
      setCouponError("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    }
  };

  const shippingCost = selectedTotalPrice > 500000 || couponCode.trim().toUpperCase() === "FREESHIP" ? 0 : 30000;
  const discountAmount = selectedTotalPrice * discount;
  const finalTotal = selectedTotalPrice - discountAmount + shippingCost;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setConfirmPopup({
        isOpen: true,
        message: "Bạn cần đăng nhập để thực hiện thanh toán COD. Chuyển hướng đến trang đăng nhập ngay?",
        onConfirm: () => {
          setConfirmPopup(null);
          navigate("/auth/login");
        },
      });
      return;
    }
    if (selectedItems.length === 0) {
      setConfirmPopup({
        isOpen: true,
        message: "Vui lòng chọn ít nhất một sản phẩm trong giỏ hàng để tiến hành thanh toán.",
        onConfirm: () => setConfirmPopup(null),
      });
      return;
    }
    setCheckoutError("");
    setIsCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!checkoutForm.fullName.trim()) {
      setCheckoutError("Vui lòng nhập họ và tên người nhận");
      return;
    }
    if (!checkoutForm.phone.trim()) {
      setCheckoutError("Vui lòng nhập số điện thoại liên hệ");
      return;
    }
    if (!checkoutForm.address.trim()) {
      setCheckoutError("Vui lòng nhập địa chỉ nhận hàng chi tiết");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const response = await orderApi.createOrder({
        fullName: checkoutForm.fullName,
        phone: checkoutForm.phone,
        address: checkoutForm.address,
        note: checkoutForm.note,
        couponCode: couponCode,
        selectedKeys: validSelectedKeys,
      });

      if (response.status === 200 && response.data) {
        setCreatedOrder(response.data);
        setIsCheckoutModalOpen(false);
        setIsSuccessModalOpen(true);
        // Làm sạch các sản phẩm đã đặt trong giỏ hàng sau khi đặt thành công
        if (isAuthenticated) {
          dispatch(fetchCartThunk());
        } else {
          dispatch(removeCheckedOutItemsLocal(validSelectedKeys));
        }
      } else {
        setCheckoutError(response.message || "Đặt hàng không thành công. Vui lòng kiểm tra lại.");
      }
    } catch (err: any) {
      setCheckoutError(err.response?.data?.message || "Lỗi hệ thống khi gửi thông tin thanh toán.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 mt-10 text-center">
        <div className="card-brutal bg-yellow-50 max-w-lg mx-auto flex flex-col items-center p-12">
          <div className="w-20 h-20 bg-primary border-2 border-black flex items-center justify-center shadow-brutal mb-6">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-4 uppercase tracking-wider">
            Giỏ Hàng Trống!
          </h2>
          <p className="text-gray-600 font-bold mb-8 max-w-sm">
            Chưa có sản phẩm nào trong giỏ hàng của bạn. Hãy lấp đầy nó bằng những món đồ thời trang tuyệt vời nhé!
          </p>
          <Link to="/shop" className="btn-brutal inline-flex items-center gap-2 uppercase tracking-widest text-sm py-4 px-8">
            Quay lại cửa hàng <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 mt-10">
      {/* Breadcrumb */}
      <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
        <Link to="/" className="hover:text-black">Trang chủ</Link> / <span className="text-black">Giỏ hàng</span>
      </div>

      <h1 className="font-serif text-4xl font-bold mb-10 uppercase tracking-widest border-b-4 border-black pb-4 inline-block">
        Giỏ Hàng Của Bạn
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        {/* Left Column: Cart Items List */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex justify-center items-center">
              <span className="inline-block w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></span>
            </div>
          )}

          {/* Select All Brutalist Row */}
          <div className="card-brutal p-4 bg-yellow-50 flex items-center justify-between shadow-brutal-sm border-2 border-black mb-2 rounded-[15px]">
            <label className="flex items-center gap-3 font-bold uppercase tracking-wider text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={validSelectedKeys.length === items.length && items.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-5 h-5 border-2 border-black text-black accent-black cursor-pointer rounded-none bg-white focus:ring-0 focus:ring-offset-0"
              />
              <span>Chọn tất cả ({items.length} sản phẩm)</span>
            </label>
            <div className="flex items-center gap-4">
              {validSelectedKeys.length > 0 && (
                <button
                  onClick={handleRemoveMultipleItems}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-white px-3 py-1.5 border-2 border-transparent hover:border-black hover:bg-red-600 hover:shadow-brutal-sm transition-all rounded-md"
                >
                  <Trash2 size={14} />
                  Xóa mục đã chọn ({validSelectedKeys.length})
                </button>
              )}
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Đang chọn: {validSelectedKeys.length}
              </span>
            </div>
          </div>

          {items.map((item) => {
            const itemKey = item.field_key || String(item.product_id);
            const isSelected = validSelectedKeys.includes(itemKey);
            return (
              <div key={itemKey} className={`card-brutal p-4 flex flex-col md:flex-row items-center gap-6 relative transition-all rounded-[15px] ${isSelected ? 'bg-white border-black' : 'bg-gray-50/50 border-gray-300 shadow-none opacity-80'}`}>
                {/* Individual Checkbox */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectItem(itemKey, e.target.checked)}
                    className="w-5 h-5 border-2 border-black text-black accent-black cursor-pointer rounded-none bg-white focus:ring-0 focus:ring-offset-0"
                  />
                </div>

                {/* Product Image */}
                <div className="w-24 h-30 bg-gray-100 border-2 border-black overflow-hidden flex-shrink-0 rounded-[15px]">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 uppercase">No Image</div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-grow text-center md:text-left">
                  <Link to={`/product/${item.slug}`} className="font-serif text-xl font-bold hover:text-primary transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  <div className="flex flex-wrap gap-2 items-center mt-1 justify-center md:justify-start">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
                      {item.category || "Sản phẩm"}
                    </span>
                    {item.size && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-yellow-400 text-black border border-black px-2 py-0.5">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-400 text-white border border-black px-2 py-0.5">
                        Màu: {item.color}
                      </span>
                    )}
                    {item.type && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-green-400 text-black border border-black px-2 py-0.5">
                        Mẫu: {item.type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                    <span className="font-bold text-lg text-red-600">{formatPrice(item.price)}</span>
                    {item.original_price && (
                      <span className="text-sm text-gray-400 line-through font-bold">
                        {formatPrice(item.original_price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Số lượng</span>
                  <div className="flex items-center border-2 border-black font-bold bg-white shadow-brutal-sm">
                    <button
                      onClick={() => handleQuantityChange(item.product_id, item.field_key, item.quantity - 1, item.stock)}
                      className="px-3 py-1 hover:bg-black hover:text-white transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 border-x-2 border-black min-w-10 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.product_id, item.field_key, item.quantity + 1, item.stock)}
                      className="px-3 py-1 hover:bg-black hover:text-white transition-colors"
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                  {item.quantity >= item.stock && (
                    <span className="text-[9px] text-red-600 font-bold mt-1">Hết hàng trong kho</span>
                  )}
                </div>

                {/* Subtotal & Delete */}
                <div className="flex flex-col items-center md:items-end justify-between self-stretch md:self-auto min-w-32">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 hidden md:block">Tổng cộng</span>
                  <span className="font-bold text-xl text-black md:mt-2">{formatPrice(item.subtotal)}</span>

                  <button
                    onClick={() => handleRemoveItem(item.product_id, item.field_key)}
                    className="mt-4 md:mt-auto text-gray-500 hover:text-red-600 p-2 border-2 border-transparent hover:border-black hover:bg-red-50 hover:shadow-brutal transition-all"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

                {/* Cart Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                  <Link to="/shop" className="btn-brutal-secondary py-3 px-6 uppercase tracking-widest text-xs flex items-center gap-2 w-full sm:w-auto text-center justify-center">
                    ← Tiếp tục mua sắm
                  </Link>
                  <button
                    onClick={handleClearCart}
                    className="border-2 border-black py-3 px-6 uppercase tracking-widest text-xs font-bold hover:bg-red-600 hover:text-white hover:shadow-brutal active:translate-y-1 transition-all w-full sm:w-auto"
                  >
                    Làm trống giỏ hàng 🗑️
                  </button>
                </div>
              </div>

        {/* Right Column: Checkout Summary & Coupon */ }
            <div className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-24">
              {/* Coupon Card */}
              <div className="card-brutal bg-[#f4f4f4]">
                <h3 className="font-serif text-lg font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={18} className="text-yellow-600" /> Mã Giảm Giá
                </h3>
                <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider">
                  Nhập mã <span className="text-black font-extrabold">UTESHOP</span> để giảm 20% tổng bill!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã code..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="input-brutal bg-white text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="btn-brutal py-2.5 px-4 text-xs uppercase tracking-widest"
                  >
                    Áp dụng
                  </button>
                </div>
                {couponError && <p className="text-red-600 text-xs font-bold mt-2">{couponError}</p>}
                {couponSuccess && <p className="text-green-600 text-xs font-bold mt-2">{couponSuccess}</p>}
              </div>

              {/* Checkout Summary Card */}
              <div className="card-brutal bg-white">
                <h2 className="font-serif text-2xl font-bold mb-6 border-b-2 border-black pb-2 uppercase tracking-widest">
                  Đơn hàng
                </h2>

                <div className="flex flex-col gap-4 border-b-2 border-dashed border-gray-300 pb-4 mb-4 font-bold text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tạm tính:</span>
                    <span>{formatPrice(selectedTotalPrice)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá (20%):</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">Vận chuyển:</span>
                    <span>{shippingCost === 0 ? "Miễn phí 🚚" : formatPrice(shippingCost)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Miễn phí vận chuyển cho đơn hàng trên {formatPrice(500000)}!
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-baseline mb-8">
                  <span className="font-serif text-xl font-bold uppercase tracking-widest">Tổng tiền:</span>
                  <span className="font-bold text-3xl text-red-600">{formatPrice(finalTotal)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-brutal w-full py-4 text-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  Thanh Toán Ngay <ArrowRight size={20} />
                </button>
              </div>
            </div>
      </div>

        {/* CUSTOM RETRO CONFIRMATION POPUP (Replacing standard confirm) */}
        {confirmPopup?.isOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="card-brutal max-w-sm w-full bg-white relative p-6 text-center shadow-brutal-lg border-[3px] border-black">
              <div className="w-14 h-14 bg-yellow-400 border-2 border-black flex items-center justify-center shadow-brutal mb-4 mx-auto">
                <AlertTriangle className="w-8 h-8 text-black animate-pulse" />
              </div>
              <h4 className="font-serif text-xl font-bold mb-3 uppercase tracking-wider">Xác nhận</h4>
              <p className="text-sm text-gray-600 font-bold mb-6">{confirmPopup.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmPopup(null)}
                  className="flex-1 border-2 border-black py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-gray-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmPopup.onConfirm}
                  className="flex-1 btn-brutal py-2.5 uppercase tracking-wider text-xs"
                >
                  Đồng ý (OK)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COD CHECKOUT DELIVERY INFO FORM MODAL */}
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 overflow-y-auto animate-fade-in">
            <div className="card-brutal max-w-lg w-full bg-[#faf9f6] relative p-8 shadow-brutal-lg border-[3px] border-black my-8">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <h2 className="font-serif text-2xl font-bold mb-2 uppercase tracking-widest border-b-2 border-black pb-2 flex items-center gap-2">
                🚚 Thông Tin Nhận Hàng (COD)
              </h2>
              <p className="text-xs text-gray-500 font-bold mb-6 uppercase tracking-wider">
                Phương thức thanh toán bắt buộc: <span className="text-red-600 font-extrabold bg-red-50 border border-red-200 px-2 py-0.5">Thanh toán khi nhận hàng (COD)</span>
              </p>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <User size={14} /> Họ và tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                    value={checkoutForm.fullName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                    className="input-brutal bg-white w-full text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Phone size={14} /> Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 09XXXXXXXX"
                    required
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="input-brutal bg-white w-full text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <MapPin size={14} /> Địa chỉ giao hàng chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    required
                    rows={3}
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                    className="input-brutal bg-white w-full text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <FileText size={14} /> Ghi chú đơn hàng (Không bắt buộc)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi giao..."
                    value={checkoutForm.note}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, note: e.target.value })}
                    className="input-brutal bg-white w-full text-sm"
                  />
                </div>

                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-500 font-bold text-red-600 text-xs uppercase tracking-wider animate-shake">
                    ⚠️ {checkoutError}
                  </div>
                )}

                <div className="pt-4 border-t-2 border-dashed border-gray-300 flex justify-between items-baseline mb-4">
                  <span className="font-serif text-lg font-bold uppercase tracking-wider">Tổng thanh toán:</span>
                  <span className="font-bold text-2xl text-red-600">{formatPrice(finalTotal)}</span>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 border-2 border-black bg-white py-3 font-bold uppercase tracking-wider text-xs hover:bg-gray-100 transition-colors"
                    disabled={isSubmittingOrder}
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-brutal py-3 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                    disabled={isSubmittingOrder}
                  >
                    {isSubmittingOrder ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>Xác Nhận Đặt Hàng <ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUCCESS RETRO MODAL (Displays actual order details) */}
        {isSuccessModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="card-brutal max-w-md w-full bg-white relative p-8 text-center flex flex-col items-center shadow-brutal-lg border-[3px] border-black">
              <div className="w-16 h-16 bg-green-500 border-2 border-black flex items-center justify-center shadow-brutal mb-6">
                <CheckCircle2 className="w-10 h-10 text-white animate-bounce" />
              </div>

              <h3 className="font-serif text-3xl font-bold mb-2 uppercase tracking-widest text-green-600">
                Đặt Hàng Thành Công!
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1 mb-4">
                Mã đơn hàng: #{createdOrder?.id}
              </p>
              <p className="text-sm font-bold text-gray-600 mb-6">
                Cảm ơn bạn đã mua sắm tại <span className="text-primary font-extrabold">UTEShop</span>. Đơn hàng của bạn đã được khởi tạo thành công và đang được chuẩn bị để giao đi!
              </p>

              <div className="border-t-2 border-dashed border-black w-full pt-4 mb-6 text-left font-bold text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <span>Người nhận:</span>
                  <span className="text-black font-extrabold">{createdOrder?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số điện thoại:</span>
                  <span>{createdOrder?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Địa chỉ nhận:</span>
                  <span className="text-right truncate max-w-44" title={createdOrder?.address}>{createdOrder?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phương thức:</span>
                  <span className="text-red-600 uppercase font-extrabold">COD (Nhận hàng trả tiền)</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-gray-300 pt-2 mt-1">
                  <span>Tổng cộng:</span>
                  <span className="text-red-600 text-sm">{formatPrice(createdOrder?.total_price || finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate("/orders");
                }}
                className="btn-brutal w-full py-3.5 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Theo dõi đơn hàng 📦 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      );
};

      export default Cart;
