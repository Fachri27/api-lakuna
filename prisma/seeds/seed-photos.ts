import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const samplePhotos = [
  {
    title: "Hutan hujan tropis Sumatera",
    photographer: "Yudi Nofiandi",
    price: 150000,
    description: "Hutan alam yang masih dijaga di wilayah Sumatera",
  },
  {
    title: "Pemandangan sungai di Kalimantan",
    photographer: "Andi Pratama",
    price: 250000,
    description: "Sungai berkelok di hutan Kalimantan",
  },
  {
    title: "Kebun binatang Papua",
    photographer: "Sari Dewi",
    price: 500000,
    description: "Flora dan fauna khas Papua",
  },
  {
    title: "Pantai Sulawesi",
    photographer: "Budi Santoso",
    price: 150000,
    description: "Pantai dengan pasir putih di Sulawesi",
  },
];

async function main() {
  console.log("Seeding photos...");
  
  // Buat user admin dulu kalau belum ada
  let user = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@lakuna.foto",
        password: "$2b$10$placeholder", // akan diganti
        name: "Admin",
        role: "ADMIN",
      }
    });
  }
  
  // Buat photos dengan key dummy
  for (const photo of samplePhotos) {
    await prisma.photo.create({
      data: {
        ...photo,
        userId: user.id,
        thumbKey: `thumb/${Math.random().toString(36).substring(7)}.jpg`,
        originalKey: `original/${Math.random().toString(36).substring(7)}.jpg`,
        watermarkKey: `watermark/${Math.random().toString(36).substring(7)}.jpg`,
        width: 1920,
        height: 1080,
        format: "jpeg",
      }
    });
  }
  
  console.log("Seed complete!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());