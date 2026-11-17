import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.contribution.deleteMany();
  await prisma.event.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@wfc.or.tz",
      password: "admin123", // In production use bcrypt
      name: "Mwenyekiti WFC",
      role: "ADMIN",
    },
  });

  // Create sample members
  const members = await Promise.all([
    prisma.member.create({
      data: {
        wfcId: "WFC-0001",
        firstName: "John",
        lastName: "Mwakipesile",
        phone: "0712345678",
        email: "john@wfc.or.tz",
        region: "Dar es Salaam",
        status: "ACTIVE",
      },
    }),
    prisma.member.create({
      data: {
        wfcId: "WFC-0002",
        firstName: "Anna",
        lastName: "Shao",
        phone: "0755123456",
        region: "Arusha",
        status: "ACTIVE",
      },
    }),
    prisma.member.create({
      data: {
        wfcId: "WFC-0003",
        firstName: "Peter",
        lastName: "Mmari",
        phone: "0787654321",
        region: "Moshi",
        status: "ACTIVE",
      },
    }),
    prisma.member.create({
      data: {
        wfcId: "WFC-0004",
        firstName: "Grace",
        lastName: "Urio",
        region: "Dar es Salaam",
        status: "SUSPENDED",
      },
    }),
  ]);

  // Sample contributions
  await prisma.contribution.createMany({
    data: [
      { memberId: members[0].id, type: "Ada ya mwezi", amount: 10000, month: "2026-11", method: "M-Pesa", status: "CONFIRMED", paidAt: new Date() },
      { memberId: members[1].id, type: "Kiingilio", amount: 50000, method: "Tigo Pesa", status: "CONFIRMED", paidAt: new Date() },
      { memberId: members[2].id, type: "Dharura", amount: 60000, method: "Airtel Money", status: "CONFIRMED", paidAt: new Date() },
    ],
  });

  // Sample events
  await prisma.event.createMany({
    data: [
      { type: "Msiba", title: "Msiba wa Familia ya Mwakipesile", location: "Dar es Salaam", targetAmount: 500000, raisedAmount: 320000, status: "ACTIVE", reporterId: members[0].id },
      { type: "Harusi", title: "Harusi ya Anna Shao", location: "Arusha", targetAmount: 300000, raisedAmount: 150000, status: "ACTIVE" },
    ],
  });

  // Announcements
  await prisma.announcement.createMany({
    data: [
      { title: "Mkutano Mkuu wa Mwaka", body: "Tarehe 15 Desemba 2026, Ukumbi wa WFC Dar es Salaam." },
      { title: "Ada ya Mwezi wa Novemba", body: "Mwisho wa malipo ni tarehe 30 Novemba 2026." },
    ],
  });

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
