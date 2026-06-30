"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "Cloud phone là gì?",
    a: "Cloud phone (điện thoại đám mây) là một chiếc điện thoại Android ảo chạy trên máy chủ từ xa. Bạn điều khiển nó qua trình duyệt giống như đang dùng điện thoại thật, nhưng toàn bộ xử lý diễn ra trên đám mây.",
  },
  {
    q: "Tôi có cần cài phần mềm gì không?",
    a: "Không. Bạn chỉ cần một trình duyệt web bất kỳ trên máy tính, laptop hay điện thoại. Mọi thứ chạy trực tiếp trên trình duyệt mà không cần cài đặt thêm.",
  },
  {
    q: "Thiết bị có chạy khi tôi tắt máy không?",
    a: "Có. Điện thoại đám mây hoạt động liên tục 24/7 trên máy chủ của chúng tôi. Bạn có thể đóng trình duyệt hoặc tắt máy mà app và tác vụ vẫn tiếp tục chạy.",
  },
  {
    q: "Dữ liệu của tôi có an toàn không?",
    a: "Mỗi thiết bị được cô lập hoàn toàn trong môi trường ảo hóa riêng, dữ liệu được mã hóa và không chia sẻ với thiết bị khác. Chúng tôi không truy cập nội dung bên trong thiết bị của bạn.",
  },
  {
    q: "Tôi có thể tạo bao nhiêu thiết bị?",
    a: "Tùy theo gói bạn chọn. Gói Cá nhân có 1 thiết bị, gói Chuyên nghiệp có 5 thiết bị, và gói Doanh nghiệp không giới hạn số lượng thiết bị.",
  },
  {
    q: "Tôi có được dùng thử trước không?",
    a: "Có. Bạn được dùng thử miễn phí 3 ngày với đầy đủ tính năng, không cần thẻ tín dụng và có thể hủy bất cứ lúc nào.",
  },
]

export function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="text-center">
        <span className="text-sm font-semibold text-primary">Hỏi đáp</span>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Câu hỏi thường gặp
        </h2>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {faqs.map((item, idx) => {
          const open = openIdx === idx
          return (
            <div key={item.q} className="rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-medium">{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open && (
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
