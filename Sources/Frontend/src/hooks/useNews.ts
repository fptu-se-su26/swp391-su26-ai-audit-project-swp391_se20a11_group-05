import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { newsApi, type NewsRequest } from "@/lib/api";
import { toast } from "sonner";

const MOCK_NEWS = [
  {
    id: 1,
    title: "Thành phố khởi công dự án cầu vượt ngã tư trung tâm",
    summary: "Dự án cầu vượt nút giao thông trọng điểm chính thức được khởi công, hứa hẹn giải quyết triệt để tình trạng ùn tắc vào giờ cao điểm.",
    content: "<p>Sáng nay, UBND Thành phố đã chính thức làm lễ khởi công dự án cầu vượt tại nút giao thông ngã tư trung tâm. Đây là một trong những dự án hạ tầng giao thông trọng điểm của năm 2026, với tổng mức đầu tư hơn 500 tỷ đồng.</p><p>Phát biểu tại buổi lễ, đại diện ban quản lý dự án cam kết sẽ đẩy nhanh tiến độ, hoàn thành công trình vượt mức đề ra nhằm giảm thiểu ảnh hưởng đến việc đi lại của người dân. Cầu vượt mới được thiết kế với kiến trúc hiện đại, tích hợp hệ thống chiếu sáng thông minh và cảnh quan xanh hai bên.</p><p>Người dân được khuyến cáo theo dõi lịch phân luồng giao thông mới trên ứng dụng SmartCity để chủ động trong việc đi lại hàng ngày.</p>",
    category: "Hạ tầng - Đô thị",
    imageUrl: "https://images.unsplash.com/photo-1541888086925-920a0b411996?q=80&w=1000&auto=format&fit=crop",
    views: 1542,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Hội nghị xúc tiến đầu tư phát triển công nghệ cao 2026",
    summary: "Hàng trăm tập đoàn, doanh nghiệp công nghệ lớn trong và ngoài nước đã quy tụ tại hội nghị xúc tiến đầu tư, mở ra nhiều cơ hội hợp tác chiến lược.",
    content: "<p>Trong khuôn khổ chuỗi sự kiện chuyển đổi số, Hội nghị Xúc tiến đầu tư phát triển công nghệ cao 2026 đã diễn ra thành công tốt đẹp. Hội nghị tập trung thảo luận về các chính sách ưu đãi đầu tư mới, hạ tầng công nghệ thông tin và nguồn nhân lực chất lượng cao.</p><p>Tại sự kiện, 5 biên bản ghi nhớ hợp tác (MOU) đã được ký kết với các đối tác chiến lược về phát triển trung tâm dữ liệu (Data Center) và phòng thí nghiệm trí tuệ nhân tạo (AI Lab) tại khu công nghệ cao của thành phố.</p><p>Sự kiện này đánh dấu bước tiến quan trọng trong nỗ lực đưa thành phố trở thành trung tâm công nghệ và đổi mới sáng tạo hàng đầu khu vực.</p>",
    category: "Kinh tế - Xã hội",
    imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop",
    views: 856,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    title: "Triển khai hệ thống camera an ninh AI trên toàn thành phố",
    summary: "Hơn 2000 camera tích hợp trí tuệ nhân tạo vừa được lắp đặt nhằm tăng cường giám sát an ninh trật tự và an toàn giao thông đô thị.",
    content: "<p>Nhằm hướng tới mục tiêu xây dựng đô thị thông minh, an toàn, Công an Thành phố phối hợp cùng Sở Thông tin & Truyền thông đã hoàn thành giai đoạn 1 của dự án lắp đặt hệ thống camera an ninh AI thế hệ mới.</p><p>Hệ thống có khả năng nhận diện biển số xe vi phạm, phát hiện các hành vi gây rối trật tự công cộng, xả rác bừa bãi và cảnh báo sớm các sự cố ùn tắc giao thông. Toàn bộ dữ liệu được truyền trực tiếp về Trung tâm Điều hành Đô thị (IOC) để xử lý theo thời gian thực.</p><p>Theo báo cáo, chỉ sau 1 tuần thử nghiệm, hệ thống đã giúp lực lượng chức năng phát hiện và xử lý hơn 300 trường hợp vi phạm giao thông tự động (phạt nguội).</p>",
    category: "An ninh - Trật tự",
    imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=1000&auto=format&fit=crop",
    views: 2304,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 4,
    title: "Thông báo: Cắt điện luân phiên bảo trì hệ thống điện lưới",
    summary: "Điện lực thành phố thông báo lịch tạm ngừng cung cấp điện tại một số khu vực để phục vụ công tác bảo trì, nâng cấp lưới điện mùa khô.",
    content: "<p>Để đảm bảo cung cấp điện an toàn, ổn định trong mùa nắng nóng sắp tới, Công ty Điện lực sẽ tiến hành công tác kiểm tra, bảo dưỡng định kỳ các trạm biến áp và đường dây trung thế.</p><p>Lịch tạm ngừng cung cấp điện sẽ diễn ra từ ngày 20/07 đến ngày 25/07 tại các khu vực thuộc Quận 1, Quận 3 và Quận 5. Thời gian mất điện dự kiến từ 08:00 sáng đến 15:00 chiều cùng ngày.</p><p>Xin thông báo để các cơ quan, xí nghiệp và người dân khu vực ảnh hưởng có kế hoạch sắp xếp công việc sản xuất, kinh doanh phù hợp. Trân trọng cảm ơn sự thông cảm của quý khách hàng.</p>",
    category: "Thông báo",
    imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1000&auto=format&fit=crop",
    views: 3120,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export function useNewsList(page = 0, size = 10, category?: string, keyword?: string) {
  return useQuery({
    queryKey: ["news", page, size, category, keyword],
    queryFn: () => newsApi.getAll(page, size, category, keyword),
    placeholderData: (previousData) => previousData,
  });
}

export function useNewsDetail(id: number | string) {
  return useQuery({
    queryKey: ["news", id],
    queryFn: () => newsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewsRequest) => newsApi.create(data),
    onSuccess: () => {
      toast.success("Tạo tin tức thành công");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Lỗi khi tạo tin tức");
    }
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: NewsRequest }) => newsApi.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật tin tức thành công");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Lỗi khi cập nhật tin tức");
    }
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => newsApi.delete(id),
    onSuccess: () => {
      toast.success("Xóa tin tức thành công");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Lỗi khi xóa tin tức");
    }
  });
}
