import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import productApi, { Product } from "@/services/productApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/stores/store";
import { addToCartThunk, addToCartLocal } from "@/stores/cartSlice";
import { Check, ShoppingBag } from "lucide-react";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Toast State
  const [toast, setToast] = useState<{ isOpen: boolean; productName: string; quantity: number } | null>(null);

  // Quick Add Variant State
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "created_at");
  const [order, setOrder] = useState<"asc" | "desc">((searchParams.get("order") as "asc" | "desc") || "desc");
  const [page, setPage] = useState(1);

  const fetchProducts = async (currentPage: number, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await productApi.getProducts({
        search: search || undefined,
        category_slug: categorySlug || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        sort_by: sortBy,
        order: order,
        page: currentPage,
        limit: 12,
      });

      if (append) {
        setProducts((prev) => [...prev, ...res.data.products]);
      } else {
        setProducts(res.data.products);
      }
      setTotalPages(res.data.total_pages);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (!loading && !loadingMore && page < totalPages) {
          setPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, page, totalPages]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categorySlug) params.set("category", categorySlug);
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    params.set("sort_by", sortBy);
    params.set("order", order);
    
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategorySlug("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("created_at");
    setOrder("desc");
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price));

  // Quick variant calculations
  const quickSizes = Array.from(new Set(quickProduct?.variants?.map((v) => v.size).filter(Boolean) || [])) as string[];
  const quickColors = Array.from(new Set(quickProduct?.variants?.map((v) => v.color).filter(Boolean) || [])) as string[];
  const quickTypes = Array.from(new Set(quickProduct?.variants?.map((v) => v.type).filter(Boolean) || [])) as string[];

  const matchedQuickVariant = quickProduct?.variants?.find(
    (v) =>
      (!quickSizes.length || v.size === selectedSize) &&
      (!quickColors.length || v.color === selectedColor) &&
      (!quickTypes.length || v.type === selectedType)
  );

  const quickStock = matchedQuickVariant ? matchedQuickVariant.stock : (quickProduct ? quickProduct.stock : 0);
  const quickPrice = matchedQuickVariant && matchedQuickVariant.price ? matchedQuickVariant.price : (quickProduct ? quickProduct.price : 0);

  const handleQuickAdd = (item: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.stock <= 0) return;

    const sizes = Array.from(new Set(item.variants?.map((v) => v.size).filter(Boolean) || [])) as string[];
    const colors = Array.from(new Set(item.variants?.map((v) => v.color).filter(Boolean) || [])) as string[];
    const types = Array.from(new Set(item.variants?.map((v) => v.type).filter(Boolean) || [])) as string[];

    if (sizes.length > 0 || colors.length > 0 || types.length > 0) {
      setQuickProduct(item);
      setSelectedSize(sizes.length > 0 ? sizes[0] : null);
      setSelectedColor(colors.length > 0 ? colors[0] : null);
      setSelectedType(types.length > 0 ? types[0] : null);
    } else {
      // Standard product add
      if (isAuthenticated) {
        dispatch(addToCartThunk({ productId: item.id, quantity: 1 }));
      } else {
        dispatch(addToCartLocal({ product: item, quantity: 1 }));
      }
      setToast({ isOpen: true, productName: item.name, quantity: 1 });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleConfirmQuickAdd = () => {
    if (!quickProduct) return;
    if (quickStock <= 0) {
      alert("Sản phẩm đã hết hàng trong kho!");
      return;
    }

    if (isAuthenticated) {
      dispatch(addToCartThunk({
        productId: quickProduct.id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
        type: selectedType
      }));
    } else {
      dispatch(addToCartLocal({
        product: quickProduct,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
        type: selectedType
      }));
    }

    setToast({ isOpen: true, productName: quickProduct.name, quantity: 1 });
    setTimeout(() => setToast(null), 3000);
    setQuickProduct(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-1/4">
        <div className="card-brutal p-6 bg-[#f4f4f4] sticky top-24 rounded-[15px]">
          <h2 className="font-serif text-2xl font-bold mb-6 border-b-2 border-black pb-2 uppercase tracking-widest">
            Bộ Lọc
          </h2>
          
          {/* Search */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Tìm kiếm</label>
            <Input 
              id="search"
              placeholder="Tên sản phẩm..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Danh mục</label>
            <select 
              className="w-full border-2 border-black p-3 bg-white shadow-brutal outline-none font-bold text-sm focus:translate-y-1 focus:translate-x-1 focus:shadow-none transition-all rounded-[15px]"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              <option value="ao-thun">Áo thun</option>
              <option value="quan-jean">Quần jean</option>
              <option value="ao-khoac">Áo khoác</option>
              <option value="phu-kien">Phụ kiện</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Khoảng giá</label>
            <div className="flex gap-2 items-center">
              <input 
                type="number" 
                placeholder="Từ" 
                className="w-1/2 border-2 border-black p-2 bg-white outline-none font-bold text-sm rounded-[15px]"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="font-bold">-</span>
              <input 
                type="number" 
                placeholder="Đến" 
                className="w-1/2 border-2 border-black p-2 bg-white outline-none font-bold text-sm rounded-[15px]"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Sắp xếp theo</label>
            <select 
              className="w-full border-2 border-black p-3 bg-white shadow-brutal outline-none font-bold text-sm focus:translate-y-1 focus:translate-x-1 focus:shadow-none transition-all rounded-[15px]"
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [newSortBy, newOrder] = e.target.value.split("-");
                setSortBy(newSortBy);
                setOrder(newOrder as "asc" | "desc");
              }}
            >
              <option value="created_at-desc">Mới nhất</option>
              <option value="created_at-asc">Cũ nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="sold-desc">Bán chạy nhất</option>
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleApplyFilters} className="w-full font-bold uppercase tracking-widest py-3 rounded-[15px]">
              Áp dụng lọc
            </Button>
            <button 
              onClick={handleResetFilters} 
              className="w-full font-bold uppercase tracking-widest py-3 border-2 border-black hover:bg-black hover:text-white transition-colors rounded-[15px]"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-3/4">
        <h1 className="font-serif text-4xl font-bold mb-8 uppercase tracking-widest border-b-4 border-black pb-4 inline-block">
          Cửa hàng
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 font-bold text-gray-500 border-2 border-dashed border-gray-400 rounded-[15px]">
            Không tìm thấy sản phẩm nào phù hợp.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((item) => (
                <div key={item.id} className="group flex flex-col justify-between card-brutal bg-white p-4 h-full relative rounded-[15px] hover:shadow-brutal-lg transition-all border-2 border-black">
                  <Link to={`/product/${item.slug}`} className="flex flex-col flex-grow">
                    <div className="card-brutal p-0 overflow-hidden bg-[#e0e0e0] aspect-[4/5] relative mb-4 rounded-[12px] border-2 border-black">
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
                        {item.stock <= 0 && (
                          <div className="bg-black text-white text-xs font-bold px-2 py-1 uppercase tracking-widest shadow-brutal rounded-[5px]">
                            Hết hàng
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="mt-auto">
                    <div className="flex items-center gap-3 mb-4">
                      <p className="font-bold text-lg text-red-600">{formatPrice(item.price)}</p>
                      {item.original_price && (
                        <p className="text-xs text-gray-400 line-through font-bold">
                          {formatPrice(item.original_price)}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => handleQuickAdd(item, e)}
                      disabled={item.stock <= 0}
                      className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-widest border-2 border-black rounded-[15px] transition-all flex items-center justify-center gap-2 ${
                        item.stock > 0
                          ? "bg-yellow-400 text-black hover:bg-black hover:text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300"
                      }`}
                    >
                      {item.stock > 0 ? "Thêm vào giỏ 🛒" : "Hết hàng"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <span className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></span>
              </div>
            )}
            
            {/* End of list message */}
            {!loadingMore && page >= totalPages && products.length > 0 && (
              <div className="text-center py-8 font-bold text-gray-500">
                Bạn đã xem hết sản phẩm.
              </div>
            )}
          </>
        )}
      </div>

      {/* QUICK VARIANT SELECTION MODAL */}
      {quickProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="card-brutal max-w-sm w-full bg-[#faf9f6] relative p-6 shadow-brutal-lg border-[3px] border-black rounded-[15px]">
            <button
              onClick={() => setQuickProduct(null)}
              className="absolute top-4 right-4 p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors rounded-[8px]"
            >
              ✕
            </button>

            <h3 className="font-serif text-xl font-bold mb-1 uppercase tracking-wider line-clamp-1 border-b-2 border-black pb-2">
              Chọn phân loại
            </h3>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              {quickProduct.name}
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Price & Stock info */}
              <div className="flex justify-between items-center bg-yellow-100 border-2 border-black p-3 rounded-[10px] text-xs font-bold">
                <div>Giá: <span className="text-red-600 font-extrabold">{formatPrice(quickPrice)}</span></div>
                <div>Kho: <span className={quickStock > 0 ? "text-green-600" : "text-red-600"}>{quickStock > 0 ? `${quickStock} cái` : "Hết hàng"}</span></div>
              </div>

              {/* Sizes */}
              {quickSizes.length > 0 && (
                <div>
                  <span className="block font-bold uppercase tracking-widest text-[10px] mb-2 text-gray-500">Kích cỡ:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`border-2 border-black px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-[8px] ${
                          selectedSize === size
                            ? "bg-yellow-400 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                            : "bg-white hover:bg-gray-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {quickColors.length > 0 && (
                <div>
                  <span className="block font-bold uppercase tracking-widest text-[10px] mb-2 text-gray-500">Màu sắc:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`border-2 border-black px-3 py-1.5 text-xs font-bold transition-all rounded-[8px] ${
                          selectedColor === color
                            ? "bg-blue-400 text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                            : "bg-white hover:bg-gray-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Types */}
              {quickTypes.length > 0 && (
                <div>
                  <span className="block font-bold uppercase tracking-widest text-[10px] mb-2 text-gray-500">Mẫu:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`border-2 border-black px-3 py-1.5 text-xs font-bold transition-all rounded-[8px] ${
                          selectedType === type
                            ? "bg-green-400 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                            : "bg-white hover:bg-gray-100 shadow-[3px_3px_0px_rgba(0,0,0,1)]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
              <button
                onClick={handleConfirmQuickAdd}
                disabled={quickStock <= 0}
                className={`w-full py-3 font-bold uppercase tracking-widest text-xs border-2 border-black rounded-[15px] shadow-brutal active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 ${
                  quickStock > 0 ? "bg-yellow-400 text-black" : "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300"
                }`}
              >
                Xác nhận thêm 🛒
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BRUTALIST TOAST NOTIFICATION */}
      {toast?.isOpen && (
        <div className="fixed bottom-6 right-6 z-50 p-4 border-[3px] border-black bg-[#f0fdf4] shadow-brutal flex items-center justify-between gap-6 animate-slide-up rounded-[15px] max-w-sm w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 border-2 border-black flex items-center justify-center text-white rounded-[5px]">
              <Check size={16} />
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-black">Đã thêm vào giỏ!</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">
                {toast.productName}
              </p>
            </div>
          </div>
          <Link to="/cart" className="border-2 border-black bg-white hover:bg-black hover:text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-[10px] flex-shrink-0">
            Xem giỏ 🛒
          </Link>
        </div>
      )}
    </div>
  );
};

export default Shop;
