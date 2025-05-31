import Feature1 from "@/components/blocks/feature1";
import { Section as SectionType } from "@/types/blocks/section";
import { getTranslations } from "next-intl/server";
import Icon from "@/components/icon";
 

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/about`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/about`;
  }

  return {
    title: t("about.title"),
    description: t("about.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Get introduce section content as about page
  const introduce: SectionType = {
    name: "about",
    title: "About Eson Wang",
    label: "About",
    description: "A undergraduate student at GDUT, whose major is Information Engineering.",
    image: {
      src: "/logo.png"
    },
    items: [
      {
        title: "Education",
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
                2021.09 - 2025.06, School of Information Engineering, Guangdong University of Technology
            </div>
          </div>
        ),
        icon: "RiGraduationCapLine"
      },
      {
        title: "Research",
        description: "Signal Processing and Machine Learning",
        icon: "RiDatabase2Line"
      },
      {
        title: "Skills",
        description: "Python, MATLAB, Deep Learning, Signal Processing",
        icon: "RiCloudyFill"
      }
    ]
  };

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-16">
          <h2 className="mb-2 text-pretty text-3xl font-bold lg:text-4xl">
            {introduce.title}
          </h2>
          <p className="text-muted-foreground md:text-base lg:text-lg">
            {introduce.description}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            {introduce.image && (
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <img
                  src={introduce.image.src}
                  alt={introduce.title}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="flex flex-col gap-6">
              {introduce.items?.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  {item.icon && (
                    <div className="mt-1">
                      <Icon name={item.icon} className="size-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 