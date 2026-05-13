import { Share2, Globe, MessageCircle, ShoppingBag } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-black mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4 text-primary">
              <ShoppingBag className="w-6 h-6" />
              <span className="font-serif text-2xl font-bold">UTEShop</span>
            </div>
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              Phong cách Minimalism & Modern Retro cho giới trẻ hiện đại.
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg mb-6 tracking-wide uppercase">
              HỖ TRỢ
            </h4>
            <ul className="space-y-4 text-sm text-gray-700">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Chính sách vận chuyển
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Hướng dẫn chọn size
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Chính sách đổi trả
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg mb-6 tracking-wide uppercase">
              CÔNG TY
            </h4>
            <ul className="space-y-4 text-sm text-gray-700">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tuyển dụng
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg mb-6 tracking-wide uppercase">
              THEO DÕI CHÚNG TỐI
            </h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
              >
                <Share2 size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
              >
                <Globe size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2024 UTEShop. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-black transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-black transition-colors">
              Điều khoản dịch vụ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
