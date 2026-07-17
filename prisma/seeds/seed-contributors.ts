import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Daftar user CMS dengan role CONTRIBUTOR.
// Password default: contributor123 (ganti setelah login pertama).
const contributors = [
  {
    username: "contributor1",
    email: "contributor1@lakuna.foto",
    realName: "Contributor Satu",
  },
  {
    username: "contributor2",
    email: "contributor2@lakuna.foto",
    realName: "Contributor Dua",
  },
  {
    username: "contributor3",
    email: "contributor3@lakuna.foto",
    realName: "Contributor Tiga",
  },
];

async function main() {
  console.log("🌱 Seeding CMS contributor users...\n");

  const password = bcrypt.hashSync("contributor123", 10);

  for (const c of contributors) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { role: "CONTRIBUTOR", realName: c.realName },
      create: {
        username: c.username,
        email: c.email,
        password,
        realName: c.realName,
        role: "CONTRIBUTOR",
      },
    });
    console.log(`✓ Contributor created/updated: ${user.email} (password: contributor123)`);
  }

  console.log(`\n✅ ${contributors.length} contributor users ready!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());