"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Button from "@/components/ui/Button";
import FrostedCard from "@/components/ui/FrostedCard";
import StepModule from "@/components/ui/StepModule";
import { InputField, SelectField, TextareaField } from "@/components/ui/FormField";
import { BRANDS_CONTENT } from "@/lib/constants";
import { validateEmail, validateUrl, scrollToElement } from "@/lib/utils";

const valueCardConfig = [
  { icon: "🛡️", chipVariant: "blue" as const, accentTop: "blue" as const },
  { icon: "📈", chipVariant: "violet" as const, accentTop: "violet" as const },
  { icon: "🚀", chipVariant: "lime" as const, accentTop: "lime" as const },
];

export default function BrandsPage() {
  const [formData, setFormData] = useState({
    brandName: "",
    website: "",
    category: "",
    email: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.brandName.trim()) newErrors.brandName = "Marka adı gereklidir";
    if (!formData.website.trim()) {
      newErrors.website = "Website gereklidir";
    } else if (!validateUrl(formData.website)) {
      newErrors.website = "Geçerli bir URL giriniz";
    }
    if (!formData.category) newErrors.category = "Kategori seçiniz";
    if (!formData.email.trim()) {
      newErrors.email = "Email gereklidir";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Geçerli bir email giriniz";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ brandName: "", website: "", category: "", email: "", notes: "" });
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 blob-blue-violet opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="chip-blue text-xs font-semibold px-3 py-1.5 rounded-full inline-block mb-6">
              For Brands
            </span>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              {BRANDS_CONTENT.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-foreground/70">
              {BRANDS_CONTENT.hero.body}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => scrollToElement("application")} variant="primary">
                {BRANDS_CONTENT.hero.cta.primary}
              </Button>
              <Button href="/creators" variant="secondary">
                {BRANDS_CONTENT.hero.cta.secondary}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value cards */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 blob-violet opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
              {BRANDS_CONTENT.value.title}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {BRANDS_CONTENT.value.cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <FrostedCard
                  icon={valueCardConfig[index].icon}
                  chipVariant={valueCardConfig[index].chipVariant}
                  accentTop={valueCardConfig[index].accentTop}
                  hoverLift
                >
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm text-foreground/65 leading-relaxed">
                    {card.description}
                  </p>
                </FrostedCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 blob-blue opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
              {BRANDS_CONTENT.howItWorks.title}
            </h2>
          </motion.div>

          <div className="max-w-md mx-auto">
            <StepModule steps={BRANDS_CONTENT.howItWorks.steps} />
          </div>
        </div>
      </section>

      {/* Use case */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl"
          >
            <FrostedCard accentTop="gradient" hoverLift={false} className="p-10">
              <h2 className="text-3xl font-semibold leading-tight mb-8">
                {BRANDS_CONTENT.useCase.title}
              </h2>
              <ul className="space-y-4">
                {BRANDS_CONTENT.useCase.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-4 text-base">
                    <span className="chip-blue flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </span>
                    <span className="text-foreground/70">{item}</span>
                  </li>
                ))}
              </ul>
            </FrostedCard>
          </motion.div>
        </div>
      </section>

      {/* Application form */}
      <section id="application" className="relative py-20 md:py-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 blob-blue-violet opacity-50" />
        <div className="relative mx-auto max-w-2xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight mb-10">
              {BRANDS_CONTENT.form.title}
            </h2>

            {isSubmitted ? (
              <FrostedCard accentTop="lime" hoverLift={false} className="text-center p-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl chip-lime mx-auto mb-4 text-2xl">
                  ✓
                </div>
                <p className="text-lg font-medium">{BRANDS_CONTENT.form.success}</p>
              </FrostedCard>
            ) : (
              <FrostedCard accentTop="gradient" hoverLift={false} className="p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <InputField
                    label={BRANDS_CONTENT.form.fields.brandName}
                    name="brandName"
                    type="text"
                    value={formData.brandName}
                    onChange={handleChange}
                    error={errors.brandName}
                    required
                  />
                  <InputField
                    label={BRANDS_CONTENT.form.fields.website}
                    name="website"
                    type="url"
                    placeholder="https://"
                    value={formData.website}
                    onChange={handleChange}
                    error={errors.website}
                    required
                  />
                  <SelectField
                    label={BRANDS_CONTENT.form.fields.category}
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={BRANDS_CONTENT.form.categories}
                    error={errors.category}
                    required
                  />
                  <InputField
                    label={BRANDS_CONTENT.form.fields.email}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />
                  <TextareaField
                    label={BRANDS_CONTENT.form.fields.notes}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                  <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Gönderiliyor..." : BRANDS_CONTENT.form.submit}
                  </Button>
                </form>
              </FrostedCard>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}
