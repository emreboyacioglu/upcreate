import Hero from "@/components/sections/Hero";
import Intro from "@/components/sections/Intro";
import ProblemSection from "@/components/sections/ProblemSection";
import SolutionSection from "@/components/sections/SolutionSection";
import PlatformSection from "@/components/sections/PlatformSection";
import SplitCTA from "@/components/sections/SplitCTA";
import FinalStatement from "@/components/sections/FinalStatement";

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <ProblemSection />
      <SolutionSection />
      <PlatformSection />
      <SplitCTA />
      <FinalStatement />
    </>
  );
}
