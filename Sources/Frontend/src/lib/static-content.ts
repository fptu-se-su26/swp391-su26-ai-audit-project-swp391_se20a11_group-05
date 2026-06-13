export interface StaticNewsItem {
  id: string;
  badge: "Thông báo" | "Hướng dẫn" | "Tin tức";
  date: string;
  title: string;
  summary: string;
  image: string;
  link: string;
}

export const staticNews: StaticNewsItem[] = [
  {
    id: "news-1",
    badge: "Thông báo",
    date: "12/06/2026",
    title: "Nâng cấp hệ thống Đà Nẵng Kết Nối để phục vụ người dân tốt hơn",
    summary: "Hệ thống sẽ tạm gián đoạn từ 22:00 ngày 15/06 đến 02:00 ngày 16/06/2026.",
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=250&fit=crop&q=80",
    link: "/notifications"
  },
  {
    id: "news-2",
    badge: "Hướng dẫn",
    date: "10/06/2026",
    title: "Hướng dẫn gửi phản ánh hiện trường trên web",
    summary: "Các bước gửi phản ánh nhanh chóng, đúng quy định và dễ dàng theo dõi.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop&q=80",
    link: "/my-reports"
  },
  {
    id: "news-3",
    badge: "Tin tức",
    date: "08/06/2026",
    title: "Thành phố tăng cường xử lý phản ánh về môi trường",
    summary: "Nhiều khu vực ô nhiễm đã được xử lý sau phản ánh của người dân.",
    image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=400&h=250&fit=crop&q=80",
    link: "/my-reports"
  }
];

export interface StaticFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const staticFaqs: StaticFaqItem[] = [
  {
    id: "faq-1",
    question: "Làm thế nào để gửi phản ánh?",
    answer: "Công dân gửi phản ánh qua 4 bước đơn giản: Chụp ảnh hoặc quay video sự việc thực tế, nhập nội dung mô tả, chọn vị trí chính xác trên bản đồ, rồi nhấn gửi. Hệ thống sẽ ngay lập tức tiếp nhận và chuyển giao tới cơ quan có thẩm quyền liên quan giải quyết."
  },
  {
    id: "faq-2",
    question: "Làm thế nào để theo dõi phản ánh của tôi?",
    answer: "Mỗi phản ánh gửi đi sẽ được cấp một mã số theo dõi (Ví dụ: PA-2024-0001). Bạn có thể nhập mã này tại ô tìm kiếm của trang chủ, hoặc truy cập vào mục 'Phản ánh của tôi' để cập nhật nhanh chóng tiến trình xử lý chi tiết của cơ quan chức năng."
  },
  {
    id: "faq-3",
    question: "Những lĩnh vực nào được tiếp nhận phản ánh?",
    answer: "Chúng tôi tiếp nhận mọi phản ánh thuộc các lĩnh vực đô thị bao gồm: Giao thông đường bộ, Vấn đề vệ sinh môi trường, Sự cố hạ tầng kỹ thuật (đường sá, cống rãnh, đèn chiếu sáng), Trật tự an ninh xã hội, và các hành vi lấn chiếm lòng lề đường đô thị."
  },
  {
    id: "faq-4",
    question: "Thời gian xử lý phản ánh là bao lâu?",
    answer: "Thời gian giải quyết và phản hồi thông tin sẽ tuân thủ nghiêm ngặt theo quy chế tiếp nhận của UBND Thành phố Đà Nẵng, tùy thuộc vào tính chất khẩn cấp và mức độ phức tạp của từng loại phản ánh thực tế."
  }
];
