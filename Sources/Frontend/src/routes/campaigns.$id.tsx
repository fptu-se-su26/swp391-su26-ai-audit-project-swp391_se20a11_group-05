import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Calendar,
  Users,
  Compass,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  HelpCircle,
  Share2,
  Bell,
  Check,
  ChevronRight,
  TrendingUp,
  Map,
  MapPin,
  ListTodo,
  Image as ImageIcon,
  MessageSquare,
  Bookmark,
  Send,
  Flag,
  ArrowRight,
  Shield,
  Heart,
  ThumbsUp,
  User,
  AlertOctagon,
  Download,
  Info,
  Trash2,
  Flame,
  UserCheck,
  FileSpreadsheet,
  PlusCircle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";

// Lazy load the specialized CampaignMap to prevent Leaflet SSR issues
const CampaignMap = lazy(() =>
  import("@/components/site/CampaignMap").then((m) => ({ default: m.CampaignMap })),
);

export const Route = createFileRoute("/campaigns/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Chi tiết chiến dịch - Đà Nẵng Kết Nối` },
      { name: "description", content: `Chi tiết chiến dịch cộng đồng bảo vệ môi trường, hạ tầng đô thị Đà Nẵng.` },
    ],
  }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { locale } = useI18n();
  const isVi = locale === "vi";

  // State Management
  const [isJoined, setIsJoined] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [participantCount, setParticipantCount] = useState(42);
  const [campaignStatus, setCampaignStatus] = useState<"recruiting" | "inProgress" | "completed">("inProgress");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<"all" | "todo" | "inProgress" | "completed">("all");
  
  // Before / After Slider Position
  const [sliderPosition, setSliderPosition] = useState(50);

  // Discussion state
  const [comments, setComments] = useState([
    {
      id: "c-1",
      author: "Nguyễn Văn Hùng",
      role: "Trưởng nhóm TNV Tổ 1",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      time: isVi ? "10 phút trước" : "10 minutes ago",
      text: isVi ? "Bên mình đã dọn xong đoạn kênh hở số 2 rồi nhé mọi người. Lượng rác nhựa ở đây nhiều khủng khiếp!" : "Our team finished clearing canal section 2. The amount of plastic waste here was enormous!",
      likes: 14,
      replies: [
        {
          id: "c-1-r-1",
          author: "UBND Phường Hòa Xuân",
          role: "Ban quản lý",
          avatar: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=100&q=80",
          time: isVi ? "5 phút trước" : "5 minutes ago",
          text: isVi ? "Cảm ơn nỗ lực tuyệt vời của Tổ 1! Xe chở rác chuyên dụng đang trên đường đến điểm tập kết rác tạm để vận chuyển đi." : "Thank you for the great effort from Team 1! The garbage collection truck is on its way to the collection point.",
        }
      ]
    },
    {
      id: "c-2",
      author: "Trần Thị Lan",
      role: "Người dân Hòa Xuân",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      time: isVi ? "1 giờ trước" : "1 hour ago",
      text: isVi ? "Rất hoan nghênh chiến dịch này. Khu phố nhà mình sạch sẽ hẳn ra, không còn mùi hôi thối bốc lên từ mương nữa." : "Highly appreciate this campaign. Our neighborhood is much cleaner now, no more foul odors coming from the canal.",
      likes: 8,
      replies: []
    }
  ]);
  const [newCommentText, setNewCommentText] = useState("");

  const handleJoinCampaign = () => {
    if (isJoined) {
      setParticipantCount((prev) => prev - 1);
      setIsJoined(false);
      toast.success(isVi ? "Bạn đã hủy đăng ký tham gia chiến dịch." : "You have cancelled campaign registration.");
    } else {
      setParticipantCount((prev) => prev + 1);
      setIsJoined(true);
      toast.success(isVi ? "Đăng ký tham gia chiến dịch thành công! Chào mừng bạn gia nhập đội ngũ tình nguyện viên." : "Registered successfully! Welcome to the volunteer team.");
    }
  };

  const handleFollowCampaign = () => {
    setIsFollowing((prev) => !prev);
    toast.success(
      isFollowing
        ? isVi ? "Đã bỏ theo dõi chiến dịch." : "Unfollowed campaign."
        : isVi ? "Đang theo dõi tiến trình chiến dịch." : "Following campaign progress."
    );
  };

  const handleShareCampaign = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(isVi ? "Đã sao chép liên kết chiến dịch vào bộ nhớ tạm!" : "Campaign link copied to clipboard!");
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      author: isVi ? "Người dân Đà Nẵng (Bạn)" : "Da Nang Citizen (You)",
      role: isVi ? "Tình nguyện viên" : "Volunteer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
      time: isVi ? "Vừa xong" : "Just now",
      text: newCommentText,
      likes: 0,
      replies: []
    };
    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
    toast.success(isVi ? "Đã gửi ý kiến đóng góp thành công!" : "Comment submitted successfully!");
  };

  // Volunteer Demographics Chart Data
  const demographicData = [
    { name: isVi ? "Đoàn Thanh niên" : "Youth Union", value: 40, color: "#1E5EFF" },
    { name: isVi ? "Người dân" : "Citizens", value: 35, color: "#22C55E" },
    { name: isVi ? "Tổ dân phố" : "Neighborhood Teams", value: 15, color: "#F59E0B" },
    { name: isVi ? "Cán bộ Phường" : "Ward Officers", value: 10, color: "#8B5CF6" },
  ];

  // SECTION 3: Triggering Reports Mock Data
  const relatedReports = [
    {
      id: "35",
      title: isVi ? "Bãi rác thải tự phát dọc đường Trần Nam Trung" : "Illegal Garbage Dumping on Tran Nam Trung",
      category: isVi ? "Môi trường" : "Environment",
      status: "inProgress",
      priority: "high",
      location: "Hòa Xuân",
      date: "14/06/2026",
      unit: "UBND Phường Hòa Xuân",
      dist: "150m",
      img: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "36",
      title: isVi ? "Mương thoát nước ùn ứ rác thải nhựa" : "Blocked Drainage with Plastic Waste",
      category: isVi ? "Môi trường" : "Environment",
      status: "pending",
      priority: "high",
      location: "Hòa Xuân",
      date: "15/06/2026",
      unit: "UBND Phường Hòa Xuân",
      dist: "200m",
      img: "https://images.unsplash.com/photo-1605600611284-6f52f6d2780e?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "37",
      title: isVi ? "Xà bần đổ tràn lan lấn chiếm lòng đường" : "Waste Accumulation Blocking Street",
      category: isVi ? "Môi trường" : "Environment",
      status: "inProgress",
      priority: "medium",
      location: "Hòa Xuân",
      date: "13/06/2026",
      unit: "Tổ quản lý đô thị",
      dist: "420m",
      img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "38",
      title: isVi ? "Kênh sinh thái ô nhiễm bốc mùi hôi thối" : "Polluted Canal Near Residential Area",
      category: isVi ? "Môi trường" : "Environment",
      status: "pending",
      priority: "high",
      location: "Hòa Xuân",
      date: "15/06/2026",
      unit: "UBND Phường Hòa Xuân",
      dist: "310m",
      img: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "39",
      title: isVi ? "Cây xanh đổ gãy hư hỏng đèn công cộng" : "Broken Public Facilities and Fallen Trees",
      category: isVi ? "Hạ tầng" : "Infrastructure",
      status: "resolved",
      priority: "medium",
      location: "Hòa Xuân",
      date: "12/06/2026",
      unit: "Công ty Cây xanh ĐT",
      dist: "500m",
      img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80",
    },
  ];

  // SECTION 4: Kanban Board Tasks
  const kanbanTasks = [
    { id: "t-1", title: isVi ? "Thu gom rác hữu cơ & xà bần đường Trần Nam Trung" : "Collect garbage at Tran Nam Trung", column: "todo", team: isVi ? "Tổ 1 (Phối hợp)" : "Team 1 (Joint)", volunteers: 15, due: "16/06/2026", progress: 20, priority: "high" },
    { id: "t-2", title: isVi ? "Khơi thông dòng chảy, vớt rác kênh sinh thái" : "Clean drainage canal blockages", column: "inProgress", team: isVi ? "Tổ 2 (Kỹ thuật)" : "Team 2 (Tech)", volunteers: 8, due: "17/06/2026", progress: 60, priority: "high" },
    { id: "t-3", title: isVi ? "Bóc dỡ biển quảng cáo, vẽ tranh tường công cộng" : "Remove illegal advertisements & paint", column: "inProgress", team: isVi ? "Tổ 3 (Đoàn viên)" : "Team 3 (Youth)", volunteers: 10, due: "18/06/2026", progress: 40, priority: "medium" },
    { id: "t-4", title: isVi ? "Phát quang cỏ dại, tỉa cành cây che khuất đèn" : "Trim trees and remove weeds near lights", column: "todo", team: isVi ? "Tổ 4 (Người dân)" : "Team 4 (Citizens)", volunteers: 12, due: "19/06/2026", progress: 0, priority: "low" },
    { id: "t-5", title: isVi ? "Lắp đặt 4 camera AI phạt nguội xả rác trộm" : "Install 4 CCTV cameras at hotspots", column: "completed", team: isVi ? "UBND & Kỹ thuật phường" : "Ward Authority", volunteers: 4, due: "14/06/2026", progress: 100, priority: "high" },
    { id: "t-6", title: isVi ? "Thay thế nắp cống bể vỡ vỉa hè" : "Repair broken sidewalk manhole cover", column: "completed", team: isVi ? "Tổ đô thị phường" : "Urban Management", volunteers: 3, due: "13/06/2026", progress: 100, priority: "medium" },
  ];

  const filteredKanbanTasks = useMemo(() => {
    return kanbanTasks.filter((t) => {
      if (selectedTaskFilter === "all") return true;
      return t.column === selectedTaskFilter;
    });
  }, [selectedTaskFilter]);

  // SECTION 5: Volunteer Activity Timeline
  const timelineActivities = [
    { date: "12/06/2026", time: "08:00 AM", title: isVi ? "Khởi tạo chiến dịch" : "Campaign Created", team: isVi ? "UBND Phường Hòa Xuân" : "Hoa Xuan Ward Committee", desc: isVi ? "Ban chỉ đạo ban hành quyết định hành động cấp bách cải tạo cảnh quan sau 18 phản ánh ô nhiễm tích tụ." : "Official launch of environmental restoration after 18 reports on illegal dumping.", progress: 100 },
    { date: "13/06/2026", time: "09:30 AM", title: isVi ? "Tuyển dụng tình nguyện viên" : "Volunteer Recruitment Started", team: isVi ? "Đoàn Thanh niên Phường" : "Youth Union Committee", desc: isVi ? "Phát động kêu gọi TNV tham gia. Đăng ký trực tuyến nhận áo bảo hộ và trang bị dọn vệ sinh." : "Opened online application for volunteers, distributing safety gear and cleanup kits.", progress: 100 },
    { date: "14/06/2026", time: "07:30 AM", title: isVi ? "Ngày ra quân đầu tiên" : "First Cleanup Day", team: isVi ? "Đội ngũ liên ngành" : "Joint Taskforce Group", desc: isVi ? "Tập kết dụng cụ tại nhà văn hóa, tiến hành bóc dỡ quảng cáo rác, vệ sinh lòng đường và thu gom 1 tấn rác." : "Gathered at Community Center, removed illegal flyer walls, collected 1 ton of garbage.", progress: 100, photos: ["https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=80"] },
    { date: "15/06/2026", time: "02:00 PM", title: isVi ? "Cập nhật tiến độ giữa kỳ" : "Midway Progress", team: isVi ? "Ban quản lý chiến dịch" : "Campaign Admin", desc: isVi ? "Dọn dẹp sạch 4 trên 6 tuyến mương thoát nước, rải đá dăm chống xói mòn và gia cố vỉa hè sụt lún." : "Cleared 4 out of 6 drainage canals, spread gravel for stabilization and patched sidewalks.", progress: 68 },
    { date: "15/06/2026", time: "04:30 PM", title: isVi ? "Phản ánh được giải quyết một phần" : "Issue Partially Resolved", team: isVi ? "Tổ công tác 2" : "Working Team 2", desc: isVi ? "Giải quyết dứt điểm 12 bãi rác tự phát lớn, chuyển rác thải về bãi Khánh Sơn xử lý." : "Cleared 12 major waste piles, transported waste containers to Khanh Son landfill.", progress: 68 },
    { date: "17/06/2026", time: "08:00 AM", title: isVi ? "Giải quyết toàn diện phản ánh" : "Issue Fully Resolved", team: isVi ? "Đội kỹ thuật môi trường" : "Environmental Team", desc: isVi ? "Khai thông 100% cống rãnh nghẹt, lắp đặt camera AI giám sát đổ trộm tự động gửi biên bản phạt nguội." : "Completed drainage clearing, installed AI-cameras targeting illegal dumpers.", progress: 85 },
    { date: "20/06/2026", time: "05:00 PM", title: isVi ? "Hoàn thành và bàn giao chiến dịch" : "Campaign Completed", team: isVi ? "UBND Phường Hòa Xuân" : "Hoa Xuan Ward Committee", desc: isVi ? "Trồng hoa ven hồ điều hòa, sơn sửa lại các bức tường công cộng bị bôi bẩn, ký cam kết tự quản với người dân." : "Planted flowers near reservoir, repainted walls, signed community maintenance pacts.", progress: 100 },
  ];

  // SECTION 6: Volunteer Team Directory
  const volunteerTeam = [
    { name: "Lê Tấn Tài", role: isVi ? "Trưởng ban điều phối" : "Coordinator Head", org: isVi ? "UBND Phường Hòa Xuân" : "Ward Committee", status: "online", avatar: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=100&q=80" },
    { name: "Nguyễn Hoàng Hải", role: isVi ? "Bí thư Đoàn Thanh niên" : "Youth Union Leader", org: isVi ? "Đoàn Phường" : "Youth Union", status: "online", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
    { name: "Nguyễn Văn Hùng", role: isVi ? "Trưởng Nhóm TNV Tổ 1" : "Volunteer Team Leader", org: isVi ? "Đội TNV Sông Hàn" : "Han River Vol Group", status: "busy", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" },
    { name: "Trần Thị Lan", role: isVi ? "Người dân tự nguyện" : "Active Citizen", org: isVi ? "Tổ dân phố 15" : "Neighborhood 15", status: "offline", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
    { name: "Trần Nguyễn Hạnh", role: isVi ? "Đại diện Phường" : "Ward Representative", org: isVi ? "Hội Phụ Nữ Phường" : "Women's Association", status: "online", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80" },
    { name: "Lâm Minh Quốc", role: isVi ? "Điều phối viên kỹ thuật" : "Technical Coordinator", org: isVi ? "Công ty Môi trường đô thị" : "Urban Eco Co.", status: "online", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
  ];

  // SECTION 7: Upcoming Activities Schedule
  const activitySchedule = [
    { date: "16/06/2026", time: "07:30 AM", loc: isVi ? "Đường Trần Nam Trung" : "Tran Nam Trung St", name: isVi ? "Ngày ra quân dọn rác đợt 2" : "Cleanup Day Round 2", guests: "45 TNV", status: "upcoming" },
    { date: "18/06/2026", time: "08:00 AM", loc: isVi ? "Kênh sinh thái Hòa Xuân" : "Hoa Xuan Canal", name: isVi ? "Khơi thông dòng chảy & Vớt bèo" : "Canal Drainage Cleaning", guests: "30 TNV", status: "upcoming" },
    { date: "20/06/2026", time: "07:30 AM", loc: isVi ? "Hồ điều hòa Hòa Xuân" : "Hoa Xuan Reservoir", name: isVi ? "Trồng hoa anh đào, cây bóng mát" : "Tree Planting Campaign", guests: "60 TNV", status: "upcoming" },
    { date: "22/06/2026", time: "02:00 PM", loc: isVi ? "Nhà văn hóa Hòa Xuân" : "Community Hall", name: isVi ? "Tập huấn tuyên truyền môi trường" : "Awareness Session", guests: "80 người", status: "draft" },
  ];

  // SECTION 8: Resource Inventory
  const resourceInventory = [
    { name: isVi ? "Túi đựng rác công nghiệp (cuộn)" : "Industrial Trash Bags (roll)", qty: "350", status: "enough" },
    { name: isVi ? "Găng tay bảo hộ lao động (đôi)" : "Work Safety Gloves (pair)", qty: "120", status: "enough" },
    { name: isVi ? "Dụng cụ dọn vệ sinh (xẻng, cào...)" : "Cleaning Tools (shovels, rakes...)", qty: "80", status: "enough" },
    { name: isVi ? "Xe đẩy tay thu gom rác tự chế" : "Garbage Trolleys", qty: "15", status: "low" },
    { name: isVi ? "Xe tải ép rác chuyên dụng (chiếc)" : "Garbage Compactor Trucks", qty: "2", status: "enough" },
    { name: isVi ? "Thiết bị bảo hộ (mũ, áo phản quang)" : "Safety Vests & Helmets", qty: "60", status: "low" },
    { name: isVi ? "Túi sơ cấp cứu y tế lưu động" : "First Aid Kits", qty: "4", status: "enough" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* 1. Top Bar with Demo Toggle */}
      <div className="bg-slate-900 py-3 text-white">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Info size={14} className="text-[#1E5EFF]" />
            {isVi 
              ? "Chế độ xem Thử nghiệm: Bạn có thể chuyển đổi trạng thái để xem báo cáo tổng kết chiến dịch."
              : "Demo Mode: Toggle the status below to preview the Campaign Completion Report."}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{isVi ? "Trạng thái:" : "Status:"}</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => {
                  setCampaignStatus("inProgress");
                  setParticipantCount(42);
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  campaignStatus === "inProgress" ? "bg-[#1E5EFF] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {isVi ? "Đang tiến hành" : "In Progress"}
              </button>
              <button
                onClick={() => {
                  setCampaignStatus("completed");
                  setParticipantCount(52);
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  campaignStatus === "completed" ? "bg-[#22C55E] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {isVi ? "Đã hoàn thành" : "Completed"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Breadcrumb Bar */}
      <div className="border-b border-[#E2E8F0] bg-white py-4 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-[#1E5EFF] transition-colors">
              {isVi ? "Trang chủ" : "Home"}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="hover:text-[#1E5EFF] transition-colors cursor-pointer">
              {isVi ? "Chiến dịch" : "Campaigns"}
            </span>
            <span className="text-slate-300">/</span>
            <span className="hover:text-[#1E5EFF] transition-colors cursor-pointer truncate max-w-[150px]">
              {isVi ? "Môi trường" : "Environment"}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-extrabold truncate max-w-[200px]">
              {isVi ? "Chiến dịch Xanh Hòa Xuân" : "Green Hoa Xuan"}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareCampaign}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition shadow-sm cursor-pointer min-h-[34px]"
            >
              <Share2 size={13} />
              {isVi ? "Chia sẻ" : "Share"}
            </button>
            <button
              onClick={handleFollowCampaign}
              className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold rounded-lg transition shadow-sm cursor-pointer min-h-[34px] ${
                isFollowing
                  ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E5EFF] hover:bg-[#DBEAFE]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Bell size={13} />
              {isFollowing
                ? isVi ? "Đang theo dõi" : "Following"
                : isVi ? "Theo dõi" : "Follow"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Premium Campaign Hero Section (Height: 420px) */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6">
        <div
          className="relative w-full h-[420px] rounded-[24px] overflow-hidden bg-cover bg-center shadow-lg border border-slate-200 flex flex-col justify-between p-6 md:p-10"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.5) 60%, rgba(0, 0, 0, 0.2) 100%), url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&h=600&q=80')`,
          }}
        >
          {/* Top Badges */}
          <div className="flex items-center justify-between">
            {campaignStatus === "completed" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#22C55E]/25 backdrop-blur-md text-[#22C55E] border border-[#22C55E]/30 rounded-full text-xs font-extrabold uppercase tracking-wider">
                <CheckCircle size={12} className="text-[#22C55E]" />
                {isVi ? "Đã hoàn thành" : "Completed"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E5EFF]/25 backdrop-blur-md text-[#1E5EFF] border border-[#1E5EFF]/30 rounded-full text-xs font-extrabold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E5EFF]" />
                {isVi ? "Đang chiêu mộ TNV" : "Recruiting TNV"}
              </span>
            )}

            <span className="px-3.5 py-1 bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={13} />
              {isVi ? "Môi trường" : "Environment"}
            </span>
          </div>

          {/* Main Content */}
          <div className="space-y-4 max-w-[850px] text-white">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
              {isVi ? "Chiến dịch Hành trình Xanh Hòa Xuân" : "Green Hoa Xuan Campaign"}
            </h1>
            <p className="text-white/85 text-xs md:text-sm leading-relaxed font-semibold drop-shadow-sm">
              {isVi
                ? "Chung tay cùng tình nguyện viên cộng đồng và chính quyền địa phương dọn dẹp các không gian công cộng, xóa bỏ các điểm đổ rác thải tự phát, cải thiện chất lượng môi trường sống tại Phường Hòa Xuân."
                : "Join community volunteers and local authorities to clean public spaces, remove illegal dumping sites, and improve environmental quality in Hoa Xuan Ward."}
            </p>

            {/* Statistics Row */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 border-t border-white/10 pt-4 mt-2">
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">{isVi ? "TNV Tham Gia" : "Participants"}</span>
                <span className="text-lg md:text-2xl font-black">{participantCount}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">{isVi ? "Chỉ tiêu tuyển" : "Target"}</span>
                <span className="text-lg md:text-2xl font-black">50</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">{isVi ? "Hoàn thành" : "Completion Rate"}</span>
                <span className="text-lg md:text-2xl font-black text-[#22C55E]">
                  {campaignStatus === "completed" ? "100%" : "68%"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">{isVi ? "Phản ánh liên quan" : "Related Reports"}</span>
                <span className="text-lg md:text-2xl font-black">18</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">{isVi ? "Hộ dân hưởng lợi" : "Affected Citizens"}</span>
                <span className="text-lg md:text-2xl font-black">1,245</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">{isVi ? "Còn lại" : "Days Left"}</span>
                <span className={`text-lg md:text-2xl font-black ${campaignStatus === "completed" ? "text-slate-400" : "text-amber-400"}`}>
                  {campaignStatus === "completed" ? "0" : "12"}
                </span>
              </div>
            </div>

            {/* Progress Bar & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="flex-grow max-w-[450px]">
                <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-1">
                  <span>{isVi ? "Tiến độ chiến dịch" : "Campaign Progress"}</span>
                  <span>{campaignStatus === "completed" ? "100%" : "68%"}</span>
                </div>
                <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#22C55E] to-emerald-400 rounded-full transition-all duration-1000 relative"
                    style={{ width: campaignStatus === "completed" ? "100%" : "68%" }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Volunteer avatars */}
                <div className="hidden sm:flex items-center -space-x-2.5 mr-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <img
                      key={i}
                      src={`https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80&sig=${i}`}
                      alt="volunteer"
                      className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover"
                    />
                  ))}
                  <span className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                    +{campaignStatus === "completed" ? "44" : "34"}
                  </span>
                </div>

                <button
                  onClick={handleJoinCampaign}
                  disabled={campaignStatus === "completed"}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer min-h-[44px] ${
                    campaignStatus === "completed"
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : isJoined
                        ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                        : "bg-[#1E5EFF] text-white hover:bg-blue-600 active:scale-95"
                  }`}
                >
                  {campaignStatus === "completed" ? (
                    isVi ? "Đã kết thúc" : "Ended"
                  ) : isJoined ? (
                    <span className="flex items-center gap-1.5">
                      <Check size={16} strokeWidth={3} />
                      {isVi ? "Đang tham gia" : "Joined"}
                    </span>
                  ) : (
                    isVi ? "Tham gia chiến dịch" : "Join Campaign"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Two-Column Layout (Left: 70%, Right: 30%) */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-8">
        
        {/* COMPLETION REPORT (Conditional Render when status = completed) */}
        {campaignStatus === "completed" && (
          <div className="bg-white rounded-[24px] border border-[#22C55E]/30 p-6 md:p-8 shadow-[0_12px_40px_rgba(34,197,94,0.08)] mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span className="w-8 h-8 rounded-full bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0">
                <CheckCircle size={18} strokeWidth={2.5} />
              </span>
              <div>
                <h2 className="text-[#0B2545] font-black text-xl leading-tight">
                  {isVi ? "Báo cáo tổng kết chiến dịch" : "Campaign Completion Report"}
                </h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isVi ? "Chiến dịch đã hoàn thành thành công" : "Campaign successfully finished"}
                </span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? "Trạng thái" : "Status"}</span>
                <span className="text-sm font-black text-[#22C55E] uppercase mt-1.5">{isVi ? "Hoàn thành" : "Completed"}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? "Thời gian diễn ra" : "Duration"}</span>
                <span className="text-sm font-black text-slate-800 mt-1.5">{isVi ? "15 ngày" : "15 Days"}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? "Tổng tình nguyện viên" : "Volunteers"}</span>
                <span className="text-sm font-black text-slate-800 mt-1.5">52 TNV</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? "Phản ánh đã xử lý" : "Reports Resolved"}</span>
                <span className="text-sm font-black text-slate-800 mt-1.5">18 / 18</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isVi ? "Mức độ hài lòng" : "Satisfaction"}</span>
                <span className="text-sm font-black text-amber-500 flex items-center gap-1 mt-1.5">★ 4.8 / 5.0</span>
              </div>
            </div>

            {/* Side-by-side / Interactive Before After Slider */}
            <div>
              <h3 className="text-sm font-extrabold text-[#0B2545] mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={16} className="text-[#22C55E]" />
                {isVi ? "Hình ảnh đối chiếu trước vs sau chiến dịch" : "Before vs After Comparison"}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Before Image Card */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/10] shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80"
                    alt="Before Cleanup"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute left-3.5 top-3.5 px-3 py-1 bg-red-600/90 text-white text-[10px] font-extrabold uppercase rounded-lg tracking-widest shadow-md">
                    {isVi ? "Trước chiến dịch (BEFORE)" : "BEFORE"}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 text-white text-xs font-semibold">
                    {isVi ? "Bãi rác tự phát ngập ngụa xà bần và túi nilon đường Trần Nam Trung." : "Illegal dumping site on Tran Nam Trung street prior to campaign."}
                  </div>
                </div>

                {/* After Image Card */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/10] shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80"
                    alt="After Cleanup"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute left-3.5 top-3.5 px-3 py-1 bg-green-600/90 text-white text-[10px] font-extrabold uppercase rounded-lg tracking-widest shadow-md">
                    {isVi ? "Sau chiến dịch (AFTER)" : "AFTER"}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 text-white text-xs font-semibold">
                    {isVi ? "Vỉa hè được làm sạch toàn diện, rải đá dăm phẳng và đặt bồn hoa tự quản." : "Sidewalk cleaned, gravel spread, and community flowers planted."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 items-start">
          
          {/* LEFT COLUMN: Detailed Campaign Management (10 Sections) */}
          <div className="space-y-8">

            {/* SECTION 1: Why This Campaign Exists */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Lý do khởi xướng chiến dịch" : "Why This Campaign Was Created"}
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <InfographicCard
                  icon={AlertOctagon}
                  label={isVi ? "Phản ánh kích hoạt" : "Reports Triggered"}
                  value="18 phản ánh"
                  desc={isVi ? "Phát sinh từ các kiến nghị khẩn thiết của công dân trên địa bàn." : "Originating from urgent citizen complaints."}
                />
                <InfographicCard
                  icon={Map}
                  label={isVi ? "Địa bàn ảnh hưởng" : "Affected Area"}
                  value="Phường Hòa Xuân"
                  desc={isVi ? "Trọng tâm dọc đường Trần Nam Trung và các tuyến mương sinh thái." : "Centering around Tran Nam Trung and ecological canals."}
                />
                <InfographicCard
                  icon={Users}
                  label={isVi ? "Người dân bị ảnh hưởng" : "Affected Citizens"}
                  value="1,245 người"
                  desc={isVi ? "Các hộ gia đình xung quanh chịu mùi hôi thối và ô nhiễm nguồn nước." : "Surrounding residents suffering from waste odor."}
                />
                <InfographicCard
                  icon={Flame}
                  label={isVi ? "Mức độ khẩn cấp" : "Issue Severity"}
                  value={isVi ? "Trung bình" : "Medium"}
                  desc={isVi ? "Cần xử lý ngay để phòng tránh ô nhiễm lan rộng mùa mưa lũ." : "Must resolve before the rainy season to prevent floods."}
                  color="text-amber-500"
                />
                <InfographicCard
                  icon={Trash2}
                  label={isVi ? "Vấn đề cốt lõi" : "Main Issue"}
                  value={isVi ? "Ùn ứ rác tự phát" : "Waste Accumulation"}
                  desc={isVi ? "Xà bần xây dựng đổ trộm và rác thải nhựa làm nghẽn dòng mương thoát nước." : "Illegal dumping of debris and plastics blocking drainage."}
                />
                <InfographicCard
                  icon={TrendingUp}
                  label={isVi ? "Chỉ số tác động" : "Impact Score"}
                  value="8.5 / 10"
                  desc={isVi ? "Mức độ ảnh hưởng tích cực đến cuộc sống khu dân cư sau dọn dẹp." : "The positive environmental restore rate after cleaning."}
                />
              </div>
            </section>

            {/* SECTION 2: Campaign Map */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                  <h2 className="text-[#0B2545] font-black text-xl">
                    {isVi ? "Bản đồ phân vùng chiến dịch" : "Interactive Campaign Map"}
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-inner flex items-center gap-1.5 self-start">
                  <MapPin size={12} className="text-[#1E5EFF]" />
                  {isVi ? "Bản đồ số Hòa Xuân" : "Hoa Xuan Ward Map"}
                </span>
              </div>

              {/* Map container lazy-load wrapper */}
              <Suspense
                fallback={
                  <div className="w-full h-[600px] bg-slate-100 rounded-[20px] flex items-center justify-center flex-col gap-3">
                    <span className="w-8 h-8 rounded-full border-4 border-[#1E5EFF] border-t-transparent animate-spin" />
                    <span className="text-sm font-semibold text-slate-500">{isVi ? "Đang tải bản đồ..." : "Loading Map..."}</span>
                  </div>
                }
              >
                <CampaignMap height="600px" />
              </Suspense>

              {/* Map interaction buttons */}
              <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                <button
                  onClick={() => toast.success(isVi ? "Đang phóng to chế độ xem bản đồ toàn màn hình..." : "Opening full screen map mode...")}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition cursor-pointer min-h-[36px]"
                >
                  {isVi ? "Mở Bản đồ Lớn" : "Open Full Map"}
                </button>
                <button
                  onClick={() => toast.success(isVi ? "Đang lấy vị trí GPS và mở Google Maps chỉ đường..." : "Getting GPS coordinates & opening navigation...")}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer min-h-[36px]"
                >
                  {isVi ? "Chỉ đường đi" : "Navigate"}
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById("reports-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer min-h-[36px]"
                >
                  {isVi ? "Xem danh sách phản ánh" : "View Related Reports"}
                </button>
              </div>
            </section>

            {/* SECTION 3: Related Reports (Triggering Campaign) */}
            <section id="reports-section" className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                  <h2 className="text-[#0B2545] font-black text-xl">
                    {isVi ? "Các phản ánh liên quan" : "Reports Triggering This Campaign"}
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  {isVi ? "Tổng số 18 phản ánh" : "18 reports total"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedReports.slice(0, 3).map((report) => (
                  <ReportTriggerCard key={report.id} report={report} isVi={isVi} />
                ))}
              </div>

              {/* Second row of related reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                {relatedReports.slice(3, 5).map((report) => (
                  <ReportTriggerCard key={report.id} report={report} isVi={isVi} />
                ))}
                
                {/* Quick Add Report Mock */}
                <div className="border-2 border-dashed border-slate-200 hover:border-[#1E5EFF]/50 rounded-xl p-5 flex flex-col justify-center items-center text-center gap-3 transition bg-slate-50/20 group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 group-hover:text-[#1E5EFF] group-hover:bg-[#1E5EFF]/10 flex items-center justify-center transition">
                    <PlusCircle size={22} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-700 text-xs">{isVi ? "Báo cáo sự cố mới phát sinh" : "Report new issue"}</h5>
                    <p className="text-slate-400 text-[10px] mt-1 leading-normal">
                      {isVi ? "Nếu bạn phát hiện bãi rác tự phát mới lân cận khu vực." : "If you detect any new waste heap in this ward area."}
                    </p>
                  </div>
                  <Link
                    to="/report"
                    className="px-4 py-1.5 bg-[#1E5EFF] text-white rounded-lg text-[10px] font-extrabold shadow-sm hover:bg-blue-600 transition"
                  >
                    {isVi ? "Gửi phản ánh ngay" : "Submit Issue"}
                  </Link>
                </div>
              </div>
            </section>

            {/* SECTION 4: Campaign Task Board (Kanban style) */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                  <h2 className="text-[#0B2545] font-black text-xl">
                    {isVi ? "Bảng công việc chiến dịch" : "Campaign Task Board"}
                  </h2>
                </div>

                <div className="flex items-center gap-1">
                  {["all", "todo", "inProgress", "completed"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTaskFilter(tab as any)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border cursor-pointer transition ${
                        selectedTaskFilter === tab
                          ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tab === "all" ? (isVi ? "Tất cả" : "All") : tab === "todo" ? (isVi ? "Cần làm" : "To Do") : tab === "inProgress" ? (isVi ? "Đang làm" : "In Progress") : (isVi ? "Đã xong" : "Completed")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid board of columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Column 1: TO DO */}
                <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/60 p-4 min-h-[300px]">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      {isVi ? "Việc cần làm" : "To Do"}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {kanbanTasks.filter((t) => t.column === "todo").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {kanbanTasks.filter((t) => t.column === "todo").map((task) => (
                      <KanbanTaskCard key={task.id} task={task} isVi={isVi} />
                    ))}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS */}
                <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/60 p-4 min-h-[300px]">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E5EFF] animate-pulse" />
                      {isVi ? "Đang thực hiện" : "In Progress"}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {kanbanTasks.filter((t) => t.column === "inProgress").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {kanbanTasks.filter((t) => t.column === "inProgress").map((task) => (
                      <KanbanTaskCard key={task.id} task={task} isVi={isVi} />
                    ))}
                  </div>
                </div>

                {/* Column 3: COMPLETED */}
                <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/60 p-4 min-h-[300px]">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      {isVi ? "Đã hoàn thành" : "Completed"}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {kanbanTasks.filter((t) => t.column === "completed").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {kanbanTasks.filter((t) => t.column === "completed").map((task) => (
                      <KanbanTaskCard key={task.id} task={task} isVi={isVi} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: Volunteer Activity Timeline */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-8">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Nhật ký tiến trình chi tiết" : "Volunteer Activity Timeline"}
                </h2>
              </div>

              <div className="relative pl-6 border-l border-slate-200 ml-4 space-y-8">
                {timelineActivities.map((act, idx) => (
                  <div key={idx} className="relative">
                    {/* Node */}
                    <span className={`absolute -left-[33px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                      act.progress === 100 ? "bg-[#22C55E]" : "bg-[#1E5EFF] animate-pulse"
                    }`} />

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-2">
                        <span className="text-xs font-black text-[#1E5EFF] uppercase tracking-wider">{act.team}</span>
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {act.time} - {act.date}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-800 text-sm md:text-base leading-tight mb-1">
                        {act.title}
                      </h4>

                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-3">
                        {act.desc}
                      </p>

                      {act.photos && act.photos.length > 0 && (
                        <div className="flex gap-2">
                          {act.photos.map((p, pIdx) => (
                            <img
                              key={pIdx}
                              src={p}
                              alt="Timeline capture"
                              className="w-28 h-18 rounded-lg object-cover border border-slate-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 6: Volunteer Team (Directory) */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Thành viên ban điều hành & TNV" : "Volunteer Team Directory"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {volunteerTeam.map((vol, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img src={vol.avatar} alt={vol.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        vol.status === "online" ? "bg-[#22C55E]" : vol.status === "busy" ? "bg-[#EF4444]" : "bg-slate-300"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate">{vol.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate mt-0.5">{vol.role}</div>
                      <div className="text-[9px] text-[#1E5EFF] font-bold truncate mt-0.5">{vol.org}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 7: Upcoming Activities Schedule */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Kế hoạch hoạt động tiếp theo" : "Upcoming Activities Schedule"}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pr-2">{isVi ? "Thời gian" : "Date/Time"}</th>
                      <th className="pb-3 pr-2">{isVi ? "Hoạt động" : "Activity Name"}</th>
                      <th className="pb-3 pr-2">{isVi ? "Địa điểm" : "Location"}</th>
                      <th className="pb-3 pr-2 text-right">{isVi ? "Dự kiến" : "Target"}</th>
                      <th className="pb-3 text-right">{isVi ? "Trạng thái" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {activitySchedule.map((sch, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/55 transition">
                        <td className="py-3.5 pr-2">
                          <span className="block font-bold text-slate-800">{sch.date}</span>
                          <span className="text-[10px] text-slate-400">{sch.time}</span>
                        </td>
                        <td className="py-3.5 pr-2 font-bold text-slate-800">{sch.name}</td>
                        <td className="py-3.5 pr-2 flex items-center gap-1 text-slate-500 mt-1">
                          <MapPin size={12} className="text-slate-400" />
                          {sch.loc}
                        </td>
                        <td className="py-3.5 pr-2 text-right font-bold text-slate-800">{sch.guests}</td>
                        <td className="py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                            sch.status === "upcoming"
                              ? "bg-blue-50 border-blue-100 text-[#1E5EFF]"
                              : "bg-slate-50 border-slate-100 text-slate-400"
                          }`}>
                            {sch.status === "upcoming" ? (isVi ? "Lên lịch" : "Scheduled") : (isVi ? "Dự thảo" : "Draft")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 8: Resource Support */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Dụng cụ & Cơ sở vật chất" : "Resource Support Inventory"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resourceInventory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-700 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{isVi ? "Số lượng sẵn có" : "Available quantity"}: {item.qty}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide shrink-0 ${
                      item.status === "enough"
                        ? "bg-green-50 border-green-100 text-green-700"
                        : "bg-amber-50 border-amber-100 text-amber-700"
                    }`}>
                      {item.status === "enough" ? (isVi ? "Đầy đủ" : "Sufficient") : (isVi ? "Bổ sung" : "Low Stock")}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 9: Campaign Gallery */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Thư viện hình ảnh đối chiếu" : "Campaign Gallery"}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <GalleryImage src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=300&q=80" label={isVi ? "Trước dọn dẹp" : "Before"} />
                <GalleryImage src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80" label={isVi ? "TNV ra quân" : "Volunteer Activities"} />
                <GalleryImage src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=80" label={isVi ? "Ảnh chụp Drone" : "Drone view"} />
                <GalleryImage src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80" label={isVi ? "Khuôn viên hoàn thành" : "After Cleanup"} />
                <GalleryImage src="https://images.unsplash.com/photo-1524252500348-1dac07b85f26?auto=format&fit=crop&w=300&q=80" label={isVi ? "Nghiệm thu cán bộ" : "Official Inspection"} />
                
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center cursor-pointer group shadow-sm">
                  <img src="https://images.unsplash.com/photo-1605600611284-6f52f6d2780e?auto=format&fit=crop&w=300&q=80" alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition" />
                  <span className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center z-10 shadow-lg group-hover:scale-110 transition">
                    ▶
                  </span>
                </div>
              </div>
            </section>

            {/* SECTION 10: Community Impact */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <div className="w-1.5 h-5 bg-[#1E5EFF] rounded-sm" />
                <h2 className="text-[#0B2545] font-black text-xl">
                  {isVi ? "Chỉ số tác động cộng đồng" : "Community Impact Dashboard"}
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <ImpactMetricRow label={isVi ? "Phản ánh đã xử lý" : "Reports Resolved"} value="18" sub={isVi ? "Đạt tỷ lệ 100%" : "100% completion"} color="text-[#22C55E]" />
                <ImpactMetricRow label={isVi ? "Hộ dân được giúp đỡ" : "Citizens Assisted"} value="1,245" sub={isVi ? "Toàn bộ khu vực Hòa Xuân" : "Hoa Xuan neighborhood"} color="text-[#1E5EFF]" />
                <ImpactMetricRow label={isVi ? "Lượng rác thu gom" : "Garbage Collected"} value="1.2 Tấn" sub={isVi ? "Rác sinh học và xà bần" : "Plastics and construction debris"} color="text-amber-500" />
                <ImpactMetricRow label={isVi ? "Cây xanh trồng mới" : "Trees Planted"} value="35 cây" sub={isVi ? "Vỉa hè & quanh hồ điều hòa" : "Sidewalks & Reservoir"} color="text-[#22C55E]" />
                <ImpactMetricRow label={isVi ? "Không gian công cộng sạch" : "Public Spaces Cleaned"} value="12 điểm" sub={isVi ? "Kênh hở và bãi đất trống" : "Vacant lots & canals"} color="text-[#1E5EFF]" />
                <ImpactMetricRow label={isVi ? "Điểm số môi trường phường" : "Environmental Score"} value="+28%" sub={isVi ? "Cải thiện so với tháng trước" : "Increase vs last month"} color="text-emerald-600" />
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR COLUMN: Demographic & Progress Analytics */}
          <div className="space-y-6">
            
            {/* WIDGET 1: Campaign Metadata */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-3">
                <FileText size={16} className="text-[#1E5EFF]" />
                {isVi ? "Thông tin chiến dịch" : "Campaign Information"}
              </h3>

              <div className="divide-y divide-slate-100 text-xs font-semibold">
                <SidebarRow label={isVi ? "Mã chiến dịch" : "Campaign ID"} value="DN-CAMP-2026-35" />
                <SidebarRow label={isVi ? "Loại chiến dịch" : "Campaign Type"} value={isVi ? "Cải tạo Môi trường đô thị" : "Urban Environment Cleanup"} />
                <SidebarRow label={isVi ? "Đơn vị khởi xướng" : "Created By"} value={isVi ? "Đoàn thanh niên & UBND phường" : "Youth Union & Ward Authority"} />
                <SidebarRow label={isVi ? "Cơ quan phụ trách" : "Responsible Unit"} value="UBND Phường Hòa Xuân" />
                <SidebarRow label={isVi ? "Quản lý chiến dịch" : "Campaign Manager"} value="Lê Tấn Tài (Phó chủ tịch)" />
                <SidebarRow label={isVi ? "Ngày bắt đầu" : "Start Date"} value="12/06/2026" />
                <SidebarRow label={isVi ? "Ngày kết thúc" : "End Date"} value="27/06/2026" />
                <SidebarRow label={isVi ? "Độ ưu tiên" : "Priority"} value={isVi ? "Trung bình" : "Medium"} />
                <SidebarRow label={isVi ? "Trạng thái hiện tại" : "Current Status"} value={campaignStatus === "completed" ? (isVi ? "Đã hoàn thành" : "Completed") : (isVi ? "Đang tiến hành" : "In Progress")} />
              </div>
            </section>

            {/* WIDGET 2: Demographics Pie Chart */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-3">
                <TrendingUp size={16} className="text-[#1E5EFF]" />
                {isVi ? "Thành phần tham gia" : "Demographics Statistics"}
              </h3>

              <div className="h-[180px] w-full mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {demographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white text-[11px] p-2 rounded shadow-md font-bold">
                              {payload[0].name}: {payload[0].value}%
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends */}
              <div className="mt-2 space-y-2">
                {demographicData.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="text-slate-800 font-bold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </section>

            {/* WIDGET 3: Campaign Progress */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-3">
                <CheckCircle size={16} className="text-[#1E5EFF]" />
                {isVi ? "Thống kê tiến trình" : "Campaign Progress"}
              </h3>

              <div className="space-y-4">
                <ProgressBarWidget
                  label={isVi ? "Tổng tiến độ hoàn thành" : "Overall Completion"}
                  current={campaignStatus === "completed" ? 20 : 14}
                  total={20}
                  percentage={campaignStatus === "completed" ? 100 : 68}
                  color="#1E5EFF"
                />
                <ProgressBarWidget
                  label={isVi ? "Công việc hoàn thành" : "Tasks Completed"}
                  current={campaignStatus === "completed" ? 20 : 14}
                  total={20}
                  percentage={campaignStatus === "completed" ? 100 : 70}
                  color="#22C55E"
                />
                <ProgressBarWidget
                  label={isVi ? "Phản ánh đã dứt điểm" : "Reports Resolved"}
                  current={campaignStatus === "completed" ? 18 : 12}
                  total={18}
                  percentage={campaignStatus === "completed" ? 100 : 67}
                  color="#F59E0B"
                />
                <ProgressBarWidget
                  label={isVi ? "Tỷ lệ tình nguyện viên có mặt" : "Volunteer Attendance"}
                  current={92}
                  total={100}
                  percentage={92}
                  color="#8B5CF6"
                />
              </div>
            </section>

            {/* WIDGET 4: Community Leaders */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-3">
                <Users size={16} className="text-[#1E5EFF]" />
                {isVi ? "Ban điều hành chiến dịch" : "Community Leaders"}
              </h3>

              <div className="space-y-3">
                <LeaderRow name="Lê Tấn Tài" role={isVi ? "Trưởng ban điều hành" : "Campaign Leader"} avatar="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=100&q=80" />
                <LeaderRow name="Trần Nguyễn Hạnh" role={isVi ? "Đại diện Phường" : "Ward Representative"} avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80" />
                <LeaderRow name="Nguyễn Hoàng Hải" role={isVi ? "Đại diện Đoàn thanh niên" : "Youth Union Leader"} avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" />
                <LeaderRow name="Nguyễn Văn Hùng" role={isVi ? "Điều phối viên TNV" : "Volunteer Coordinator"} avatar="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" />
              </div>
            </section>

            {/* WIDGET 5: Quick Actions */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-3">
                <ListTodo size={16} className="text-[#1E5EFF]" />
                {isVi ? "Thao tác nhanh" : "Quick Actions"}
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleJoinCampaign}
                  disabled={campaignStatus === "completed"}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-150 group cursor-pointer text-[#1E5EFF] ${
                    campaignStatus === "completed"
                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                      : "bg-[#1E5EFF]/5 hover:bg-[#1E5EFF]/10 border-[#1E5EFF]/10"
                  }`}
                >
                  <Users size={18} className="group-hover:scale-110 transition duration-150" />
                  <span className="text-[10px] font-extrabold">
                    {campaignStatus === "completed" ? (isVi ? "Đã kết thúc" : "Ended") : isJoined ? (isVi ? "Rút đơn" : "Unregister") : (isVi ? "Tham gia" : "Join")}
                  </span>
                </button>

                <button
                  onClick={() => toast.success(isVi ? "Đã tạo link mời bạn bè!" : "Friend invite link copied!")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-150 group cursor-pointer text-slate-700"
                >
                  <Share2 size={18} className="group-hover:scale-110 transition duration-150 text-slate-500" />
                  <span className="text-[10px] font-extrabold">{isVi ? "Mời bạn" : "Invite Friends"}</span>
                </button>

                <button
                  onClick={() => toast.success(isVi ? "Bắt đầu tải PDF tổng kết..." : "Downloading Campaign PDF summary...")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-150 group cursor-pointer text-slate-700"
                >
                  <Download size={18} className="group-hover:scale-110 transition duration-150 text-slate-500" />
                  <span className="text-[10px] font-extrabold">{isVi ? "Tải File PDF" : "Download PDF"}</span>
                </button>

                <button
                  onClick={handleFollowCampaign}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-150 group cursor-pointer text-slate-700"
                >
                  <Bell size={18} className="group-hover:scale-110 transition duration-150 text-slate-500" />
                  <span className="text-[10px] font-extrabold">
                    {isFollowing ? (isVi ? "Bỏ theo dõi" : "Unfollow") : (isVi ? "Theo dõi" : "Follow")}
                  </span>
                </button>

                <button
                  onClick={() => toast.info(isVi ? "Liên hệ quản lý chiến dịch qua Hotline: 0236.3.888.999" : "Contact Organizer via Hotline: 0236.3.888.999")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-150 group cursor-pointer text-slate-700"
                >
                  <MessageSquare size={18} className="text-slate-500" />
                  <span className="text-[10px] font-extrabold">{isVi ? "Liên hệ BTC" : "Contact Organizer"}</span>
                </button>

                <Link
                  to="/report"
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-150 group cursor-pointer text-slate-700"
                >
                  <AlertOctagon size={18} className="text-slate-500" />
                  <span className="text-[10px] font-extrabold">{isVi ? "Gửi phản ánh" : "Report Issue"}</span>
                </Link>
              </div>
            </section>

            {/* WIDGET 6: Latest Announcements */}
            <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0B2545] border-b border-slate-50 pb-3 mb-3">
                <Bell size={16} className="text-[#1E5EFF]" />
                {isVi ? "Thông báo mới nhận" : "Latest Announcements"}
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="relative pl-3 border-l-2 border-[#1E5EFF]">
                  <div className="font-bold text-slate-800">{isVi ? "Tuyển dụng tình nguyện viên đợt 2" : "Volunteer Registration Open"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isVi ? "Bắt đầu tiếp nhận thêm 15 TNV dọn vệ sinh kênh rạch" : "Targeting 15 additional volunteers to join canal cleanup"}</div>
                </div>
                <div className="relative pl-3 border-l-2 border-slate-200">
                  <div className="font-bold text-slate-800">{isVi ? "Cập nhật lịch trình dọn dẹp" : "Schedule Updated"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isVi ? "Ngày ra quân dọn rác đợt 2 lùi sang 7:30 AM ngày 16/06" : "Cleanup day shifted to 7:30 AM on June 16"}</div>
                </div>
                <div className="relative pl-3 border-l-2 border-[#EF4444]">
                  <div className="font-bold text-red-600">{isVi ? "Cảnh báo thời tiết nắng nóng" : "Weather Alert"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isVi ? "Khuyến cáo TNV mang mũ rộng vành và bổ sung nước điện giải" : "Volunteers are advised to wear hats and stay hydrated"}</div>
                </div>
                <div className="relative pl-3 border-l-2 border-slate-200">
                  <div className="font-bold text-slate-800">{isVi ? "Thêm công việc: Sơn vẽ tranh tường công cộng" : "New Task Added"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isVi ? "Cải tạo bức tường bẩn dọc ngõ 15 thành tranh tuyên truyền" : "Repainting defaced walls along Alley 15 with propaganda art"}</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Volunteer Comments & Discussions */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-10">
        <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
            <MessageSquare size={20} className="text-[#1E5EFF]" />
            <h2 className="text-[#0B2545] font-black text-xl">
              {isVi ? "Ý kiến đóng góp & Thảo luận của người dân" : "Community Discussion"}
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
              {comments.length}
            </span>
          </div>

          {/* Comment input form */}
          <form onSubmit={handleAddComment} className="flex gap-4 items-start mb-8">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
              alt="User avatar"
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="flex-1 space-y-3">
              <textarea
                rows={3}
                placeholder={isVi ? "Nhập ý kiến đóng góp, phản hồi hoặc câu hỏi của bạn..." : "Add your feedback, comment, or query here..."}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs md:text-sm text-slate-800 focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] outline-none transition bg-[#F8FAFC]/50"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E5EFF] text-white text-xs font-extrabold rounded-lg hover:bg-blue-600 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Send size={12} />
                  {isVi ? "Gửi ý kiến" : "Post Comment"}
                </button>
              </div>
            </div>
          </form>

          {/* Comments Feed List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 items-start border-t border-slate-50 pt-5 first:border-t-0 first:pt-0">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-grow space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-extrabold text-slate-800 text-xs md:text-sm">{comment.author}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                      {comment.role}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{comment.time}</span>
                  </div>

                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                    {comment.text}
                  </p>

                  {/* Actions (Like/Reply) */}
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                    <button
                      onClick={() => toast.success(isVi ? "Cảm ơn bạn đã thả tim!" : "Heart added!")}
                      className="flex items-center gap-1 hover:text-red-500 transition cursor-pointer"
                    >
                      <Heart size={12} />
                      {comment.likes}
                    </button>
                    <button
                      onClick={() => toast.info(isVi ? "Chức năng phản hồi bình luận đang được xây dựng!" : "Reply feature coming soon!")}
                      className="hover:text-[#1E5EFF] transition cursor-pointer"
                    >
                      {isVi ? "Phản hồi" : "Reply"}
                    </button>
                  </div>

                  {/* Nested replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 items-start">
                          <img
                            src={reply.avatar}
                            alt={reply.author}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <span className="font-extrabold text-slate-800 text-xs">{reply.author}</span>
                              <span className="text-[9px] bg-blue-50 text-[#1E5EFF] border border-blue-100 px-1.5 py-0.5 rounded font-bold uppercase">
                                {reply.role}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">{reply.time}</span>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed mt-1">
                              {reply.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOCAL SUB-COMPONENTS ────────────────────────────────────

function InfographicCard({ icon: Icon, label, value, desc, color }: { icon: any; label: string; value: string; desc: string; color?: string }) {
  return (
    <div className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-[#1E5EFF]/20 rounded-2xl transition duration-150 flex flex-col gap-2 shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center">
        <Icon size={16} />
      </div>
      <div className="mt-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
        <span className={`text-sm md:text-base font-black ${color || "text-slate-800"} block mt-0.5`}>{value}</span>
      </div>
      <p className="text-slate-500 text-[10px] leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function ReportTriggerCard({ report, isVi }: { report: any; isVi: boolean }) {
  const statusColorMap: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-orange-50 border-orange-100", text: "text-orange-700" },
    inProgress: { bg: "bg-blue-50 border-blue-100", text: "text-[#1E5EFF]" },
    resolved: { bg: "bg-green-50 border-green-100", text: "text-green-700" },
  };
  const statusColors = statusColorMap[report.status] || { bg: "bg-slate-50 border-slate-100", text: "text-slate-600" };

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden shadow-sm hover:shadow transition flex flex-col justify-between">
      <div>
        <div className="relative aspect-video bg-slate-100 border-b border-slate-200/50">
          <img src={report.img} alt={report.title} className="w-full h-full object-cover" />
          <span className={`absolute right-2.5 top-2.5 px-2.5 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wide shadow-sm ${statusColors.bg} ${statusColors.text}`}>
            {report.status === "resolved" ? (isVi ? "Đã xong" : "Resolved") : report.status === "inProgress" ? (isVi ? "Đang xử lý" : "In Progress") : (isVi ? "Chờ duyệt" : "Pending")}
          </span>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>{report.category}</span>
            <span className={report.priority === "high" ? "text-[#EF4444]" : "text-slate-500"}>
              {report.priority === "high" ? "Urgent" : "Medium"}
            </span>
          </div>

          <h4 className="font-extrabold text-slate-800 text-xs md:text-sm line-clamp-2 leading-snug">
            {report.title}
          </h4>

          <div className="text-[10px] text-slate-500 leading-relaxed space-y-0.5 font-semibold pt-2 border-t border-slate-50">
            <div><span className="text-slate-400">{isVi ? "Cách đây:" : "Distance:"}</span> {report.dist}</div>
            <div className="truncate"><span className="text-slate-400">{isVi ? "Chịu trách nhiệm:" : "Assigned:"}</span> {report.unit}</div>
            <div><span className="text-slate-400">{isVi ? "Ngày gửi:" : "Date:"}</span> {report.date}</div>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <Link
          to={`/my-reports/${report.id}` as any}
          className="w-full py-2 bg-slate-50 hover:bg-[#1E5EFF]/5 border border-slate-200 hover:border-[#1E5EFF]/20 rounded-lg text-slate-700 hover:text-[#1E5EFF] text-[10px] font-bold text-center block transition cursor-pointer"
        >
          {isVi ? "Xem chi tiết" : "View Details"}
        </Link>
      </div>
    </div>
  );
}

function KanbanTaskCard({ task, isVi }: { task: any; isVi: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow transition space-y-3">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
        <span className="text-slate-400">{task.team}</span>
        <span className={
          task.priority === "high" ? "text-[#EF4444] bg-red-50 border border-red-100 px-1.5 py-0.2 rounded" : 
          task.priority === "medium" ? "text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded" : 
          "text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded"
        }>
          {task.priority === "high" ? (isVi ? "Khẩn" : "High") : task.priority === "medium" ? (isVi ? "Thường" : "Med") : (isVi ? "Thấp" : "Low")}
        </span>
      </div>

      <h4 className="font-extrabold text-slate-800 text-xs md:text-sm leading-snug">
        {task.title}
      </h4>

      <div className="text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-2">
        {task.volunteers} {isVi ? "TN viên được giao" : "Volunteers assigned"}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span>{isVi ? "Hạn: " : "Due: "} {task.due}</span>
          <span>{task.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              task.progress === 100 ? "bg-[#22C55E]" : task.progress > 0 ? "bg-[#1E5EFF]" : "bg-slate-200"
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function GalleryImage({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
      <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-2.5">
        <span className="text-white text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5 flex justify-between items-start text-xs font-semibold gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-800 font-bold text-right">{value}</span>
    </div>
  );
}

function ProgressBarWidget({ label, current, total, percentage, color }: { label: string; current: number; total: number; percentage: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-800 font-bold">{current}/{total} ({percentage}%)</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function LeaderRow({ name, role, avatar }: { name: string; role: string; avatar: string }) {
  return (
    <div className="flex items-center gap-3">
      <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs font-extrabold text-slate-800 truncate">{name}</div>
        <div className="text-[10px] text-slate-400 font-bold truncate uppercase">{role}</div>
      </div>
    </div>
  );
}

function ImpactMetricRow({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-1 shadow-sm">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`text-base md:text-xl font-black ${color} block mt-1`}>{value}</span>
      </div>
      <p className="text-slate-400 text-[10px] font-semibold leading-tight mt-1">{sub}</p>
    </div>
  );
}
