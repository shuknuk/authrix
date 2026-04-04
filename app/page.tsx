import { redirect } from "next/navigation";
import { PublicNav } from "@/components/marketing/public-nav";
import { Hero } from "@/components/marketing/hero";
import { ProductProof } from "@/components/marketing/product-proof";
import { ProductShowcaseSection } from "@/components/marketing/product-showcase-section";
import { SpecialistRolesSection } from "@/components/marketing/specialist-roles-section";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { WorkflowSection } from "@/components/marketing/workflow-section";
import { GovernanceSection } from "@/components/marketing/governance-section";
import { CTASection } from "@/components/marketing/cta-section";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--ivory)]">
      <PublicNav authReady={isAuthConfigured} />
      <Hero authReady={isAuthConfigured} />
      <TrustStrip />
      <ProductProof />
      <SpecialistRolesSection />
      <ProductShowcaseSection />
      <WorkflowSection />
      <GovernanceSection />
      <CTASection />
    </div>
  );
}
