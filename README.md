# Thang Truong — website demo

Bản demo cấu trúc web cho anh Thắng (realtor, San Jose & Bay Area). Astro + Tailwind v4, hiệu ứng bằng GSAP + Lenis.

## Chạy thử

```bash
npm install
npm run dev
```

Mở http://localhost:4321

## Hai phương án thiết kế

- **Option A** (`/`): tối, điện ảnh. Layout `src/layouts/Base.astro`, CSS `src/styles/global.css`, hiệu ứng `src/scripts/motion.ts`.
- **Option B** (`/v2`): sáng, kiểu tạp chí cao cấp. Mọi thứ nằm trong `src/v2/` (Layout, styles, motion, bản đồ `map.ts`), trang ở `src/pages/v2/`.
- Hai bản dùng chung dữ liệu trong `src/data` và `src/config`. Ở chế độ demo có nút chuyển "Option A / B" góc dưới phải.

Option B có thêm: màn đếm khi mở web, chữ HOME có video bên trong, bảng nhà đã bán có ảnh theo chuột,
bản đồ thật (MapLibre + OpenFreeMap, không cần API key), quy trình mua/bán, máy tính trả góp, con trỏ riêng.

## Các trang (Option A)

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
