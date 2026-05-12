import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingCart, LogIn } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="w-full bg-white border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-12">
          <Link to="/" className="flex items-center space-x-2 text-primary">
            <ShoppingBag className="w-8 h-8" />
            <span className="font-serif text-3xl font-bold">UTEShop</span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link
              to="#"
              className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              BỘ SƯU TẬP
            </Link>
            <Link
              to="#"
              className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              NAM
            </Link>
            <Link
              to="#"
              className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              NỮ
            </Link>
            <Link
              to="#"
              className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors text-red-600"
            >
              GIẢM GIÁ
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingCart size={24} />
                <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  0
                </span>
              </button>

              <Link
                to="/profile"
                className="w-10 h-10 rounded-full border-2 border-black overflow-hidden hover:shadow-brutal transition-all"
              >
                <img
                  src="https://i.pravatar.cc/150?img=47"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </Link>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="flex items-center gap-2 border-2 border-black px-5 py-2.5 font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-200 hover:shadow-brutal"
            >
              <LogIn size={18} />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
