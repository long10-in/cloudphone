import { CloudCog } from "lucide-react"

const columns = [
  {
    title: "Sản phẩm",
    links: ["Tính năng", "Bảng giá", "Cấu hình", "Cập nhật"],
  },
  {
    title: "Công ty",
    links: ["Về chúng tôi", "Blog", "Tuyển dụng", "Liên hệ"],
  },
  {
    title: "Hỗ trợ",
    links: ["Trung tâm trợ giúp", "Tài liệu", "Trạng thái hệ thống", "Cộng đồng"],
  },
  {
    title: "Pháp lý",
    links: ["Điều khoản", "Bảo mật", "Chính sách hoàn tiền"],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <a href="#" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <CloudCog className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">NebulaPhone</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Điện thoại đám mây giúp bạn sở hữu thiết bị thứ 2 mạnh mẽ, luôn bật
              và truy cập từ mọi nơi.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NebulaPhone. Mọi quyền được bảo lưu.
          </p>
          <p className="text-sm text-muted-foreground">Made on the cloud.</p>
        </div>
      </div>
    </footer>
  )
}
