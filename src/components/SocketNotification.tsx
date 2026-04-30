"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { socket } from "@/src/socket";
import { toast } from "sonner";

/**
 * Hiển thị toast khi có ứng viên mới hoặc thông báo mới.
 * Chỉ hiển thị khi đang ở trong các trang /recruitment
 */
export default function SocketNotification() {
  const pathname = usePathname();

  useEffect(() => {
    // Chỉ lắng nghe và hiển thị nếu đang ở trang quản trị tuyển dụng
    if (!pathname?.startsWith('/recruitment')) return;

    const onNewNotification = (notification: any) => {
      toast.info(notification.title || "Thông báo mới", {
        description: notification.message,
        position: "top-right",
        duration: 5000,
      });
    };

    socket.on("notification_received", onNewNotification);
    
    // Giữ lại candidate_created để update UI nếu cần, nhưng không hiện alert ở đây nữa
    // socket.on("candidate_created", (candidate) => { ... });

    return () => {
      socket.off("notification_received", onNewNotification);
    };
  }, [pathname]);

  return null;
}
