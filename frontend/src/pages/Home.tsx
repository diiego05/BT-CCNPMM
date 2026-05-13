import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import productApi, { Product } from "@/services/productApi";
import { Button } from "@/components/ui/Button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

const Home = () => {
  const [newestProducts, setNewestProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        // Lấy sản phẩm mới nhất
        const newestRes = await productApi.getProducts({ sort_by: "created_at", order: "desc", limit: 4 });
        setNewestProducts(newestRes.data.products);

        // Lấy sản phẩm bán chạy nhất
        const bestSellingRes = await productApi.getProducts({ sort_by: "sold", order: "desc", limit: 4 });
        setBestSellingProducts(bestSellingRes.data.products);

        // Lấy sản phẩm có khuyến mãi (tạm thời lấy mới nhất và lọc có original_price > price)
        // Nếu không đủ thì lấy đại 4 cái đầu tiên
        const allRes = await productApi.getProducts({ limit: 20 });
        const onSale = allRes.data.products.filter(p => p.original_price && Number(p.original_price) > Number(p.price));
        setSaleProducts(onSale.slice(0, 4));

      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price));

  const ProductCard = ({ item }: { item: Product }) => (
    <Link to={`/product/${item.slug}`} className="group cursor-pointer flex flex-col">
      <div className="card-brutal p-0 overflow-hidden bg-[#e0e0e0] aspect-[4/5] relative mb-4">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0].image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold uppercase">No Image</div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {item.original_price && Number(item.original_price) > Number(item.price) && (
            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 uppercase tracking-widest shadow-brutal">
              Khuyến mãi
            </div>
          )}
          {item.stock <= 0 && (
            <div className="bg-black text-white text-xs font-bold px-2 py-1 uppercase tracking-widest shadow-brutal">
              Hết hàng
            </div>
          )}
        </div>
      </div>
      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {item.name}
      </h3>
      <div className="flex items-center gap-3 mt-auto">
        <p className="font-bold text-xl text-red-600">{formatPrice(item.price)}</p>
        {item.original_price && (
          <p className="text-sm text-gray-400 line-through font-bold">
            {formatPrice(item.original_price)}
          </p>
        )}
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <span className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      {/* Hero Banner (Full Slider) */}
      <div className="w-full border-b-[3px] border-black mb-16 overflow-hidden">
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          modules={[Autoplay]}
          className="w-full"
        >
          {/* Slide 1 */}
          <SwiperSlide>
            <div className="w-full bg-[#d2bba3] py-20 px-6 h-[600px] flex items-center">
              <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center gap-10">
                <div className="md:w-1/2">
                  <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 uppercase leading-tight">
                    Thời Trang <br />
                    <span className="text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Chất Lượng</span>
                  </h1>
                  <p className="text-lg font-bold mb-8 border-l-4 border-black pl-4">
                    Khám phá bộ sưu tập mới nhất với phong cách tối giản, cá tính và chất liệu tuyệt vời nhất.
                  </p>
                  <Link to="/shop">
                    <Button className="px-8 py-4 text-lg uppercase tracking-widest font-black">
                      Mua Sắm Ngay
                    </Button>
                  </Link>
                </div>
                <div className="md:w-1/2 flex justify-center">
                  <div className="card-brutal p-0 w-[400px] h-[400px] transform rotate-3 hover:rotate-0 transition-transform duration-500 bg-white">
                    <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop" alt="Fashion 1" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* Slide 2 */}
          <SwiperSlide>
            <div className="w-full bg-[#b3d4e0] py-20 px-6 h-[600px] flex items-center">
              <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row flex-col-reverse items-center gap-10">
                <div className="md:w-1/2 flex justify-center">
                  <div className="card-brutal p-0 w-[400px] h-[400px] transform -rotate-3 hover:rotate-0 transition-transform duration-500 bg-white">
                    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" alt="Fashion 2" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="md:w-1/2 md:text-right">
                  <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 uppercase leading-tight">
                    Mùa Hè <br />
                    <span className="text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Sôi Động</span>
                  </h1>
                  <p className="text-lg font-bold mb-8 md:border-r-4 md:border-l-0 border-l-4 border-black md:pr-4 pl-4 md:pl-0 text-gray-800">
                    Sảng khoái và tự do với những bộ Outfit linh hoạt nhất dành cho những chuyến đi mùa hè rực rỡ.
                  </p>
                  <Link to="/shop">
                    <Button className="px-8 py-4 text-lg uppercase tracking-widest font-black bg-blue-600 text-white hover:bg-blue-700">
                      Khám Phá
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* Slide 3 */}
          <SwiperSlide>
            <div className="w-full bg-[#e0b3c6] py-20 px-6 h-[600px] flex items-center">
              <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center gap-10">
                <div className="md:w-1/2">
                  <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 uppercase leading-tight">
                    Phong Cách <br />
                    <span className="text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Thanh Lịch</span>
                  </h1>
                  <p className="text-lg font-bold mb-8 border-l-4 border-black pl-4 text-gray-900">
                    Sự kết hợp hoàn hảo giữa nét cổ điển và hơi thở đương đại, tạo nên chất riêng của bạn.
                  </p>
                  <Link to="/shop">
                    <Button className="px-8 py-4 text-lg uppercase tracking-widest font-black bg-pink-600 text-white hover:bg-pink-700">
                      Xem Bộ Sưu Tập
                    </Button>
                  </Link>
                </div>
                <div className="md:w-1/2 flex justify-center">
                  <div className="card-brutal p-0 w-[400px] h-[400px] transform rotate-2 hover:rotate-0 transition-transform duration-500 bg-white">
                    <img src="https://6a03d45d46fc04f7c2e15311.imgix.net/sneakers.jpg" alt="Fashion 3" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-24">
        {/* Newest Products Section */}
        <section>
          <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
            <h2 className="text-3xl font-serif font-bold uppercase tracking-widest">Sản Phẩm Mới Nhất</h2>
            <Link to="/shop?sort_by=created_at&order=desc" className="font-bold underline hover:text-gray-600 transition-colors">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newestProducts.map(p => <ProductCard key={`new-${p.id}`} item={p} />)}
          </div>
        </section>

        {/* Sale Products Section */}
        {saleProducts.length > 0 && (
          <section className="bg-yellow-100 p-8 border-[3px] border-black shadow-brutal -mx-6 md:mx-0">
            <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
              <h2 className="text-3xl font-serif font-bold uppercase tracking-widest text-red-600">Khuyến Mãi Khủng</h2>
              <Link to="/shop" className="font-bold underline hover:text-gray-600 transition-colors">
                Xem tất cả
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {saleProducts.map(p => <ProductCard key={`sale-${p.id}`} item={p} />)}
            </div>
          </section>
        )}

        {/* Best Selling Products Section */}
        <section>
          <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
            <h2 className="text-3xl font-serif font-bold uppercase tracking-widest">Bán Chạy Nhất</h2>
            <Link to="/shop?sort_by=sold&order=desc" className="font-bold underline hover:text-gray-600 transition-colors">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellingProducts.map(p => <ProductCard key={`best-${p.id}`} item={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
