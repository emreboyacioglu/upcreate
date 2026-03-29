import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | Creator Commerce",
  description: "Creator Commerce kullanım koşulları",
};

export default function TermsPage() {
  return (
    <div className="py-20 md:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Kullanım Koşulları</h1>
        <div className="prose prose-lg">
          <p className="text-foreground/70">
            Kullanım koşulları içeriği buraya eklenecektir.
          </p>
        </div>
      </div>
    </div>
  );
}
