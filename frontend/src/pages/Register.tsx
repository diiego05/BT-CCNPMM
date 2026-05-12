import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { UserPlus, Gift, Crown } from "lucide-react";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <main className="flex-grow flex flex-col items-center p-6 mt-10">
        <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8">
          {/* Left Side - Image */}
          <div className="w-full md:w-1/2 relative hidden md:block">
            <div className="card-brutal p-0 overflow-hidden bg-[#e6e2db] h-full relative border-[3px]">
              <div className="absolute top-8 left-8 bg-white px-6 py-4 border-2 border-black shadow-brutal z-10">
                <h3 className="font-serif italic text-xl font-bold">
                  New Era of Style
                </h3>
                <p className="text-[10px] font-bold tracking-widest uppercase mt-1">
                  COLLECTION 2024
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop"
                alt="Fashion Models"
                className="w-full h-full object-cover mix-blend-multiply"
              />
              <div className="absolute bottom-10 left-10 right-10 bg-black text-white p-8 border-2 border-white">
                <p className="font-bold text-lg mb-4 leading-relaxed">
                  "Thời trang không chỉ là những gì bạn mặc, mà là cách bạn
                  khẳng định cá tính riêng biệt."
                </p>
                <p className="text-[10px] font-bold tracking-widest uppercase">
                  — UTESHOP EDITORIAL
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <Card className="p-10 mb-8">
              <div className="mb-8">
                <h1 className="font-serif text-4xl font-bold mb-3">
                  Tạo tài khoản
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Tham gia cộng đồng UTEShop để nhận những ưu đãi đặc quyền và
                  bộ sưu tập mới nhất.
                </p>
              </div>

              <form className="space-y-5">
                <Input
                  label="Họ và tên"
                  id="fullname"
                  type="text"
                  placeholder="Nguyễn Văn A"
                />

                <Input
                  label="Địa chỉ email"
                  id="email"
                  type="email"
                  placeholder="example@uteshop.vn"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Mật khẩu" id="password" type="password" />
                  <Input
                    label="Nhập lại"
                    id="confirm_password"
                    type="password"
                  />
                </div>

                <div className="mt-4 flex justify-center">
                  {/* Mockup reCAPTCHA */}
                  <div className="flex items-center justify-between border border-gray-300 bg-gray-50 p-2 rounded-sm w-full max-w-[300px]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-6 h-6 border-2 border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-transparent focus:ring-0 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        I'm not a robot
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-[10px] text-gray-500">
                      <img
                        src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                        alt="reCAPTCHA"
                        className="w-8 h-8"
                      />
                      <span className="-mt-1">reCAPTCHA</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6 uppercase tracking-wider">
                  Tạo tài khoản
                </Button>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-gray-200">
                <p className="text-sm">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/auth/login"
                    className="font-bold text-primary hover:underline"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </Card>

            <div className="flex justify-between px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1">• BẢO MẬT 256-BIT</span>
              <span className="flex items-center gap-1">• HỖ TRỢ 24/7</span>
              <span className="flex items-center gap-1">• ĐỔI TRẢ 30 NGÀY</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-10">
          <Card className="p-8">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6">
              <UserPlus size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">
              Thành viên mới
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Giảm ngay 10% cho đơn hàng đầu tiên sau khi đăng ký thành công tài
              khoản UTEShop.
            </p>
          </Card>

          <Card className="p-8">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6">
              <Gift size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">
              Tích điểm đổi quà
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Mỗi lượt mua sắm là một cơ hội tích lũy điểm thưởng để nâng hạng
              thành viên Diamond.
            </p>
          </Card>

          <Card className="p-8">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6">
              <Crown size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Quyền lợi VIP</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ưu tiên mua sắm các bộ sưu tập Limited và tham gia các sự kiện
              thời trang độc quyền.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Register;
