import Image from "next/image"
import { ArrowRight, Globe, ShieldCheck, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-24">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Cloud Phone thế hệ mới — chạy 24/7
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Sở hữu chiếc điện thoại thứ 2{" "}
            <span className="text-primary">trên đám mây</span>
          </h1>

          <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            NebulaPhone là điện thoại Android ảo chạy trên máy chủ đám mây. Truy
            cập từ bất kỳ trình duyệt nào, chạy app & game, nuôi nick và tự động
            hóa công việc — không cần mua thêm thiết bị thật.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Tạo thiết bị ngay
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Xem cách hoạt động
            </a>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            <Stat icon={Globe} value="Mọi trình duyệt" label="Không cài đặt" />
            <Stat icon={Zap} value="99.9%" label="Uptime 24/7" />
            <Stat icon={ShieldCheck} value="Tách biệt" label="Bảo mật cao" />
          </dl>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-b from-primary/10 to-transparent blur-2xl"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card">
            <Image
              src="/cloud-phone-hero.png"
              alt="Điện thoại đám mây NebulaPhone đang chạy giao diện Android trên trình duyệt"
              width={720}
              height={720}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType
  value: string
  label: string
}) {
  return (
    <div>
      <Icon className="h-5 w-5 text-primary" />
      <dd className="mt-2 text-sm font-semibold text-foreground">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  )
}
