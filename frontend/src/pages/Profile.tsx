import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "@/stores/authSlice";
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  PackageSearch,
  Star,
  Ticket,
  Map,
} from "lucide-react";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 flex flex-col gap-6">
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-[3px] border-black overflow-hidden mb-4 shadow-brutal">
                <img
                  src="https://i.pravatar.cc/150?img=47"
                  alt="Minh Anh"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="font-serif text-2xl font-bold">Minh Anh</h2>
              <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 mt-2 uppercase tracking-widest">
                HẠNG VÀNG
              </span>
            </Card>

            <div className="border-[3px] border-black shadow-brutal bg-white overflow-hidden">
              <nav className="flex flex-col">
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-4 bg-primary text-white font-bold border-b border-black"
                >
                  <User size={18} /> Thông tin tài khoản
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 border-b border-black text-gray-700 font-medium transition-colors"
                >
                  <Package size={18} /> Đơn hàng của tôi
                </a>
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
                  className="flex items-center gap-3 px-6 py-4 hover:bg-red-50 text-red-600 font-bold transition-colors w-full"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4 flex flex-col gap-6">
            <div className="mb-2">
              <h1 className="font-serif text-4xl font-bold mb-2">
                THÔNG TIN TÀI KHOẢN
              </h1>
              <p className="text-gray-600">
                Quản lý thông tin cá nhân và bảo mật tài khoản của bạn tại
                UTEShop.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Form */}
              <Card className="p-0 lg:col-span-2 flex flex-col">
                <div className="p-6 border-b-2 border-black flex items-center gap-2">
                  <User size={20} />
                  <h3 className="font-serif text-xl font-bold">
                    Hồ sơ cá nhân
                  </h3>
                </div>
                <div className="p-6 md:p-8 flex-grow">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Họ và tên"
                        id="fullname"
                        defaultValue="Nguyễn Minh Anh"
                      />
                      <Input
                        label="Số điện thoại"
                        id="phone"
                        defaultValue="0901 234 567"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Email"
                        id="email"
                        type="email"
                        defaultValue="minhanh.design@gmail.com"
                        disabled
                        className="bg-gray-100 text-gray-500"
                      />
                      <Input
                        label="Ngày sinh"
                        id="dob"
                        type="date"
                        defaultValue="1998-10-15"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-3 block">
                        Giới tính
                      </label>
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            className="w-4 h-4 text-primary focus:ring-primary border-black accent-primary"
                          />
                          <span>Nam</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            defaultChecked
                            className="w-4 h-4 text-primary focus:ring-primary border-black accent-primary"
                          />
                          <span>Nữ</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            className="w-4 h-4 text-primary focus:ring-primary border-black accent-primary"
                          />
                          <span>Khác</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button className="w-full md:w-auto">Lưu thay đổi</Button>
                    </div>
                  </form>
                </div>
              </Card>

              {/* Stats & Rank */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                <Card className="p-0 flex flex-col">
                  <div className="p-5 border-b-2 border-black">
                    <h3 className="font-serif text-lg font-bold">Thống kê</h3>
                  </div>
                  <div className="flex flex-col">
                    <div className="p-5 border-b-2 border-black flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                          <PackageSearch size={20} />
                        </div>
                        <div>
                          <p className="font-serif text-2xl font-bold leading-none">
                            08
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                            Đơn hàng hiện tại
                          </p>
                        </div>
                      </div>
                      <span>›</span>
                    </div>
                    <div className="p-5 border-b-2 border-black flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                          <Star size={20} />
                        </div>
                        <div>
                          <p className="font-serif text-2xl font-bold leading-none">
                            1.250
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                            Điểm tích lũy
                          </p>
                        </div>
                      </div>
                      <span>›</span>
                    </div>
                    <div className="p-5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                          <Ticket size={20} />
                        </div>
                        <div>
                          <p className="font-serif text-2xl font-bold leading-none">
                            03
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                            Voucher khả dụng
                          </p>
                        </div>
                      </div>
                      <span>›</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-[#faf9f6]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center flex-shrink-0">
                      <Star size={24} className="text-[#fbbd08]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Hạng thành viên
                      </p>
                      <h4 className="font-serif text-2xl font-bold text-[#d4af37] mt-1 mb-2">
                        Gold Member
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Tích lũy thêm{" "}
                        <span className="font-bold text-black">750 điểm</span>{" "}
                        để lên hạng Kim Cương.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Default Address */}
            <Card className="p-0 mt-2 flex flex-col">
              <div className="p-6 border-b-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={20} />
                  <h3 className="font-serif text-xl font-bold">
                    Địa chỉ nhận hàng mặc định
                  </h3>
                </div>
                <button className="border-2 border-black px-4 py-1 text-sm font-bold hover:bg-black hover:text-white transition-colors">
                  Thay đổi
                </button>
              </div>
              <div className="p-6 md:p-8 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">Minh Anh</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">0901 234 567</span>
                    <span className="bg-gray-200 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                      Mặc định
                    </span>
                  </div>
                  <p className="text-gray-700">
                    Số 123, Đường Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức,
                    TP. Hồ Chí Minh
                  </p>
                </div>
                <div className="hidden md:flex w-16 h-16 border-2 border-black items-center justify-center">
                  <Map size={24} className="text-gray-400" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
