const steps = [
  {
    step: "01",
    title: "Chọn cấu hình",
    desc: "Lựa chọn phiên bản Android, CPU, RAM và vị trí máy chủ phù hợp với nhu cầu của bạn.",
  },
  {
    step: "02",
    title: "Khởi tạo thiết bị",
    desc: "Điện thoại đám mây được tạo và sẵn sàng chỉ trong vài giây, hiển thị ngay trên trình duyệt.",
  },
  {
    step: "03",
    title: "Cài app & sử dụng",
    desc: "Cài đặt ứng dụng, đăng nhập tài khoản và điều khiển thiết bị như đang cầm điện thoại thật.",
  },
  {
    step: "04",
    title: "Chạy liên tục 24/7",
    desc: "Đóng trình duyệt vẫn không sao — thiết bị tiếp tục chạy trên đám mây mọi lúc.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-primary">Cách hoạt động</span>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Sẵn sàng chỉ trong 4 bước
        </h2>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.step} className="relative rounded-2xl border border-border bg-card p-6">
            <span className="font-mono text-3xl font-semibold text-primary/40">
              {s.step}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
