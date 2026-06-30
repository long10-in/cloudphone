const items = [
  "Marketer",
  "Game thủ",
  "Dropshipping",
  "Affiliate",
  "Agency MMO",
  "Nhà phát triển",
]

export function Logos() {
  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Được tin dùng bởi hơn 40.000+ người dùng
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((item) => (
            <span
              key={item}
              className="text-base font-semibold text-muted-foreground/70 transition-colors hover:text-foreground sm:text-lg"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
