# Thang Truong — website demo

Bản demo cấu trúc web cho anh Thắng (realtor, San Jose & Bay Area). Astro + Tailwind v4, hiệu ứng bằng GSAP + Lenis.

## Chạy thử

```bash
npm install
npm run dev
```

Mở http://localhost:4321

## Các trang

| Trang | File |
|---|---|
| Trang chủ | `src/pages/index.astro` |
| Nhà đã bán (lọc, sắp xếp, load more) | `src/pages/sold.astro` |
| About (timeline sự nghiệp, giải thưởng, DRE) | `src/pages/about.astro` |
| Videos (YouTube) | `src/pages/videos.astro` |
| Journal / bài viết | `src/pages/blog/` |
| Liên hệ (form) | `src/pages/contact.astro` |

## Sửa nội dung ở đâu

- Thông tin anh Thắng (tên, SĐT, email, DRE, brokerage, link YouTube): `src/config/site.ts`
- Nhà đã bán: `src/data/sold.ts` (demo đang **tự sinh 128 căn mẫu**, bản thật nhập từ file CSV export MLS)
- Bài viết, video, giải thưởng, timeline: `src/data/content.ts` (video: điền `youtubeId` là phát được ngay)
- Ảnh/video stock: `src/data/media.ts` (Unsplash/Pexels, chỉ dùng cho demo)
- Màu, font, cỡ chữ: `src/styles/global.css` (`@theme`)

## Đang là dữ liệu mẫu

Mọi thứ gắn nhãn **Sample** trên web là giả: số liệu nhà đã bán, bài viết, video, giải thưởng, timeline,
SĐT `(408) 555-0123`, email, số DRE, brokerage. Đổi `mode: 'production'` trong `site.ts` thì build sẽ báo lỗi
nếu còn sót thông tin placeholder.

## Chưa làm (giai đoạn sau)

- CMS để anh Thắng tự đăng bài, video, giải thưởng, nhà đã bán
- Import CSV từ MLS
- Form liên hệ gửi email thật
- Domain, SEO schema, ảnh thật
