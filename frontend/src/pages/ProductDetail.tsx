import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import productApi, { Product } from "@/services/productApi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Check } from "lucide-react";
import type { AppDispatch, RootState } from "@/stores/store";
import { addToCartThunk, addToCartLocal } from "@/stores/cartSlice";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);

  // Variant States
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await productApi.getProductDetail(slug);
        const prod = res.data.product;
        setProduct(prod);
        setRelated(res.data.related);
        setQuantity(1); // Reset quantity on product change

        // Auto-select first variant elements if available
        const sizes = Array.from(new Set(prod.variants?.map((v: any) => v.size).filter(Boolean) || [])) as string[];
        const colors = Array.from(new Set(prod.variants?.map((v: any) => v.color).filter(Boolean) || [])) as string[];
        const types = Array.from(new Set(prod.variants?.map((v: any) => v.type).filter(Boolean) || [])) as string[];

        setSelectedSize(sizes.length > 0 ? sizes[0] : null);
        setSelectedColor(colors.length > 0 ? colors[0] : null);
        setSelectedType(types.length > 0 ? types[0] : null);
      } catch (error) {
        console.error("Failed to load product detail", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0);
  }, [slug]);

  // Derived Variant States
  const uniqueSizes = Array.from(new Set(product?.variants?.map(v => v.size).filter(Boolean) || [])) as string[];
  const uniqueColors = Array.from(new Set(product?.variants?.map(v => v.color).filter(Boolean) || [])) as string[];
  const uniqueTypes = Array.from(new Set(product?.variants?.map(v => v.type).filter(Boolean) || [])) as string[];

  const selectedVariant = product?.variants?.find(v => 
    (!uniqueSizes.length || v.size === selectedSize) &&
    (!uniqueColors.length || v.color === selectedColor) &&
    (!uniqueTypes.length || v.type === selectedType)
  );

  const currentStock = selectedVariant ? selectedVariant.stock : (product ? product.stock : 0);
  const currentPrice = selectedVariant && selectedVariant.price ? selectedVariant.price : (product ? product.price : 0);

  const handleDecrease = () => setQuantity((prev) => Math.max(1, Number(prev) - 1));
  const handleIncrease = () => {
    if (product && Number(quantity) < currentStock) {
      setQuantity((prev) => Number(prev) + 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) return;
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) {
      if (num > currentStock) setQuantity(currentStock);
      else setQuantity(num);
    }
  };

  const handleQuantityBlur = () => {
    if (quantity === "" || Number(quantity) < 1) {
      setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    if (!product || currentStock <= 0) return;
    const qty = Number(quantity);

    if (isAuthenticated) {
      dispatch(addToCartThunk({ 
        productId: product.id, 
        quantity: qty,
        size: selectedSize,
        color: selectedColor,
        type: selectedType
      }));
    } else {
      dispatch(addToCartLocal({ 
        product, 
        quantity: qty,
        size: selectedSize,
        color: selectedColor,
        type: selectedType
      }));
    }

    // Show beautiful brutalist toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (loading) return <div className="text-center py-20 font-bold">Đang tải...</div>;
  if (!product) return <div className="text-center py-20 font-bold">Không tìm thấy sản phẩm!</div>;

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price));

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      {/* Breadcrumb */}
      <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
        <Link to="/" className="hover:text-black">Trang chủ</Link> /{" "}
        <Link to={`/shop?category=${product.category?.slug}`} className="hover:text-black">
          {product.category?.name}
        </Link>{" "}
        / <span className="text-black">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Images */}
        <div className="w-full md:w-1/2">
          {/* Main Swiper */}
          <Swiper
            spaceBetween={10}
            navigation={true}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            modules={[Navigation, Thumbs]}
            className="card-brutal mb-4 aspect-[4/5] bg-gray-100"
          >
            {product.images.map((img) => (
              <SwiperSlide key={img.id}>
                <img src={img.image_url} alt={product.name} className="w-full h-full object-cover" />
              </SwiperSlide>
            ))}
            {product.images.length === 0 && (
              <SwiperSlide>
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Không có hình ảnh
                </div>
              </SwiperSlide>
            )}
          </Swiper>
          
          {/* Thumbs Swiper */}
          {product.images.length > 1 && (
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[Navigation, Thumbs]}
              className="thumb-swiper"
            >
              {product.images.map((img) => (
                <SwiperSlide key={`thumb-${img.id}`} className="cursor-pointer border-2 border-transparent hover:border-black transition-all">
                  <img src={img.image_url} alt={product.name} className="w-full aspect-square object-cover" />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col">
          <h1 className="text-4xl font-serif font-bold mb-4">{product.name}</h1>
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6">
            Danh mục: <Link to={`/shop?category=${product.category?.slug}`} className="underline text-black">{product.category?.name}</Link>
          </p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-red-600">{formatPrice(currentPrice)}</span>
            {product.original_price && (
              <span className="text-lg text-gray-400 line-through font-bold">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 mb-8 text-sm font-bold bg-yellow-100 p-4 border-2 border-black">
            <div>Kho: <span className={currentStock > 0 ? "text-green-600" : "text-red-600"}>{currentStock > 0 ? `${currentStock} sản phẩm` : "Hết hàng"}</span></div>
            <div>Đã bán: <span>{product.sold}</span></div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-8 border-l-4 border-black pl-4">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </p>

          {/* Dynamic Variant Selectors */}
          {uniqueSizes.length > 0 && (
            <div className="mb-6">
              <span className="block font-bold uppercase tracking-widest text-xs mb-3 text-gray-500">Kích cỡ (Size):</span>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`border-2 border-black px-4 py-2 text-xs font-bold uppercase transition-all rounded-[10px] ${
                      selectedSize === size
                        ? "bg-yellow-400 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                        : "bg-white hover:bg-gray-100 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {uniqueColors.length > 0 && (
            <div className="mb-6">
              <span className="block font-bold uppercase tracking-widest text-xs mb-3 text-gray-500">Màu sắc (Color):</span>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`border-2 border-black px-4 py-2 text-xs font-bold transition-all rounded-[10px] ${
                      selectedColor === color
                        ? "bg-blue-400 text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                        : "bg-white hover:bg-gray-100 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {uniqueTypes.length > 0 && (
            <div className="mb-6">
              <span className="block font-bold uppercase tracking-widest text-xs mb-3 text-gray-500">Kiểu mẫu (Type):</span>
              <div className="flex flex-wrap gap-2">
                {uniqueTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`border-2 border-black px-4 py-2 text-xs font-bold transition-all rounded-[10px] ${
                      selectedType === type
                        ? "bg-green-400 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                        : "bg-white hover:bg-gray-100 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="mt-auto pt-6 border-t-2 border-dashed border-gray-300">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-bold uppercase tracking-widest text-sm">Số lượng:</span>
              <div className="flex items-center border-2 border-black font-bold">
                <button 
                  onClick={handleDecrease} 
                  className="px-4 py-2 hover:bg-black hover:text-white transition-colors"
                  disabled={Number(quantity) <= 1}
                >
                  -
                </button>
                <input 
                  type="text"
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  className="px-2 py-2 border-x-2 border-black w-16 text-center outline-none bg-transparent"
                />
                <button 
                  onClick={handleIncrease} 
                  className="px-4 py-2 hover:bg-black hover:text-white transition-colors"
                  disabled={Number(quantity) >= currentStock}
                >
                  +
                </button>
              </div>
            </div>

            <Button 
              onClick={handleAddToCart}
              className="w-full py-4 text-lg font-bold uppercase tracking-widest flex justify-center items-center gap-2"
              disabled={currentStock <= 0}
            >
              {currentStock > 0 ? (
                <>Thêm vào giỏ hàng <span className="text-2xl leading-none">+</span></>
              ) : (
                "Tạm hết hàng"
              )}
            </Button>
          </div>

          {/* Neo-brutalist Toast Notification */}
          {showToast && (
            <div className="mt-4 p-4 border-[3px] border-black bg-green-50 shadow-brutal flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 border-2 border-black flex items-center justify-center text-white">
                  <Check size={16} />
                </div>
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">Đã thêm thành công!</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                    {quantity} x {product.name}
                  </p>
                </div>
              </div>
              <Link to="/cart" className="border-2 border-black bg-white hover:bg-black hover:text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all">
                Xem Giỏ Hàng →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-serif font-bold mb-8 uppercase tracking-widest border-b-2 border-black pb-4">
            Sản phẩm tương tự
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <Link to={`/product/${item.slug}`} key={item.id} className="group cursor-pointer">
                <div className="card-brutal p-0 overflow-hidden bg-gray-100 aspect-[4/5] relative mb-4">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  {item.original_price && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 uppercase tracking-widest shadow-brutal">
                      Sale
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {item.name}
                </h3>
                <p className="font-bold text-red-600">{formatPrice(item.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
