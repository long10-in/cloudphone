import {
  Clock,
  Layers,
  Lock,
  MonitorSmartphone,
  Gauge,
  RefreshCw,
} from "lucide-react"

const features = [
  {
    icon: MonitorSmartphone,
    title: "Truy cập từ mọi nơi",
    desc: "Mở điện thoại đám mây ngay trên trình duyệt máy tính, laptop hay điện thoại. Không cần cài đặt, không tốn pin thiết bị thật.",
  },
  {
    icon: Clock,
    title: "Luôn bật 24/7",
    desc: "Thiết bị chạy liên tục trên máy chủ. App và tác vụ vẫn hoạt động kể cả khi bạn tắt máy hay mất mạng.",
  },
  {
    icon: Layers,
    title: "Nhiều thiết bị song song",
    desc: "Tạo và quản lý hàng chục điện thoại ảo cùng lúc, mỗi thiết bị có IP, cấu hình và môi trường riêng biệt.",
  },
  {
    icon: Lock,
    title: "Tách biệt & bảo mật",
    desc: "Mỗi thiết bị được cô lập hoàn toàn trong môi trường ảo hóa, dữ liệu mã hóa và không ảnh hưởng lẫn nhau.",
  },
  {
    icon: Gauge,
    title: "Cấu hình mạnh mẽ",
    desc: "CPU, RAM và bộ nhớ tùy chỉnh linh hoạt, chạy mượt cả những game và ứng dụng nặng nhất.",
  },
  {
    icon: RefreshCw,
    title: "Sao lưu & khôi phục",
    desc: "Snapshot toàn bộ thiết bị chỉ với một cú nhấp, khôi phục trạng thái bất cứ lúc nào bạn cần.",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-primary">Tính năng</span>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Một chiếc điện thoại thật, nhưng sống trên đám mây
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Mọi thứ bạn cần để vận hành một thiết bị phụ chuyên nghiệp, không giới
          hạn bởi phần cứng trong tay.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
