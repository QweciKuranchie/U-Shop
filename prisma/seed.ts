// prisma/seed.ts
import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma";

async function main() {
  console.log("=== STARTING MARKETPLACE DATABASE SEED ===");

  // 1. Clean existing data in dependency order
  console.log("Cleaning existing tables...");
  await prisma.kycAccessLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.order.deleteMany();
  await prisma.deliveryAddress.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Institutions
  console.log("Seeding institutions...");
  const ug = await prisma.institution.create({
    data: {
      name: "University of Ghana",
      domains: ["ug.edu.gh", "st.ug.edu.gh"],
      isActive: true,
    },
  });

  const knust = await prisma.institution.create({
    data: {
      name: "Kwame Nkrumah University of Science and Technology",
      domains: ["knust.edu.gh", "st.knust.edu.gh"],
      isActive: true,
    },
  });

  const gimpa = await prisma.institution.create({
    data: {
      name: "Ghana Institute of Management and Public Administration",
      domains: ["gimpa.edu.gh"],
      isActive: true,
    },
  });

  // 3. Seed Users
  console.log("Seeding users...");
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      name: "Richard Nuhu",
      email: "admin@ushop.com",
      role: "admin",
      emailVerified: true,
    },
  });

  // Sellers
  const seller1User = await prisma.user.create({
    data: {
      name: "Emmanuel Mensah",
      email: "seller1@ushop.com",
      role: "seller",
      emailVerified: true,
    },
  });

  const seller2User = await prisma.user.create({
    data: {
      name: "Abena Owusu",
      email: "seller2@ushop.com",
      role: "seller",
      emailVerified: true,
    },
  });

  // Riders
  const rider1User = await prisma.user.create({
    data: {
      name: "Kofi Osei",
      email: "rider1@ushop.com",
      role: "rider",
      emailVerified: true,
    },
  });

  const rider2User = await prisma.user.create({
    data: {
      name: "Ama Serwaa",
      email: "rider2@ushop.com",
      role: "rider",
      emailVerified: true,
    },
  });

  // Buyers
  const buyer1User = await prisma.user.create({
    data: {
      name: "Yaw Boateng",
      email: "buyer1@ushop.com",
      role: "buyer",
      emailVerified: true,
    },
  });

  const buyer2User = await prisma.user.create({
    data: {
      name: "Esi Asare",
      email: "buyer2@ushop.com",
      role: "buyer",
      emailVerified: true,
    },
  });

  // 4. Seed Seller Profiles
  console.log("Seeding seller profiles...");
  const sellerProfile1 = await prisma.sellerProfile.create({
    data: {
      userId: seller1User.id,
      handle: "gadget-zone",
      storeName: "Gadget Zone",
      bio: "Your number one source for premium second-hand campus tech.",
      tagline: "Quality tech at student prices",
      phone: "+233240000001",
      whatsappNumber: "+233240000001",
      campus: "University of Ghana",
      tier: "STUDENT",
      status: "ACTIVE",
      commissionRate: new Prisma.Decimal("0.05"),
      kycDocKeys: ["kyc/student-id-1.jpg", "kyc/ghana-card-1.jpg"],
    },
  });

  const sellerProfile2 = await prisma.sellerProfile.create({
    data: {
      userId: seller2User.id,
      handle: "byte-tech",
      storeName: "Byte Tech Store",
      bio: "Laptops, accessories, and replacement parts directly to your hostel.",
      tagline: "Bytes, bits, and direct delivery",
      phone: "+233240000002",
      whatsappNumber: "+233240000002",
      campus: "KNUST",
      tier: "BUSINESS",
      status: "ACTIVE",
      commissionRate: new Prisma.Decimal("0.05"),
      kycDocKeys: ["kyc/business-reg-2.pdf"],
    },
  });

  // 4b. Seed Delivery Zones
  console.log("Seeding delivery zones...");
  const zoneLegon = await prisma.deliveryZone.create({
    data: { name: "Legon", flatFee: new Prisma.Decimal("15.00"), isActive: true },
  });
  const zoneTesano = await prisma.deliveryZone.create({
    data: { name: "Tesano", flatFee: new Prisma.Decimal("20.00"), isActive: true },
  });
  const zoneEastLegon = await prisma.deliveryZone.create({
    data: { name: "East Legon", flatFee: new Prisma.Decimal("25.00"), isActive: true },
  });
  const zoneMadina = await prisma.deliveryZone.create({
    data: { name: "Madina", flatFee: new Prisma.Decimal("30.00"), isActive: true },
  });

  // 4c. Seed Delivery Addresses
  console.log("Seeding delivery addresses...");
  const buyer1Address = await prisma.deliveryAddress.create({
    data: {
      userId: buyer1User.id,
      zoneId: zoneLegon.id,
      type: "CAMPUS",
      addressText: "Limann Hostel, Room 42",
      landmark: "Near the main gate",
      recipientPhone: "+233241110001",
      isDefault: true,
    },
  });

  const buyer2Address = await prisma.deliveryAddress.create({
    data: {
      userId: buyer2User.id,
      zoneId: zoneEastLegon.id,
      type: "HOME",
      addressText: "Grateful Heart Villa, House 42",
      landmark: "Opposite ECG Substation",
      recipientPhone: "+233241110002",
      isDefault: true,
    },
  });

  // 5. Seed Riders
  console.log("Seeding riders...");
  const rider1 = await prisma.rider.create({
    data: {
      userId: rider1User.id,
      name: rider1User.name,
      phone: "+233245550001",
      zone: "UG Legon Campus",
      isActive: true,
    },
  });

  const rider2 = await prisma.rider.create({
    data: {
      userId: rider2User.id,
      name: rider2User.name,
      phone: "+233245550002",
      zone: "KNUST Campus & environs",
      isActive: true,
    },
  });

  // 6. Seed Products
  console.log("Seeding products...");
  const laptop = await prisma.product.create({
    data: {
      sellerId: sellerProfile1.id,
      title: "MacBook Pro M1 (16GB/512GB)",
      description: "Space Grey, 13-inch MacBook Pro with M1 chip. Battery health 92%. Perfect for CS and engineering students.",
      category: "LAPTOPS",
      condition: "LIKE_NEW",
      vendorPrice: new Prisma.Decimal("4275.00"),
      listingPrice: new Prisma.Decimal("4500.00"), // 5% markup: 4275 / (1 - 0.05) = 4500
      commissionRate: new Prisma.Decimal("0.05"),
      imageS3Keys: ["products/macbook-m1.jpg"],
      status: "ACTIVE",
    },
  });

  const iphone = await prisma.product.create({
    data: {
      sellerId: sellerProfile1.id,
      title: "iPhone 13 128GB Blue",
      description: "Unlocked, minor scratches on side bezel, screen is flawless. Comes with free glass protector.",
      category: "PHONES",
      condition: "GOOD",
      vendorPrice: new Prisma.Decimal("3040.00"),
      listingPrice: new Prisma.Decimal("3200.00"), // 5% markup
      commissionRate: new Prisma.Decimal("0.05"),
      imageS3Keys: ["products/iphone13.jpg"],
      status: "ACTIVE",
    },
  });

  const headphones = await prisma.product.create({
    data: {
      sellerId: sellerProfile2.id,
      title: "Sony WH-1000XM4 Noise Cancelling Headphones",
      description: "Unopened box. Industry-leading noise cancellation, 30-hour battery life. Selling because I got it as a gift.",
      category: "AUDIO",
      condition: "NEW",
      vendorPrice: new Prisma.Decimal("1710.00"),
      listingPrice: new Prisma.Decimal("1800.00"), // 5% markup
      commissionRate: new Prisma.Decimal("0.05"),
      imageS3Keys: ["products/sony-xm4.jpg"],
      status: "ACTIVE",
    },
  });

  const adapter = await prisma.product.create({
    data: {
      sellerId: sellerProfile2.id,
      title: "USB-C to HDMI Adapter 4K",
      description: "Support 4K @ 60Hz. Aluminum shell, durable braided nylon cable. Compatible with MacBooks, iPad Pro, and Windows PCs.",
      category: "ACCESSORIES",
      condition: "NEW",
      vendorPrice: new Prisma.Decimal("95.00"),
      listingPrice: new Prisma.Decimal("100.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      imageS3Keys: ["products/adapter.jpg"],
      status: "ACTIVE",
    },
  });

  // 7. Seed Orders
  console.log("Seeding orders...");
  // Order 1: Completed order (Buyer 1 bought iPhone 13 from Seller 1, delivered by Rider 1)
  await prisma.order.create({
    data: {
      reference: "USH-20260610-004321",
      buyerId: buyer1User.id,
      productId: iphone.id,
      riderId: rider1.id,
      deliveryAddressId: buyer1Address.id,
      vendorPrice: new Prisma.Decimal("3040.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      listingPrice: new Prisma.Decimal("3200.00"),
      deliveryFee: new Prisma.Decimal("15.00"),
      checkoutPrice: new Prisma.Decimal("3215.00"),
      paystackFee: new Prisma.Decimal("60.00"),
      totalCharged: new Prisma.Decimal("3275.00"),
      commissionAmount: new Prisma.Decimal("160.00"),
      sellerReceivable: new Prisma.Decimal("3040.00"),
      paymentMethod: "MOBILE_MONEY",
      paystackReference: "pstk_success_987654321",
      status: "COMPLETED",
      commissionStatus: "CAPTURED",
      deliveryFeeStatus: "PAID_TO_RIDER",
      paidAt: new Date("2026-06-10T09:00:00Z"),
      processedAt: new Date("2026-06-10T10:15:00Z"),
      readyAt: new Date("2026-06-10T11:00:00Z"),
      inTransitAt: new Date("2026-06-10T11:30:00Z"),
      deliveredAt: new Date("2026-06-10T12:15:00Z"),
      completedAt: new Date("2026-06-10T12:20:00Z"),
    },
  });

  // Order 2: Active order (Buyer 2 bought Sony headphones from Seller 2, currently in transit by Rider 2)
  await prisma.order.create({
    data: {
      reference: "USH-20260613-009876",
      buyerId: buyer2User.id,
      productId: headphones.id,
      riderId: rider2.id,
      deliveryAddressId: buyer2Address.id,
      vendorPrice: new Prisma.Decimal("1710.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      listingPrice: new Prisma.Decimal("1800.00"),
      deliveryFee: new Prisma.Decimal("25.00"), // East Legon flat fee
      checkoutPrice: new Prisma.Decimal("1825.00"), // 1800.00 + 25.00
      paystackFee: new Prisma.Decimal("36.09"), // (1825.00 * 0.0195) + 0.50 = 36.0875 -> 36.09
      totalCharged: new Prisma.Decimal("1861.09"), // 1825.00 + 36.09
      commissionAmount: new Prisma.Decimal("90.00"),
      sellerReceivable: new Prisma.Decimal("1710.00"),
      paymentMethod: "CARD",
      paystackReference: "pstk_success_456123789",
      status: "IN_TRANSIT",
      commissionStatus: "PENDING",
      deliveryFeeStatus: "PENDING",
      paidAt: new Date("2026-06-13T01:30:00Z"),
      processedAt: new Date("2026-06-13T02:00:00Z"),
      readyAt: new Date("2026-06-13T02:45:00Z"),
      inTransitAt: new Date("2026-06-13T03:00:00Z"),
    },
  });

  // Order 3: COD Order (Buyer 1 bought Laptop from Seller 1, ready for pickup by Rider 1)
  await prisma.order.create({
    data: {
      reference: "USH-20260613-008123",
      buyerId: buyer1User.id,
      productId: laptop.id,
      riderId: rider1.id,
      deliveryAddressId: buyer1Address.id,
      vendorPrice: new Prisma.Decimal("4275.00"),
      commissionRate: new Prisma.Decimal("0.05"),
      listingPrice: new Prisma.Decimal("4500.00"),
      deliveryFee: new Prisma.Decimal("15.00"), // Legon flat fee
      checkoutPrice: new Prisma.Decimal("4515.00"), // 4500.00 + 15.00
      paystackFee: new Prisma.Decimal("0.00"), // Cash on delivery
      totalCharged: new Prisma.Decimal("4515.00"),
      commissionAmount: new Prisma.Decimal("225.00"),
      sellerReceivable: new Prisma.Decimal("4275.00"),
      paymentMethod: "CASH_ON_DELIVERY",
      status: "READY_FOR_PICKUP",
      commissionStatus: "PENDING",
      deliveryFeeStatus: "PENDING",
      paidAt: null, // To be paid on delivery
      processedAt: new Date("2026-06-13T02:15:00Z"),
      readyAt: new Date("2026-06-13T03:10:00Z"),
    },
  });

  console.log("=== MARKETPLACE DATABASE SEEDED SUCCESSFULLY ===");
}

main()
  .catch((e) => {
    console.error("Fatal error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
