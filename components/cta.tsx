import { ArrowRight } from "lucide-react"

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/25 blur-[100px]"
        />
        <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Sẵn sàng sở hữu thiết bị thứ 2 của riêng bạn?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
          Tạo điện thoại đám mây đầu tiên trong vài giây. Dùng thử miễn phí 3
          ngày, không cần thẻ tín dụng.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Bắt đầu miễn phí
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Tìm hiểu thêm
          </a>
        </div>
      </div>
    </section>
  )
}
