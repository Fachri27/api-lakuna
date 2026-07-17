import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Restoring seed data...\n");

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@lakuna.foto",
      password: bcrypt.hashSync("admin123", 10),
      realName: "Admin Lakuna Foto",
      role: "ADMIN",
    },
  });
  console.log("✓ Admin user created:", admin.email, "(password: admin123)");

  const user = await prisma.user.create({
    data: {
      username: "testuser",
      email: "test@example.com",
      password: bcrypt.hashSync("test123", 10),
      realName: "Test User",
      role: "USER",
    },
  });
  console.log("✓ Test user created:", user.email, "(password: test123)");

  const photographers = ["Yudi Nofiandi", "Andi Pratama", "Sari Dewi", "Budi Santoso"];
  for (const name of photographers) {
    await prisma.photographer.create({ data: { name } });
  }
  console.log("✓ 4 photographers created");

  const categories = [
    { name: "Landscape", description: "Landscape photography" },
    { name: "Nature", description: "Nature and wildlife" },
    { name: "Urban", description: "City and architecture" },
    { name: "Portrait", description: "People and portraits" },
  ];
  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }
  console.log("✓ 4 categories created");

  const keywords = ["sunset", "mountain", "beach", "forest", "city", "people"];
  for (const name of keywords) {
    await prisma.keyword.create({ data: { name } });
  }
  console.log("✓ 6 keywords created");

  const samplePhotos = [
    { title: "Hutan hujan tropis Sumatera", photographer: "Yudi Nofiandi", price: 150000, description: "Hutan alam yang masih dijaga di wilayah Sumatera" },
    { title: "Pemandangan sungai di Kalimantan", photographer: "Andi Pratama", price: 250000, description: "Sungai berkelok di hutan Kalimantan" },
    { title: "Kebun binatang Papua", photographer: "Sari Dewi", price: 500000, description: "Flora dan fauna khas Papua" },
    { title: "Pantai Sulawesi", photographer: "Budi Santoso", price: 150000, description: "Pantai dengan pasir putih di Sulawesi" },
    { title: "Gunung Rinjani", photographer: "Yudi Nofiandi", price: 350000, description: "Pemandangan matahari terbit di puncak Rinjani" },
    { title: "Candi Borobudur", photographer: "Andi Pratama", price: 200000, description: "Candi megah saat golden hour" },
  ];

  for (const p of samplePhotos) {
    await prisma.photo.create({
      data: {
        title: p.title,
        description: p.description,
        photographer: p.photographer,
        price: p.price,
        type: "FOTO",
        width: 1920,
        height: 1080,
        format: "jpeg",
        userId: admin.id,
        originalKey: `original/${crypto.randomUUID()}.jpg`,
        thumbKey: `thumb/${crypto.randomUUID()}.jpg`,
        watermarkKey: `watermark/${crypto.randomUUID()}.jpg`,
        status: "APPROVED",
      },
    });
  }
  console.log(`✓ ${samplePhotos.length} photos created (APPROVED)`);

  await prisma.plan.create({
    data: { quota: 10, priceMonthly: 100000, priceAnnual: 1000000, isActive: true },
  });
  await prisma.plan.create({
    data: { quota: 30, priceMonthly: 250000, priceAnnual: 2500000, isActive: true },
  });
  await prisma.plan.create({
    data: { quota: 100, priceMonthly: 500000, priceAnnual: 5000000, isActive: true },
  });
  console.log("✓ 3 plans created");

  console.log("\n✅ Seed restore complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
