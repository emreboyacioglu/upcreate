"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Button from "@/components/ui/Button";
import FrostedCard from "@/components/ui/FrostedCard";
import StepModule from "@/components/ui/StepModule";
import { InputField, SelectField } from "@/components/ui/FormField";
import { CREATORS_CONTENT } from "@/lib/constants";
import { validateEmail, validateUrl, scrollToElement } from "@/lib/utils";

const benefitCardConfig = [
  { icon: "💰", chipVariant: "lime" as const, accentTop: "lime" as const },
  { icon: "🤝", chipVariant: "blue" as const, accentTop: "blue" as const },
  { icon: "📊", chipVariant: "violet" as const, accentTop: "violet" as const },
];

export default function CreatorsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    instagram: "",
    tiktok: "",
    category: "",
    followers: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "İsim gereklidir";
    if (!formData.email.trim()) {
      newErrors.email = "Email gereklidir";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Geçerli bir email giriniz";
    }
    if (!formData.instagram.trim()) {
      newErrors.instagram = "Instagram linki gereklidir";
    } else if (!validateUrl(formData.instagram)) {
      newErrors.instagram = "Geçerli bir URL giriniz";
    }
    if (formData.tiktok && !validateUrl(formData.tiktok)) {
      newErrors.tiktok = "Geçerli bir URL giriniz";
    }
    if (!formData.category) newErrors.category = "Kategori seçiniz";
    if (!formData.followers) newErrors.followers = "Takipçi sayısı seçiniz";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: "", email: "", instagram: "", tiktok: "", category: "", followers: "" });
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            <span className="chip-violet text-xs font-semibold px-3 py-1.5 rounded-full inline-block mb-6">
              For Creators
            </span>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              {CREATORS_CONTENT.hero.title.line1}
              <br />
              <span
                className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent"
              >
                {CREATORS_CONTENT.hero.title.line2}
              </span>
            </h1>
            <div className="mt-10">
              <Button onClick={() => scrollToElement("application")} variant="primary">
                {CREATORS_CONTENT.hero.cta}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 blob-lime opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
              {CREATORS_CONTENT.benefits.title}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {CREATORS_CONTENT.benefits.cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <FrostedCard
                  icon={benefitCardConfig[index].icon}
                  chipVariant={benefitCardConfig[index].chipVariant}
                  accentTop={benefitCardConfig[index].accentTop}
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
        <div className="pointer-events-none absolute inset-0 blob-violet opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
              {CREATORS_CONTENT.howItWorks.title}
            </h2>
          </motion.div>

          <div className="max-w-md mx-auto">
            <StepModule
              steps={CREATORS_CONTENT.howItWorks.steps.map((s) => ({
                number: s.number,
                title: s.title,
                description: "",
              }))}
              accentColors={["violet", "blue", "lime"]}
            />
          </div>
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
              {CREATORS_CONTENT.form.title}
            </h2>

            {isSubmitted ? (
              <FrostedCard accentTop="violet" hoverLift={false} className="text-center p-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl chip-violet mx-auto mb-4 text-2xl">
                  ✓
                </div>
                <p className="text-lg font-medium">{CREATORS_CONTENT.form.success}</p>
              </FrostedCard>
            ) : (
              <FrostedCard accentTop="gradient" hoverLift={false} className="p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <InputField
                    label={CREATORS_CONTENT.form.fields.name}
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                  />
                  <InputField
                    label={CREATORS_CONTENT.form.fields.email}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />
                  <InputField
                    label={CREATORS_CONTENT.form.fields.instagram}
                    name="instagram"
                    type="url"
                    placeholder="https://instagram.com/username"
                    value={formData.instagram}
                    onChange={handleChange}
                    error={errors.instagram}
                    required
                  />
                  <InputField
                    label={CREATORS_CONTENT.form.fields.tiktok}
                    name="tiktok"
                    type="url"
                    placeholder="https://tiktok.com/@username"
                    value={formData.tiktok}
                    onChange={handleChange}
                    error={errors.tiktok}
                  />
                  <SelectField
                    label={CREATORS_CONTENT.form.fields.category}
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={CREATORS_CONTENT.form.categories}
                    error={errors.category}
                    required
                  />
                  <SelectField
                    label={CREATORS_CONTENT.form.fields.followers}
                    name="followers"
                    value={formData.followers}
                    onChange={handleChange}
                    options={CREATORS_CONTENT.form.followerRanges}
                    error={errors.followers}
                    required
                  />
                  <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Gönderiliyor..." : CREATORS_CONTENT.form.submit}
                  </Button>
                </form>
              </FrostedCard>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-semibold leading-tight mb-8">
              {CREATORS_CONTENT.faq.title}
            </h2>
            <div className="space-y-4">
              {CREATORS_CONTENT.faq.items.map((item, index) => (
                <FrostedCard key={index} accentTop={index === 0 ? "blue" : "violet"} hoverLift={false}>
                  <h3 className="text-base font-semibold">{item.question}</h3>
                  <p className="mt-1 text-sm text-foreground/65">{item.answer}</p>
                </FrostedCard>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
