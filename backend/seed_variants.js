import db from "./src/models/index.js";

const seedVariants = async () => {
  try {
    // Synchronize models first to ensure the product_variants table is created
    console.log("Synchronizing database...");
    await db.sequelize.sync({ alter: true });
    console.log("Database synchronized.");

    const products = await db.Product.findAll({
      include: [{ model: db.Category, as: "category" }]
    });

    if (products.length === 0) {
      console.error("No products found in the database!");
      process.exit(1);
    }

    console.log(`Found ${products.length} products to populate variants.`);

    // Clear existing variants first
    await db.ProductVariant.destroy({ where: {} });
    console.log("Cleared old variants.");

    for (const p of products) {
      const catSlug = p.category ? p.category.slug : "";
      
      if (catSlug === "ao-thun" || catSlug === "quan-jean" || catSlug === "ao-khoac") {
        // Clothes: size and color variants
        const sizes = ["S", "M", "L", "XL"];
        const colors = ["Đen", "Trắng", "Xanh", "Đỏ"];
        
        console.log(`Seeding size/color variants for cloth product: ${p.name}`);
        
        for (const size of sizes) {
          for (const color of colors) {
            // Random stock
            const stock = Math.floor(Math.random() * 20) + 5;
            await db.ProductVariant.create({
              product_id: p.id,
              size,
              color,
              stock
            });
          }
        }
      } else if (catSlug === "phu-kien" || p.name.toLowerCase().includes("mũ") || p.name.toLowerCase().includes("kính") || p.name.toLowerCase().includes("túi")) {
        // Accessories: type variants (patterns/models)
        const types = ["Mẫu A (Cổ điển)", "Mẫu B (Hiện đại)", "Mẫu C (Giới hạn)"];
        console.log(`Seeding model/type variants for accessory product: ${p.name}`);
        
        for (const type of types) {
          const stock = Math.floor(Math.random() * 15) + 3;
          await db.ProductVariant.create({
            product_id: p.id,
            type,
            stock
          });
        }
      } else {
        // Fallback or other product: standard colors or sizes
        const colors = ["Tiêu chuẩn"];
        for (const color of colors) {
          await db.ProductVariant.create({
            product_id: p.id,
            color,
            stock: p.stock || 50
          });
        }
      }
    }

    console.log("Successfully seeded variants for all products!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding variants:", error);
    process.exit(1);
  }
};

seedVariants();
