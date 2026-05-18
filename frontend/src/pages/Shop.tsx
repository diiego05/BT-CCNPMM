import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import productApi, { Product } from "@/services/productApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

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

  return (
    <div className="max-w-7xl mx-auto p-6 mt-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-1/4">
        <div className="card-brutal p-6 bg-[#f4f4f4] sticky top-24">
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
              className="w-full border-2 border-black p-3 bg-white shadow-brutal outline-none font-bold text-sm focus:translate-y-1 focus:translate-x-1 focus:shadow-none transition-all"
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
                className="w-1/2 border-2 border-black p-2 bg-white outline-none font-bold text-sm"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="font-bold">-</span>
              <input 
                type="number" 
                placeholder="Đến" 
                className="w-1/2 border-2 border-black p-2 bg-white outline-none font-bold text-sm"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Sắp xếp theo</label>
            <select 
              className="w-full border-2 border-black p-3 bg-white shadow-brutal outline-none font-bold text-sm focus:translate-y-1 focus:translate-x-1 focus:shadow-none transition-all"
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
            <Button onClick={handleApplyFilters} className="w-full font-bold uppercase tracking-widest py-3">
              Áp dụng lọc
            </Button>
            <button 
              onClick={handleResetFilters} 
              className="w-full font-bold uppercase tracking-widest py-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
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
          <div className="text-center py-20 font-bold text-gray-500 border-2 border-dashed border-gray-400">
            Không tìm thấy sản phẩm nào phù hợp.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((item) => (
                <Link to={`/product/${item.slug}`} key={item.id} className="group cursor-pointer flex flex-col">
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
    </div>
  );
};

export default Shop;
