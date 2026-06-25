import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";

interface Props {
  params: Promise<{ handle: string }>;
}

const S3_BASE_URL = `https://${process.env.S3_PRODUCT_BUCKET || process.env.AWS_S3_PRODUCT_IMAGES_BUCKET || "ushop-product-images-01"}.s3.${(process.env.AWS_REGION || "us-east-1").replace(/^.*\s/, "")}.amazonaws.com`;

export default async function StorefrontPage({ params }: Props) {
  const { handle } = await params;

  // ── Fetch seller profile — explicitly exclude contact fields ────
  const profile = await prisma.sellerProfile.findUnique({
    where: { handle },
    select: {
      id: true,
      storeName: true,
      handle: true,
      bio: true,
      tagline: true,
      profilePhotoKey: true,
      coverImageKey: true,
      campus: true,
      tier: true,
      status: true,
      createdAt: true,
      // NEVER: whatsappNumber, phone, user.email
    },
  });

  // ── 404 if not found or not ACTIVE ──────────────────────────────
  if (!profile || profile.status !== "ACTIVE") {
    notFound();
  }

  // ── Fetch products for this seller ──────────────────────────────
  const products = await prisma.product.findMany({
    where: {
      sellerId: profile.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      listingPrice: true,
      category: true,
      condition: true,
      imageS3Keys: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const tierLabels: Record<string, string> = {
    STUDENT: "🎓 Student Seller",
    BUSINESS: "🏢 Business Seller",
    INDIVIDUAL: "👤 Individual Seller",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <Logo size="md" lightMode={false} />
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Store Header */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-grow w-full z-10">
        {/* Cover / Profile Section */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden mb-10">
          {/* Cover gradient placeholder */}
          <div className="h-40 bg-gradient-to-r from-brand-purple/30 via-brand-pink/20 to-brand-purple/30" />

          <div className="px-8 pb-8 -mt-10">
            {/* Avatar placeholder */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-3xl font-black text-white shadow-xl border-4 border-slate-950">
              {profile.storeName.charAt(0).toUpperCase()}
            </div>

            <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-display font-black text-3xl text-white">
                  {profile.storeName}
                </h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-brand-pink font-semibold">
                    @{profile.handle}
                  </span>
                  <span className="text-xs text-slate-500">
                    {tierLabels[profile.tier] || profile.tier}
                  </span>
                  {profile.campus && (
                    <span className="text-xs text-slate-500">📍 {profile.campus}</span>
                  )}
                </div>
                {profile.tagline && (
                  <p className="text-sm text-slate-400 mt-2 font-light">{profile.tagline}</p>
                )}
              </div>

              <div className="text-xs text-slate-500">
                Member since {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-slate-400 mt-4 font-light leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-white">
            Listings ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-16 text-center">
            <p className="text-slate-500 font-light">
              No products listed yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => {
              const imageKeys = product.imageS3Keys as string[];
              const hasImage = imageKeys.length > 0;
              const imageUrl = hasImage ? `${S3_BASE_URL}/${imageKeys[0]}` : null;

              return (
                <div
                  key={product.id}
                  className="group bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple/40 hover:shadow-xl hover:shadow-brand-purple/5 transition-all duration-300"
                >
                  <div className="h-48 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <span className="text-slate-600 text-xs uppercase tracking-widest">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1 block">
                      {product.condition.replace("_", " ")}
                    </span>
                    <h3 className="font-display font-bold text-base text-white line-clamp-1 mb-3">
                      {product.title}
                    </h3>
                    <div className="flex items-end justify-between pt-2 border-t border-white/5">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Price</span>
                        <span className="font-display font-black text-lg text-white">
                          GH₵ {Number(product.listingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
