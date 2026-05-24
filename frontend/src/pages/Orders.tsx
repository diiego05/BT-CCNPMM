import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/stores/store";
import { logout } from "@/stores/authSlice";
import orderApi, { Order, OrderItem } from "@/services/orderApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Package,
  User,
  MapPin,
  Heart,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  ArrowLeft,
  ShoppingBag,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  FileText,
  AlertCircle
} from "lucide-react";

// ==========================================================
// DYNAMIC COUNTDOWN TIMER COMPONENT (30 mins cancellation rule)
// ==========================================================
interface CountdownProps {
  createdAt: string;
  onExpire: () => void;
}

function OrderCancelCountdown({ createdAt, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdAtMs = new Date(createdAt).getTime();
      const limitMs = createdAtMs + 30 * 60 * 1000; // 30 minutes limit
      const diff = limitMs - Date.now();
      return Math.max(0, diff);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, onExpire]);

  if (timeLeft <= 0) {
    return (
      <span className="text-[10px] text-gray-500 font-extrabold uppercase bg-gray-100 border border-gray-300 px-2 py-1 flex items-center gap-1.5 shadow-brutal-sm">
        🚫 Hết thời gian tự hủy ( lớn hơn 30 phút)
      </span>
    );
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <span className="text-[10px] text-red-600 font-extrabold uppercase bg-red-50 border border-red-200 px-3 py-1 flex items-center gap-1.5 shadow-brutal-sm animate-pulse">
      ⏳ Hủy đơn trong: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </span>
  );
}

// ==========================================================
// INTERACTIVE ORDER TRACKER COMPONENT (5 steps)
// ==========================================================
interface TrackerProps {
  status: number; // 1 to 5
}

function OrderTracker({ status }: TrackerProps) {
  const steps = [
    { label: "Đơn hàng mới", icon: FileText, desc: "Chờ xác nhận" },
    { label: "Đã xác nhận", icon: ShieldCheck, desc: "Đã duyệt đơn" },
    { label: "Chuẩn bị hàng", icon: Package, desc: "Shop chuẩn bị" },
    { label: "Đang giao hàng", icon: Truck, desc: "Shipper đang giao" },
    { label: "Giao thành công", icon: CheckCircle2, desc: "Hoàn tất" },
  ];

  return (
    <div className="w-full mt-6 pt-6 border-t-2 border-dashed border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < status || status === 5;
          const isActive = stepNum === status && status !== 5;

          let circleClass = "bg-white border-gray-300 text-gray-400 border-2";
          let labelClass = "text-gray-400 font-bold";
          let descClass = "text-gray-400";

          if (isCompleted) {
            circleClass = "bg-green-500 text-white border-black border-2 shadow-brutal-sm";
            labelClass = "text-black font-black";
            descClass = "text-gray-500 font-medium";
          } else if (isActive) {
            circleClass = "bg-yellow-400 text-black border-black border-[3px] shadow-brutal animate-bounce";
            labelClass = "text-primary font-black";
            descClass = "text-gray-700 font-bold";
          }

          const StepIcon = step.icon;

          return (
            <div key={index} className="flex-1 flex md:flex-col items-center gap-4 md:gap-2 w-full relative">
              {/* Connector line (Desktop only) */}
              {index < steps.length - 1 && (
                <div
                  className={`hidden md:block absolute top-5 left-[50%] right-[-50%] h-[3px] z-0 ${stepNum < status
                      ? "bg-black"
                      : "border-t-2 border-dashed border-gray-300"
                    }`}
                />
              )}

              {/* Step Circle with Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${circleClass}`}
              >
                <StepIcon size={18} />
              </div>

              {/* Step Info */}
              <div className="text-left md:text-center">
                <p className={`text-xs uppercase tracking-wider ${labelClass}`}>
                  {step.label}
                </p>
                <p className={`text-[10px] uppercase ${descClass}`}>{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================================
// MAIN ORDERS PAGE COMPONENT
// ==========================================================
const Orders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering & Detail Toggles
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "active" | "completed" | "cancelled">("all");
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // Modals state
  const [confirmModal, setConfirmModal] = useState<{
    orderId: number;
    message: string;
    isPreparing: boolean;
  } | null>(null);

  const [feedbackModal, setFeedbackModal] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getOrderHistory();
      if (response.status === 200) {
        setOrders(response.data);
      } else {
        setError(response.message || "Không thể tải danh sách đơn hàng.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi kết nối hệ thống khi lấy lịch sử mua hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login", { replace: true });
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getProductImage = (item: OrderItem) => {
    if (item.product?.images && item.product.images.length > 0) {
      const primary = item.product.images.find((img) => img.is_primary);
      return primary ? primary.image_url : item.product.images[0].image_url;
    }
    return "";
  };

  // Check if an order is eligible for cancellation (<= 30 mins and status is 1, 2, or 3)
  const isEligibleForCancel = (order: Order) => {
    if (![1, 2, 3].includes(order.status)) return false;
    const createdAtMs = new Date(order.created_at).getTime();
    const elapsed = Date.now() - createdAtMs;
    return elapsed <= 30 * 60 * 1000; // Under 30 minutes
  };

  // Open cancellation confirmation dialog
  const initiateCancel = (order: Order) => {
    const isPreparing = order.status === 3;
    let message = "";
    if (isPreparing) {
      message = "Đơn hàng đang ở trạng thái 'Shop đang chuẩn bị hàng'. Nếu hủy, hệ thống sẽ gửi Yêu cầu hủy đơn hàng đến shop để duyệt thủ công. Bạn có chắc chắn muốn tiếp tục?";
    } else {
      message = "Bạn có chắc chắn muốn hủy trực tiếp đơn hàng này? Hệ thống sẽ hủy ngay lập tức và tự động cộng trả lại sản phẩm vào kho hàng.";
    }

    setConfirmModal({
      orderId: order.id,
      message,
      isPreparing,
    });
  };

  // Execute cancel order API call
  const executeCancel = async () => {
    if (!confirmModal) return;
    setIsCancelling(true);
    try {
      const response = await orderApi.cancelOrder(confirmModal.orderId);
      setConfirmModal(null);
      if (response.status === 200) {
        setFeedbackModal({
          message: response.message || "Hủy đơn hàng thành công!",
          type: "success",
        });
        fetchOrders(); // Refresh order list
      } else {
        setFeedbackModal({
          message: response.message || "Không thể hủy đơn hàng.",
          type: "error",
        });
      }
    } catch (err: any) {
      setConfirmModal(null);
      setFeedbackModal({
        message: err.response?.data?.message || "Lỗi hệ thống khi hủy đơn hàng.",
        type: "error",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper for Status Badge styling
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-800 border-2 border-yellow-500 px-3 py-1 shadow-brutal-sm">
            Đơn hàng mới 🆕
          </span>
        );
      case 2:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-800 border-2 border-blue-500 px-3 py-1 shadow-brutal-sm">
            Đã xác nhận ✔️
          </span>
        );
      case 3:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-800 border-2 border-orange-500 px-3 py-1 shadow-brutal-sm animate-pulse">
            Đang chuẩn bị 📦
          </span>
        );
      case 4:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-800 border-2 border-purple-500 px-3 py-1 shadow-brutal-sm">
            Đang giao hàng 🚚
          </span>
        );
      case 5:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-800 border-2 border-green-500 px-3 py-1 shadow-brutal-sm">
            Giao thành công 🎉
          </span>
        );
      case 6:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-800 border-2 border-red-500 px-3 py-1 shadow-brutal-sm">
            Đã hủy đơn ❌
          </span>
        );
      case 7:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-pink-100 text-pink-800 border-2 border-pink-500 px-3 py-1 shadow-brutal-sm">
            Chờ hủy đơn ⏳
          </span>
        );
      default:
        return (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-800 border-2 border-gray-500 px-3 py-1 shadow-brutal-sm">
            Không xác định ❓
          </span>
        );
    }
  };

  // Filtering Logic
  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return order.status === 1;
    if (activeFilter === "active") return [2, 3, 4].includes(order.status);
    if (activeFilter === "completed") return order.status === 5;
    if (activeFilter === "cancelled") return [6, 7].includes(order.status);
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10 mt-10">
        {/* Breadcrumb */}
        <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
          <Link to="/" className="hover:text-black">Trang chủ</Link> / <span className="text-black">Đơn hàng của tôi</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* LEFT SIDEBAR (visual parity with Profile.tsx) */}
          <div className="w-full md:w-1/4 flex flex-col gap-6">
            <Card className="p-6 flex flex-col items-center text-center bg-white border-[3px] border-black shadow-brutal">
              <div className="w-24 h-24 rounded-full border-[3px] border-black overflow-hidden mb-4 shadow-brutal">
                <img
                  src="https://i.pravatar.cc/150?img=47"
                  alt="Minh Anh"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="font-serif text-2xl font-bold">Minh Anh</h2>
              <span className="bg-yellow-400 text-black text-xs font-black border border-black px-3 py-1 mt-2 uppercase tracking-widest shadow-brutal-sm">
                HẠNG VÀNG 🌟
              </span>
            </Card>

            <div className="border-[3px] border-black shadow-brutal bg-white overflow-hidden">
              <nav className="flex flex-col">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 border-b border-black text-gray-700 font-medium transition-colors"
                >
                  <User size={18} /> Thông tin tài khoản
                </Link>
                <div
                  className="flex items-center gap-3 px-6 py-4 bg-primary text-white font-bold border-b border-black"
                >
                  <Package size={18} /> Đơn hàng của tôi
                </div>
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 border-b border-black text-gray-700 font-medium transition-colors"
                >
                  <MapPin size={18} /> Địa chỉ giao hàng
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 border-b border-black text-gray-700 font-medium transition-colors"
                >
                  <Heart size={18} /> Sản phẩm yêu thích
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-red-50 text-red-600 font-bold transition-colors w-full text-left"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </nav>
            </div>
          </div>

          {/* RIGHT MAIN SECTION */}
          <div className="w-full md:w-3/4 flex flex-col gap-6">
            <div className="mb-2 border-b-4 border-black pb-4">
              <h1 className="font-serif text-4xl font-bold uppercase tracking-widest mb-2">
                Đơn Hàng Của Tôi
              </h1>
              <p className="text-gray-600 font-bold">
                Theo dõi trạng thái giao hàng, kiểm tra chi tiết thanh toán và quản lý lịch sử đơn hàng của bạn.
              </p>
            </div>

            {/* FILTER TABS (Brutalist Style) */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: "all", label: "Tất cả đơn" },
                { id: "pending", label: "Chờ xác nhận" },
                { id: "active", label: "Đang xử lý/giao" },
                { id: "completed", label: "Đã hoàn thành" },
                { id: "cancelled", label: "Đã hủy/Chờ hủy" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`border-2 border-black px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all active:translate-y-0.5 ${activeFilter === tab.id
                      ? "bg-primary text-white shadow-brutal-sm translate-y-[-2px]"
                      : "bg-white text-black hover:bg-gray-50"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ERROR STATE */}
            {error && (
              <div className="card-brutal border-red-500 bg-red-50 p-6 text-center flex flex-col items-center">
                <AlertCircle className="w-12 h-12 text-red-600 mb-3 animate-bounce" />
                <h3 className="font-serif text-xl font-bold text-red-800 uppercase mb-2">Đã xảy ra lỗi!</h3>
                <p className="text-sm font-bold text-red-600 mb-4">{error}</p>
                <Button onClick={fetchOrders} className="py-2 px-6 uppercase tracking-wider text-xs">
                  Thử lại 🔄
                </Button>
              </div>
            )}

            {/* LOADING STATE */}
            {loading && (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <span className="inline-block w-14 h-14 border-4 border-black border-t-transparent rounded-full animate-spin"></span>
                <p className="font-bold uppercase tracking-widest text-xs text-gray-500 animate-pulse">
                  Đang tải đơn hàng của bạn...
                </p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && filteredOrders.length === 0 && (
              <div className="card-brutal bg-white p-12 text-center flex flex-col items-center border-[3px] border-black shadow-brutal">
                <div className="w-16 h-16 bg-yellow-100 border-2 border-black flex items-center justify-center shadow-brutal mb-6">
                  <ShoppingBag className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-serif text-2xl font-bold uppercase tracking-wider mb-2">
                  Không tìm thấy đơn hàng nào!
                </h3>
                <p className="text-gray-500 font-bold mb-6 max-w-sm">
                  {activeFilter === "all"
                    ? "Bạn chưa thực hiện bất kỳ giao dịch mua sắm nào tại UTEShop."
                    : "Không tìm thấy đơn hàng nào khớp với danh mục lọc hiện tại."}
                </p>
                <Link to="/shop" className="btn-brutal uppercase tracking-widest text-xs py-3 px-8 inline-flex items-center gap-2">
                  Khám phá cửa hàng ngay <ArrowLeft className="rotate-180" size={14} />
                </Link>
              </div>
            )}

            {/* ORDERS LIST */}
            {!loading && !error && filteredOrders.length > 0 && (
              <div className="flex flex-col gap-6">
                {filteredOrders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  const canCancel = isEligibleForCancel(order);

                  return (
                    <div
                      key={order.id}
                      className="card-brutal bg-white border-[3px] border-black shadow-brutal p-6 relative flex flex-col gap-4 transition-all hover:translate-y-[-2px] hover:shadow-brutal-lg"
                    >
                      {/* CARD HEADER */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-dashed border-gray-200">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-serif text-lg font-black uppercase tracking-wider">
                              Đơn hàng #{order.id}
                            </h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1">
                            <Clock size={12} /> Ngày đặt: {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Tổng thanh toán COD</p>
                          <p className="text-2xl font-black text-red-600">{formatPrice(order.total_price)}</p>
                        </div>
                      </div>

                      {/* STATUS-SPECIFIC RED/ORANGE ALERTS FOR CANCELLED STATES */}
                      {order.status === 6 && (
                        <div className="card-brutal border-red-500 bg-red-50 p-4 flex items-start gap-3">
                          <div className="w-8 h-8 bg-red-600 text-white border-2 border-black flex items-center justify-center shadow-brutal-sm flex-shrink-0">
                            <X size={16} />
                          </div>
                          <div>
                            <h4 className="font-serif text-sm font-bold text-red-700 uppercase tracking-wider">Đơn hàng đã bị hủy</h4>
                            <p className="text-xs font-bold text-red-600 mt-0.5">
                              Đơn hàng đã được hủy thành công và sản phẩm được tự động hoàn trả lại kho tồn kho của UTEShop.
                            </p>
                          </div>
                        </div>
                      )}

                      {order.status === 7 && (
                        <div className="card-brutal border-orange-500 bg-orange-50 p-4 flex items-start gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-orange-400 text-black border-2 border-black flex items-center justify-center shadow-brutal-sm flex-shrink-0">
                            <AlertTriangle size={16} />
                          </div>
                          <div>
                            <h4 className="font-serif text-sm font-bold text-orange-800 uppercase tracking-wider">Yêu cầu hủy đơn hàng</h4>
                            <p className="text-xs font-bold text-orange-700 mt-0.5">
                              Yêu cầu hủy đã được gửi thành công vì đơn hàng đang chuẩn bị. Vui lòng chờ bộ phận CSKH của UTEShop phê duyệt.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ACTIVE TRACKER PROGRESS BAR (for normal statuses 1 to 5) */}
                      {[1, 2, 3, 4, 5].includes(order.status) && (
                        <OrderTracker status={order.status} />
                      )}

                      {/* BOTTOM ACCORDION PANEL BUTTONS */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Live Ticking Countdown if Cancel-Eligible */}
                          {canCancel && (
                            <OrderCancelCountdown
                              createdAt={order.created_at}
                              onExpire={() => {
                                // Forces component re-render to disable cancel button
                                setOrders((prev) => [...prev]);
                              }}
                            />
                          )}

                          {canCancel && (
                            <button
                              onClick={() => initiateCancel(order)}
                              className="border-2 border-black bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 shadow-brutal-sm hover:shadow-brutal active:translate-y-0.5 transition-all"
                            >
                              Hủy Đơn Hàng 🗑️
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="flex items-center gap-1 text-xs font-black uppercase tracking-wider hover:text-primary transition-colors py-1.5 px-3 border-2 border-black bg-white shadow-brutal-sm active:translate-y-0.5 transition-all self-end sm:self-auto"
                        >
                          {isExpanded ? (
                            <>Thu gọn chi tiết <ChevronUp size={16} /></>
                          ) : (
                            <>Xem chi tiết đơn hàng <ChevronDown size={16} /></>
                          )}
                        </button>
                      </div>

                      {/* EXPANDED PANEL DETAILS */}
                      {isExpanded && (
                        <div className="border-t-2 border-dashed border-gray-200 pt-6 mt-2 flex flex-col gap-6 animate-fade-in">
                          {/* Shipping Details */}
                          <div className="card-brutal bg-gray-50 p-4 border-2 border-black grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 text-gray-500 border-b pb-1">
                                <User size={14} /> Thông tin giao nhận
                              </h4>
                              <p className="text-xs font-bold text-gray-800">
                                Họ tên: <span className="text-black font-extrabold">{order.full_name}</span>
                              </p>
                              <p className="text-xs font-bold text-gray-800 mt-1">
                                SĐT liên hệ: <span className="text-black font-extrabold">{order.phone}</span>
                              </p>
                              <p className="text-xs font-bold text-gray-800 mt-1 flex items-start gap-1">
                                <MapPin size={12} className="mt-0.5 flex-shrink-0" /> Địa chỉ: <span className="text-black font-extrabold">{order.address}</span>
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 text-gray-500 border-b pb-1">
                                <FileText size={14} /> Ghi chú & Thanh toán
                              </h4>
                              <p className="text-xs font-bold text-gray-800 italic bg-white p-2 border border-gray-200 rounded min-h-12">
                                Ghi chú: "{order.note || "Không có ghi chú"}"
                              </p>
                              <p className="text-xs font-bold text-red-600 mt-2 uppercase tracking-wider flex items-center gap-1">
                                💳 Phương thức: Thanh toán khi nhận hàng (COD)
                              </p>
                            </div>
                          </div>

                          {/* Ordered Products Breakdown */}
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                              Sản phẩm trong đơn hàng
                            </h4>
                            <div className="flex flex-col gap-3">
                              {order.items?.map((item) => {
                                const imgUrl = getProductImage(item);
                                return (
                                  <div
                                    key={item.id}
                                    className="card-brutal p-3 bg-white border border-black flex flex-col sm:flex-row items-center gap-4"
                                  >
                                    {/* Thumbnail image */}
                                    <div className="w-16 h-20 bg-gray-100 border border-black overflow-hidden flex-shrink-0">
                                      {imgUrl ? (
                                        <img
                                          src={imgUrl}
                                          alt={item.product?.name || "Product"}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                                          No Image
                                        </div>
                                      )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow text-center sm:text-left">
                                      <Link
                                        to={`/product/${item.product?.slug}`}
                                        className="font-serif text-sm font-black hover:text-primary transition-colors line-clamp-1"
                                      >
                                        {item.product?.name || "Sản phẩm thời trang"}
                                      </Link>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                        Mã số: #{item.product_id}
                                      </p>
                                    </div>

                                    {/* Price & Quantity Math */}
                                    <div className="text-right font-bold text-xs flex flex-col sm:flex-row items-center gap-1 sm:gap-6 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                                      <div className="text-gray-500 sm:text-right">
                                        {formatPrice(item.price)} x {item.quantity}
                                      </div>
                                      <div className="text-red-600 font-black text-sm">
                                        {formatPrice(Number(item.price) * item.quantity)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CUSTOM RETRO BRUTALIST CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="card-brutal max-w-md w-full bg-white relative p-6 text-center shadow-brutal-lg border-[3px] border-black">
            <div className="w-14 h-14 bg-red-100 border-2 border-black flex items-center justify-center shadow-brutal mb-4 mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
            <h4 className="font-serif text-xl font-bold mb-3 uppercase tracking-wider text-red-600">
              {confirmModal.isPreparing ? "Gửi Yêu Cầu Hủy" : "Xác Nhận Hủy Đơn"}
            </h4>
            <p className="text-sm text-gray-600 font-bold mb-6 text-left border bg-gray-50 p-3 rounded">
              {confirmModal.message}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border-2 border-black py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-gray-100 transition-colors"
                disabled={isCancelling}
              >
                Quay lại
              </button>
              <button
                onClick={executeCancel}
                className="flex-1 btn-brutal bg-red-600 hover:bg-red-700 text-white py-2.5 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>Đồng ý hủy</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM RETRO BRUTALIST FEEDBACK RESPONSE MODAL */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="card-brutal max-w-sm w-full bg-white relative p-6 text-center shadow-brutal-lg border-[3px] border-black">
            <div
              className={`w-14 h-14 border-2 border-black flex items-center justify-center shadow-brutal mb-4 mx-auto ${feedbackModal.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}
            >
              {feedbackModal.type === "success" ? (
                <CheckCircle2 className="w-8 h-8 text-white animate-bounce" />
              ) : (
                <AlertCircle className="w-8 h-8 text-white animate-bounce" />
              )}
            </div>
            <h4 className="font-serif text-xl font-bold mb-3 uppercase tracking-wider">
              {feedbackModal.type === "success" ? "Thành Công!" : "Thất Bại!"}
            </h4>
            <p className="text-sm text-gray-600 font-bold mb-6">{feedbackModal.message}</p>
            <button
              onClick={() => setFeedbackModal(null)}
              className="w-full btn-brutal py-2.5 uppercase tracking-wider text-xs"
            >
              Đóng hộp thoại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
