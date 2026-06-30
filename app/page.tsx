import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Logos } from "@/components/logos"
import { Features } from "@/components/features"
import { UseCases } from "@/components/use-cases"
import { HowItWorks } from "@/components/how-it-works"
import { Pricing } from "@/components/pricing"
import { Faq } from "@/components/faq"
import { Cta } from "@/components/cta"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <Logos />
      <Features />
      <UseCases />
      <HowItWorks />
      <Pricing />
      <Faq />
      <Cta />
      <SiteFooter />
    </main>
  )
}
