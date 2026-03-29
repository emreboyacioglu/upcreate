import {
  PrismaClient,
  Platform,
  CampaignCreatorStatus,
  CreatorScale,
  UserRole,
  WorkflowScope,
} from "@prisma/client";
import { DEFAULTS_BY_SCOPE } from "../src/business/workflowDefaults";
import bcrypt from "bcryptjs";
import { matchingService } from "../src/business/MatchingService";

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("Seeding database...");

  await prisma.auditLog.deleteMany();
  await prisma.workflowDefinition.deleteMany();

  await prisma.conversion.deleteMany();
  await prisma.clickEvent.deleteMany();
  await prisma.affiliateLink.deleteMany();
  await prisma.campaignContent.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.campaignCreator.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.brandCreatorFit.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.paymentInfo.deleteMany();
  await prisma.commerceScore.deleteMany();
  await prisma.accountMetrics.deleteMany();
  await prisma.contentPost.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.creator.deleteMany();

  const elif = await prisma.creator.create({
    data: {
      name: "Elif Yılmaz",
      email: "elif@mail.com",
      avatarUrl: "https://picsum.photos/seed/elif/200",
      bio: "Istanbul based fashion & lifestyle",
      creatorScale: CreatorScale.MID,
      lastPostAt: daysAgo(2),
    },
  });

  const can = await prisma.creator.create({
    data: {
      name: "Can Öztürk",
      email: "can@mail.com",
      avatarUrl: "https://picsum.photos/seed/can/200",
      bio: "Turkish food explorer | Istanbul & beyond",
      creatorScale: CreatorScale.MICRO,
      lastPostAt: daysAgo(5),
    },
  });

  const zeynep = await prisma.creator.create({
    data: {
      name: "Zeynep Kaya",
      email: "zeynep@mail.com",
      avatarUrl: "https://picsum.photos/seed/zeynep/200",
      bio: "Tech reviews & unboxings in Turkish",
      creatorScale: CreatorScale.MID,
      lastPostAt: daysAgo(1),
    },
  });

  const demoHash = await bcrypt.hash("demo12345", 10);

  await prisma.appUser.createMany({
    data: [
      { email: "elif@mail.com", passwordHash: demoHash, role: UserRole.CREATOR, creatorId: elif.id },
      { email: "can@mail.com", passwordHash: demoHash, role: UserRole.CREATOR, creatorId: can.id },
      { email: "zeynep@mail.com", passwordHash: demoHash, role: UserRole.CREATOR, creatorId: zeynep.id },
    ],
  });

  await prisma.appUser.create({
    data: {
      email: "admin@upcreate.demo",
      passwordHash: demoHash,
      role: UserRole.ADMIN,
    },
  });

  for (const scope of Object.values(WorkflowScope)) {
    await prisma.workflowDefinition.create({
      data: {
        scope,
        version: 1,
        isActive: true,
        definition: DEFAULTS_BY_SCOPE[scope] as object,
      },
    });
  }

  await prisma.paymentInfo.create({
    data: {
      creatorId: elif.id,
      bankName: "Garanti BBVA",
      iban: "TR330006100519786457841326",
      accountHolder: "Elif Yılmaz",
      taxId: "12345678901",
    },
  });

  await prisma.paymentInfo.create({
    data: {
      creatorId: zeynep.id,
      bankName: "İş Bankası",
      iban: "TR180006400000168540160138",
      accountHolder: "Zeynep Kaya",
      notes: "Prefers monthly batch payments",
    },
  });

  const elifIG = await prisma.socialAccount.create({
    data: {
      creatorId: elif.id,
      platform: Platform.INSTAGRAM,
      username: "elif.style",
      profileUrl: "https://instagram.com/elif.style",
      followerCount: 185000,
      isConnected: true,
    },
  });

  const elifTK = await prisma.socialAccount.create({
    data: {
      creatorId: elif.id,
      platform: Platform.TIKTOK,
      username: "elifstyle",
      profileUrl: "https://tiktok.com/@elifstyle",
      followerCount: 95000,
      isConnected: true,
    },
  });

  const canIG = await prisma.socialAccount.create({
    data: {
      creatorId: can.id,
      platform: Platform.INSTAGRAM,
      username: "can.eats",
      profileUrl: "https://instagram.com/can.eats",
      followerCount: 92000,
      isConnected: true,
    },
  });

  const zeynepTK = await prisma.socialAccount.create({
    data: {
      creatorId: zeynep.id,
      platform: Platform.TIKTOK,
      username: "zeyneptech",
      profileUrl: "https://tiktok.com/@zeyneptech",
      followerCount: 310000,
      isConnected: false,
    },
  });

  const zeynepIG = await prisma.socialAccount.create({
    data: {
      creatorId: zeynep.id,
      platform: Platform.INSTAGRAM,
      username: "zeynep.tech",
      profileUrl: "https://instagram.com/zeynep.tech",
      followerCount: 45000,
      isConnected: true,
    },
  });

  const postTemplates: {
    accountId: string;
    platform: Platform;
    captions: string[];
    likesRange: [number, number];
    commentsRange: [number, number];
    viewsRange: [number, number];
  }[] = [
    {
      accountId: elifIG.id,
      platform: Platform.INSTAGRAM,
      captions: [
        "Spring collection haul #fashion #istanbul",
        "My go-to everyday look #ootd #style",
        "Sunset at Karaköy #istanbul #lifestyle",
        "New collab dropping soon! Stay tuned",
        "Morning skincare routine #beauty #skincare",
        "Vintage finds in Çukurcuma #thrift #vintage",
        "Coffee & outfits — my two essentials",
        "Travel capsule wardrobe tips #travel #fashion",
      ],
      likesRange: [4200, 12500],
      commentsRange: [180, 620],
      viewsRange: [28000, 95000],
    },
    {
      accountId: elifTK.id,
      platform: Platform.TIKTOK,
      captions: [
        "Get ready with me — spring edition",
        "3 outfits from 1 blazer #styling",
        "Istanbul thrift haul #thriftflip",
        "What I wore this week #ootd",
        "Packing for a weekend trip #travel",
      ],
      likesRange: [6000, 25000],
      commentsRange: [250, 900],
      viewsRange: [50000, 200000],
    },
    {
      accountId: canIG.id,
      platform: Platform.INSTAGRAM,
      captions: [
        "Best kokoreç in Kadıköy #turkishfood",
        "Hidden gem: home-style mantı #foodie",
        "Breakfast spread goals #kahvaltı",
        "Street food tour: Balık Ekmek edition",
        "Tasting 5 baklavas in one day #dessert",
        "Where to eat in Beşiktaş",
        "Late night lahmacun run #latenight",
      ],
      likesRange: [2100, 6800],
      commentsRange: [95, 380],
      viewsRange: [15000, 52000],
    },
    {
      accountId: zeynepTK.id,
      platform: Platform.TIKTOK,
      captions: [
        "iPhone vs Samsung — honest comparison",
        "Budget gaming setup under 5000TL",
        "Unboxing the new MacBook Air",
        "Best wireless earbuds 2026 ranking",
        "Smart home tour — full Turkish setup",
        "Is this robot vacuum worth it?",
        "Tech fails compilation #techfail",
        "My coding desk setup tour",
      ],
      likesRange: [8500, 45000],
      commentsRange: [320, 1800],
      viewsRange: [120000, 680000],
    },
    {
      accountId: zeynepIG.id,
      platform: Platform.INSTAGRAM,
      captions: [
        "Desk setup flat lay #tech #aesthetic",
        "Top 5 apps for productivity",
        "Behind the scenes of my studio",
        "Gadget haul — what's worth it?",
        "Work from home essentials #wfh",
      ],
      likesRange: [1200, 4500],
      commentsRange: [60, 250],
      viewsRange: [8000, 35000],
    },
  ];

  for (const tpl of postTemplates) {
    const posts = tpl.captions.map((caption, i) => ({
      accountId: tpl.accountId,
      postId: `post_${tpl.accountId}_${i}`,
      caption,
      mediaType: tpl.platform === "TIKTOK" ? "VIDEO" : i % 3 === 0 ? "VIDEO" : "IMAGE",
      likes: randomInt(...tpl.likesRange),
      commentsCount: randomInt(...tpl.commentsRange),
      views: randomInt(...tpl.viewsRange),
      postedAt: daysAgo(randomInt(1, 28)),
    }));

    await prisma.contentPost.createMany({ data: posts });
  }

  const brand = await prisma.brand.create({
    data: {
      name: "Modanisa",
      website: "https://modanisa.com",
      category: "Fashion & Modest Wear",
      email: "partnerships@modanisa.com",
      notes: "Leading modest fashion e-commerce platform in Turkey",
    },
  });

  await prisma.appUser.create({
    data: {
      email: "brand@modanisa.demo",
      passwordHash: demoHash,
      role: UserRole.BRAND,
      brandId: brand.id,
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      title: "Modanisa Summer 2026 Creator Campaign",
      status: "ACTIVE",
      budget: 50000,
      brief:
        "Looking for fashion and lifestyle creators to showcase our Summer 2026 collection. Target audience: women 18-35 in Turkey.",
      productInfo: JSON.stringify({ sku: "SUM26", category: "modest-wear", landing: "https://modanisa.com/summer" }),
      commissionRate: 12.5,
      startsAt: daysAgo(30),
      endsAt: daysAgo(-60),
    },
  });

  const ccElif = await prisma.campaignCreator.create({
    data: {
      campaignId: campaign.id,
      creatorId: elif.id,
      status: CampaignCreatorStatus.MATCHED,
    },
  });

  const ccZeynep = await prisma.campaignCreator.create({
    data: {
      campaignId: campaign.id,
      creatorId: zeynep.id,
      status: CampaignCreatorStatus.AWAITING_CREATOR,
    },
  });

  await prisma.affiliateLink.create({
    data: {
      campaignCreatorId: ccElif.id,
      code: "demoelif",
      destinationUrl: "https://modanisa.com/?ref=demoelif",
      active: true,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        campaignCreatorId: ccElif.id,
        type: "COMMISSION",
        status: "PAID",
        amount: 5000,
        currency: "TRY",
        description: "Initial collaboration fee",
        paidAt: daysAgo(7),
      },
      {
        campaignCreatorId: ccElif.id,
        type: "COMMISSION",
        status: "APPROVED",
        amount: 3500,
        currency: "TRY",
        description: "Story series commission",
      },
      {
        campaignCreatorId: ccElif.id,
        type: "BONUS",
        status: "PENDING",
        amount: 1500,
        currency: "TRY",
        description: "Performance bonus — exceeded engagement target",
      },
      {
        campaignCreatorId: ccZeynep.id,
        type: "COMMISSION",
        status: "PENDING",
        amount: 4000,
        currency: "TRY",
        description: "Tech review post commission",
      },
    ],
  });

  console.log("Calculating scores for seeded creators...");
  const creators = [elif, can, zeynep];
  for (const creator of creators) {
    await matchingService.refreshCreatorIntelligence(creator.id);
    await matchingService.computeAndStoreBrandCreatorFit(brand.id, creator.id);
    console.log(`  ✓ ${creator.name} scored + intelligence`);
  }

  const scoredCreators = await prisma.creator.findMany({
    include: {
      accounts: { include: { metrics: true } },
      commerceScore: true,
    },
    orderBy: { commerceScore: { commerceScore: "desc" } },
  });

  console.log("\nSeeded creators:");
  for (const c of scoredCreators) {
    const totalFollowers = c.accounts.reduce((sum, a) => sum + a.followerCount, 0);
    const platforms = c.accounts.map((a) => `${a.platform}:@${a.username}`).join(", ");
    console.log(
      `  ${c.name} [${platforms}] — scale: ${c.creatorScale ?? "n/a"}, total followers: ${totalFollowers}, commerce_score: ${c.commerceScore?.commerceScore.toFixed(4) ?? "n/a"}`,
    );
  }

  const txCount = await prisma.transaction.count();
  console.log(`\nSeeded ${txCount} transactions across campaign creators.`);
  console.log("Demo admin login: admin@upcreate.demo / demo12345");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
