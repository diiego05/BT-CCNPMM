import db from "./src/models/index.js";

const seedOrders = async () => {
  try {
    // 1. Find the target user
    let user = await db.User.findOne({ order: [['id', 'DESC']] });
    if (!user) {
      console.error("No users found in database to attach orders to!");
      process.exit(1);
    }
    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // 2. Find some products to add to the orders
    const products = await db.Product.findAll({ limit: 3 });
    if (products.length === 0) {
      console.error("No products found in database to create order items!");
      process.exit(1);
    }
    console.log(`Found ${products.length} products to use.`);

    // 3. Clear existing orders for this user to start fresh (or keep them, but let's just add new ones)
    // The user requested: "thêm một vài đơn hàng ở các trạng thái sau đơn hàng mới, 2. Đã xác nhận đơn hàng, 3. Shop đang chuẩn bị hàng, 4. Đang giao hàng, 5. Đã giao thành công, 6. Hủy đơn hàng."
    const statuses = [
      { status: 1, label: "Đơn hàng mới" },
      { status: 2, label: "Đã xác nhận đơn hàng" },
      { status: 3, label: "Shop đang chuẩn bị hàng" },
      { status: 4, label: "Đang giao hàng" },
      { status: 5, label: "Đã giao thành công" },
      { status: 6, label: "Hủy đơn hàng" }
    ];

    for (const s of statuses) {
      // Pick a random product
      const prod = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2
      const totalPrice = Number(prod.price) * quantity;

      const order = await db.Order.create({
        user_id: user.id,
        full_name: user.username || "Nguyễn Văn Vy",
        phone: "0987654321",
        address: "123 Đường Sư Vạn Hạnh, Quận 10, TP. Hồ Chí Minh",
        note: `Đơn hàng demo trạng thái: ${s.label}`,
        total_price: totalPrice,
        payment_method: "COD",
        status: s.status
      });

      await db.OrderItem.create({
        order_id: order.id,
        product_id: prod.id,
        quantity: quantity,
        price: prod.price
      });

      console.log(`Created order ID ${order.id} with status ${s.status} (${s.label})`);
    }

    console.log("All dummy orders seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding orders:", err);
    process.exit(1);
  }
};

seedOrders();
