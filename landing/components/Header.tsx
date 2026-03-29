"use client";

import { useState } from "react";
import Link from "next/link";
import UpcreateLogo from "@/components/ui/UpcreateLogo";
import { NAVIGATION } from "@/lib/constants";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 frosted">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex lg:flex-1">
          <UpcreateLogo size="md" />
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-12">
          <Link
            href="/brands"
            className="text-base font-medium leading-6 text-foreground/70 transition-colors hover:text-accent-blue"
          >
            {NAVIGATION.brands}
          </Link>
          <Link
            href="/creators"
            className="text-base font-medium leading-6 text-foreground/70 transition-colors hover:text-accent-violet"
          >
            {NAVIGATION.creators}
          </Link>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden frosted border-t border-border/20">
          <div className="space-y-2 px-6 pb-6 pt-2">
            <Link
              href="/brands"
              className="-mx-3 block rounded-xl px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-accent-blue/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              {NAVIGATION.brands}
            </Link>
            <Link
              href="/creators"
              className="-mx-3 block rounded-xl px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-accent-violet/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              {NAVIGATION.creators}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
