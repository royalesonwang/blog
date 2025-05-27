import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import SignToggle from "@/components/sign/toggle";
import FooterSubscribeForm from "@/components/subscribe/footer-form";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-10">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="border-t pt-6">
            {/* 移动端：垂直布局 */}
            <div className="lg:hidden flex flex-col gap-6">
              {/* 版权信息 */}
              {footer.copyright && (
                <p className="text-center text-sm font-medium text-muted-foreground">
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
              
              {/* 订阅表单 */}
              {footer.show_subscribe && (
                <div className="w-full">
                  <FooterSubscribeForm />
                </div>
              )}
              
              {/* 社交链接和登录 */}
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
            </div>            {/* 桌面端：单行布局 (50%-30%-20%) */}
            <div className="hidden lg:grid lg:grid-cols-10 lg:items-center">
              {/* 左侧：版权信息 (50%) */}
              <div className="col-span-5">
                {footer.copyright && (
                  <p className="text-left text-sm font-medium text-muted-foreground">
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
              </div>

              {/* 中间：订阅表单 (30%) */}
              <div className="col-span-3 px-4">
                {footer.show_subscribe && (
                  <div className="mx-auto">
                    <FooterSubscribeForm />
                  </div>
                )}
              </div>

              {/* 右侧：社交链接和登录 (20%) */}
              <div className="col-span-2 flex justify-end items-center gap-4">
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
          </div>
        </footer>
      </div>
    </section>
  );
}
