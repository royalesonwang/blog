import DashboardLayout from "@/components/dashboard/layout";
import Empty from "@/components/blocks/empty";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const userInfo = await getUserInfo();
  
  // Check if user is logged in
  if (!session?.user && !userInfo) {
    redirect("/auth/signin");
  }
  
  // Allow access to admin user in development environment or check for admin emails
  const isAdmin = 
    (process.env.NODE_ENV === "development" && session?.user?.is_admin) || 
    (userInfo?.email && process.env.ADMIN_EMAILS?.split(",").includes(userInfo.email));
  
  if (!isAdmin) {
    return <Empty message="No access" />;
  }

  const sidebar: Sidebar = {
    brand: {
      title: "ShipAny",
      logo: {
        src: "/logo.png",
        alt: "ShipAny",
      },
      url: "/admin",
    },
    nav: {
      items: [
        {
          title: "Users",
          url: "/admin/users",
          icon: "RiUserLine",
        },        {
          title: "Orders",
          icon: "RiOrderPlayLine",
          is_expand: true,
          children: [
            {
              title: "Paid Orders",
              url: "/admin/paid-orders",
            },
          ],
        },        {
          title: "Subscriptions",
          url: "/admin/subscriptions",
          icon: "RiNotificationLine",
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
          icon: "RiBarChartLine",
        },
        {
          title: "Posts",
          url: "/admin/posts",
          icon: "RiArticleLine",
        },
        {
          title: "Images",
          icon: "RiImageLine",
          is_expand: true,
          children: [
            {
              title: "Image Library",
              url: "/admin/images",
            },
            {
              title: "Upload Image",
              url: "/admin/img_upload",
            },
          ],
        },
        {
          title: "Albums",
          icon: "RiGalleryLine",
          is_expand: true,
          children: [
            {
              title: "Album List",
              url: "/admin/albums",
            },
            {
              title: "Add Album",
              url: "/admin/albums/add",
            },
          ],
        },
      ],
    },
    social: {
      items: [
        {
          title: "Home",
          url: "/",
          target: "_blank",
          icon: "RiHomeLine",
        },
        {
          title: "Github",
          url: "https://github.com/shipanyai/shipany-template-one",
          target: "_blank",
          icon: "RiGithubLine",
        },
        {
          title: "Discord",
          url: "https://discord.gg/HQNnrzjZQS",
          target: "_blank",
          icon: "RiDiscordLine",
        },
        {
          title: "X",
          url: "https://x.com/shipanyai",
          target: "_blank",
          icon: "RiTwitterLine",
        },
      ],
    },
  };

  return <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>;
}
