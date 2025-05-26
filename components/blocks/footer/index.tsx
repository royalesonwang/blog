import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import SignToggle from "@/components/sign/toggle";
import SubscribeForm from "@/components/subscribe/form";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-16">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="border-t pt-8">
            {/* 移动端：垂直布局 */}
            <div className="lg:hidden flex flex-col gap-4">
              {/* 订阅表单 */}
              {footer.show_subscribe && (
                <div className="w-full">
                  <SubscribeForm />
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
            </div>

            {/* 桌面端：左右布局 */}
            <div className="hidden lg:grid lg:grid-cols-2">
              {/* 左侧：社交链接和版权信息 */}
              <div className="flex flex-col justify-between h-full min-h-[120px]">
                {/* 垂直居中的占位元素 */}
                <div></div>
                
                {/* 居中：社交链接和登录 */}
                <div className="flex justify-start items-center gap-4">
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
                
                {/* 版权信息 */}
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
              
              {/* 右侧：订阅表单 */}
              <div className="flex items-start">
                {footer.show_subscribe && (
                  <div className="w-full">
                    <SubscribeForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
