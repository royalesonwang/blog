import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import SignToggle from "@/components/sign/toggle";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-16">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p>
                {footer.copyright}
                {process.env.NEXT_PUBLIC_SHOW_POWERED_BY === "false" ? null : (
                  <a
                    href="https://shipany.ai"
                    target="_blank"
                    className="px-2 text-primary"
                  >
                    build with ShipAny
                  </a>
                )}
              </p>
            )}
            <div className="flex justify-center items-center gap-4">
              {footer.social && (
                <ul className="flex items-center space-x-6 text-muted-foreground">
                  {footer.social.items?.map((item, i) => (
                    <li key={i} className="font-medium hover:text-primary">
                      <a href={item.url} target={item.target}>
                        {item.icon && (
                          <Icon name={item.icon} className="size-4" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {footer.show_sign && <SignToggle />}
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
