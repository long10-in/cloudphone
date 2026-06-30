import { Gamepad2, Megaphone, Bot, Users } from "lucide-react"

const cases = [
  {
    icon: Users,
    title: "Nuôi & quản lý nhiều tài khoản",
    desc: "Mỗi nick một thiết bị riêng với IP độc lập, hạn chế tối đa rủi ro bị khóa khi làm MMO, mạng xã hội hay thương mại điện tử.",
  },
  {
    icon: Gamepad2,
    title: "Cày game & treo máy",
    desc: "Chạy game mobile 24/7, làm nhiệm vụ hằng ngày và treo máy mà không tốn pin hay làm nóng điện thoại thật của bạn.",
  },
  {
    icon: Bot,
    title: "Tự động hóa công việc",
    desc: "Lên lịch và chạy kịch bản tự động cho marketing, chăm sóc khách hàng hay thu thập dữ liệu liên tục trên nền tảng đám mây.",
  },
  {
    icon: Megaphone,
    title: "Test app & quảng cáo",
    desc: "Kiểm thử ứng dụng trên nhiều cấu hình Android, xem trước chiến dịch quảng cáo ở các vùng và thiết bị khác nhau.",
  },
]

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="scroll-mt-20 border-y border-border/60 bg-card/30 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-primary">Trường hợp sử dụng</span>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Thiết bị thứ 2 cho mọi nhu cầu
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Từ cá nhân đến doanh nghiệp, NebulaPhone mở rộng khả năng của bạn mà
            không cần đầu tư thêm phần cứng.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <div
              key={c.title}
              className="flex gap-5 rounded-2xl border border-border bg-background p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
