import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Creator Commerce",
  description: "Creator Commerce gizlilik politikası",
};

export default function PrivacyPage() {
  return (
    <div className="py-20 md:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Gizlilik Politikası</h1>
        <div className="prose prose-lg">
          <p className="text-foreground/70">
            Gizlilik politikası içeriği buraya eklenecektir.
          </p>
        </div>
      </div>
    </div>
  );
}
