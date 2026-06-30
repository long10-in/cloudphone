import { Check } from "lucide-react"

const plans = [
  {
    name: "Cá nhân",
    price: "99K",
    period: "/tháng",
    desc: "Cho người mới bắt đầu cần một thiết bị phụ.",
    features: [
      "1 điện thoại đám mây",
      "2 vCPU · 4GB RAM · 32GB",
      "Android 12 · 1 vị trí máy chủ",
      "Hoạt động 24/7",
      "Hỗ trợ qua email",
    ],
    cta: "Bắt đầu",
    featured: false,
  },
  {
    name: "Chuyên nghiệp",
    price: "299K",
    period: "/tháng",
    desc: "Lựa chọn phổ biến cho người làm MMO & game thủ.",
    features: [
      "5 điện thoại đám mây",
      "4 vCPU · 8GB RAM · 64GB",
      "Android 12/13 · IP riêng từng máy",
      "Snapshot & khôi phục",
      "Tự động hóa kịch bản",
      "Hỗ trợ ưu tiên 24/7",
    ],
    cta: "Dùng thử miễn phí",
    featured: true,
  },
  {
    name: "Doanh nghiệp",
    price: "Liên hệ",
    period: "",
    desc: "Cho agency và đội nhóm cần quy mô lớn.",
    features: [
      "Không giới hạn thiết bị",
      "Cấu hình tùy chỉnh chuyên sâu",
      "API & quản lý tập trung",
      "Phân quyền nhiều thành viên",
      "SLA cam kết & quản lý riêng",
    ],
    cta: "Liên hệ tư vấn",
    featured: false,
  },
]

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-y border-border/60 bg-card/30 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-primary">Bảng giá</span>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Giá minh bạch, không phí ẩn
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Bắt đầu miễn phí 3 ngày. Nâng cấp, hạ cấp hoặc hủy bất cứ lúc nào.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                plan.featured
                  ? "border-primary bg-card shadow-[0_0_0_1px] shadow-primary/40"
                  : "border-border bg-background"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Phổ biến nhất
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feat}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                  plan.featured
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
