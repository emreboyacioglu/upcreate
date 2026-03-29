import Link from "next/link";
import UpcreateLogo from "@/components/ui/UpcreateLogo";
import { FOOTER } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <UpcreateLogo size="sm" />
            <p className="mt-3 text-sm text-foreground/60">{FOOTER.about}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">İletişim</h3>
            <a
              href={`mailto:${FOOTER.email}`}
              className="mt-2 block text-sm text-foreground/60 hover:text-accent-blue transition-colors"
            >
              {FOOTER.email}
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Yasal</h3>
            <div className="mt-2 space-y-2">
              <Link
                href="/privacy"
                className="block text-sm text-foreground/60 hover:text-accent-blue transition-colors"
              >
                {FOOTER.legal.privacy}
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-foreground/60 hover:text-accent-blue transition-colors"
              >
                {FOOTER.legal.terms}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-foreground/60">
            © {new Date().getFullYear()} Upcreate. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
