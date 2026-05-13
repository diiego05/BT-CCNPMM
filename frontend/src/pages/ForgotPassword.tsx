import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { ShieldCheck } from "lucide-react";

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <main className="flex-grow flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 mt-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-black text-white flex items-center justify-center">
              <ShieldCheck size={32} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold mb-4">
              Khôi phục mật khẩu
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Đừng lo lắng, chuyện này thường xuyên xảy ra. Nhập email của bạn
              bên dưới để nhận liên kết khôi phục tài khoản.
            </p>
          </div>

          <form className="space-y-6">
            <Input
              label="Địa chỉ email"
              id="email"
              type="email"
              placeholder="example@uteshop.vn"
            />

            <Button className="w-full uppercase tracking-wider">
              Gửi liên kết
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-gray-200 pt-6">
            <Link
              to="/auth/login"
              className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <span>←</span> Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ForgotPassword;
