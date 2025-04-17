import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import Pricing from "@/components/blocks/pricing";
import Showcase from "@/components/blocks/showcase";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import Blog from "@/components/blocks/blog";
import BlogShowcase from "@/components/blocks/blog/showcase";
import { getLandingPage } from "@/services/page";
import { getPostsByLocale } from "@/models/post";
import { Blog as BlogType } from "@/types/blocks/blog";
import { getTranslations } from "next-intl/server";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);
  const t = await getTranslations();
  
  // Get the latest 5 blog posts
  const posts = await getPostsByLocale(locale, 1, 5);
  
  // Create blog config if not exist in page data
  if (!page.blog) {
    page.blog = {
      title: "AI SaaS Startups built with ShipAny",
      description: "Latest updates and insights from our blog.",
      items: posts,
      read_more_text: t("blog.read_more_text"),
    };
  } else {
    // Update items with latest posts
    page.blog.items = posts;
  }

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      {page.branding && <Branding section={page.branding} />}
      {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
      {page.feature && <Feature section={page.feature} />}
      {page.showcase && <Showcase section={page.showcase} />}
      {page.blog && <BlogShowcase blog={page.blog} />}
      {page.stats && <Stats section={page.stats} />}
      {page.pricing && <Pricing pricing={page.pricing} />}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
