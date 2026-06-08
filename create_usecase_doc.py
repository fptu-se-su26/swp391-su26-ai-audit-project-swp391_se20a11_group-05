from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

doc = Document()

# ---- Styles ----
style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(13)

for s in ['Heading 1','Heading 2','Heading 3']:
    hs = doc.styles[s]
    hs.font.name = 'Times New Roman'
    hs.font.color.rgb = RGBColor(0, 51, 102)

def set_cell_shading(cell, color):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def add_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1+len(rows), cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Header
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(12)
                r.font.color.rgb = RGBColor(255,255,255)
        set_cell_shading(cell, "003366")
    # Rows
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = table.rows[ri+1].cells[ci]
            cell.text = str(val)
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(12)
            if ri % 2 == 1:
                set_cell_shading(cell, "E8F0FE")
    if col_widths:
        for ri, row in enumerate(table.rows):
            for ci, w in enumerate(col_widths):
                row.cells[ci].width = Cm(w)
    return table

# ============ CONTENT ============

# Title
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("PHÂN TÍCH USE CASE DIAGRAM\n")
r.bold = True; r.font.size = Pt(22); r.font.color.rgb = RGBColor(0,51,102)
r = p.add_run("Hệ thống Lắng nghe Đà Nẵng (Da Nang Listening System)")
r.font.size = Pt(16); r.font.color.rgb = RGBColor(0,102,153)

doc.add_paragraph()

# ---- Overview ----
doc.add_heading('1. Tổng quan các Actor', level=1)
doc.add_paragraph('Hệ thống có 6 actor chính, mỗi actor đảm nhận một vai trò riêng biệt:')

add_table(doc,
    ["#", "Actor", "Vai trò"],
    [
        ["1", "Citizen (Công dân)", "Người dùng cuối – gửi phản ánh, theo dõi kết quả"],
        ["2", "Super Admin", "Quản trị viên cấp cao – quản lý toàn bộ hệ thống"],
        ["3", "User (Người dùng chung)", "Actor tổng quát – đăng nhập/đăng xuất"],
        ["4", "Commune People's Committee Officer (Ward Staff)", "Cán bộ phường/xã – tiếp nhận và xử lý phản ánh"],
        ["5", "Police Staff (Công an)", "Công an – xử lý vi phạm, phát cảnh báo"],
        ["6", "AI Service", "Dịch vụ AI – phân loại, kiểm tra tự động"],
    ],
    [1.5, 7, 9]
)

doc.add_paragraph()

# ---- Actor 1: Citizen ----
doc.add_heading('2. Citizen (Công dân)', level=1)
doc.add_paragraph('Đây là actor chính của hệ thống, có nhiều use case nhất. Công dân sử dụng hệ thống để gửi phản ánh, theo dõi tiến trình xử lý và đánh giá kết quả.')

doc.add_heading('2.1. Danh sách Use Case', level=2)
add_table(doc,
    ["Use Case", "Mô tả", "Quan hệ"],
    [
        ["Register an account", "Đăng ký tài khoản (xác minh SĐT, CCCD)", "«include» → SMS verification"],
        ["Verify Citizen Identity", "Xác minh danh tính công dân", "—"],
        ["Update profile", "Cập nhật thông tin cá nhân", "—"],
        ["Submit new feedback", "Gửi phản ánh mới đến hệ thống", "«include» → Select Category, Integrated automatic GPS, Update metadata and img"],
        ["See reflected history", "Xem lịch sử các phản ánh đã gửi", "—"],
        ["See monitor status", "Xem trạng thái giám sát/xử lý", "«include» từ Evaluate treatment results"],
        ["Evaluate treatment results", "Đánh giá kết quả xử lý phản ánh", "—"],
        ["Create Community Campaign", "Tạo chiến dịch cộng đồng", "«include» → Receive notifications"],
    ],
    [5, 7, 6]
)

doc.add_heading('2.2. Quy trình hoạt động', level=2)
steps = [
    "Bước 1: Công dân đăng ký tài khoản → Hệ thống gửi SMS xác minh → Xác minh danh tính công dân.",
    "Bước 2: Đăng nhập hệ thống → Cập nhật thông tin cá nhân (profile).",
    "Bước 3: Gửi phản ánh mới: bắt buộc phải chọn danh mục (Select Category), hệ thống tự động lấy tọa độ GPS, và cập nhật ảnh/metadata.",
    "Bước 4: Theo dõi lịch sử phản ánh đã gửi (See reflected history).",
    "Bước 5: Xem trạng thái xử lý phản ánh (See monitor status).",
    "Bước 6: Đánh giá kết quả xử lý sau khi phản ánh được giải quyết.",
    "Bước 7: Tạo chiến dịch cộng đồng và nhận thông báo liên quan.",
]
for s in steps:
    doc.add_paragraph(s, style='List Bullet')

doc.add_paragraph()

# ---- Actor 2: Super Admin ----
doc.add_heading('3. Super Admin (Quản trị viên cấp cao)', level=1)
doc.add_paragraph('Super Admin chịu trách nhiệm quản trị toàn bộ hệ thống, từ quản lý tài khoản đến giám sát hiệu suất.')

doc.add_heading('3.1. Danh sách Use Case', level=2)
add_table(doc,
    ["Use Case", "Mô tả"],
    [
        ["Account management & moderation", "Quản lý và kiểm duyệt tài khoản người dùng"],
        ["Lock/Unlock account", "Khóa hoặc mở khóa tài khoản"],
        ["Incident category configuration management", "Cấu hình danh mục sự cố/phản ánh"],
        ["System knowledge management", "Quản lý cơ sở tri thức của hệ thống"],
        ["Import PDF/Excel testing result", "Nhập kết quả kiểm tra từ file PDF/Excel"],
        ["Network navigation", "Điều hướng mạng lưới hệ thống"],
        ["Management of employee administrative functions", "Quản lý chức năng hành chính nhân viên"],
        ["Urban statistics dashboard", "Bảng thống kê tình hình đô thị"],
        ["Unit KPI performance monitoring", "Giám sát KPI hiệu suất từng đơn vị"],
    ],
    [7, 11]
)

doc.add_heading('3.2. Quy trình hoạt động', level=2)
steps = [
    "Bước 1: Đăng nhập hệ thống với quyền Super Admin.",
    "Bước 2: Quản lý tài khoản – tạo, sửa, khóa/mở khóa tài khoản người dùng.",
    "Bước 3: Cấu hình danh mục sự cố để phân loại phản ánh.",
    "Bước 4: Quản lý cơ sở tri thức hệ thống (knowledge base).",
    "Bước 5: Import dữ liệu kiểm tra từ file PDF/Excel.",
    "Bước 6: Quản lý nhân sự và chức năng hành chính.",
    "Bước 7: Xem dashboard thống kê đô thị tổng quan.",
    "Bước 8: Giám sát KPI hiệu suất các đơn vị xử lý.",
]
for s in steps:
    doc.add_paragraph(s, style='List Bullet')

doc.add_paragraph()

# ---- Actor 3: User ----
doc.add_heading('4. User (Người dùng chung)', level=1)
doc.add_paragraph('Đây là actor tổng quát, đại diện cho tất cả người dùng hệ thống. Các actor khác (Citizen, Super Admin, Ward Staff, Police Staff) đều kế thừa chức năng đăng nhập/đăng xuất từ actor này.')

doc.add_heading('4.1. Danh sách Use Case', level=2)
add_table(doc,
    ["Use Case", "Mô tả"],
    [
        ["Login/Logout of the system (System authorization)", "Đăng nhập và đăng xuất hệ thống"],
        ["Forgot password", "Khôi phục mật khẩu khi quên"],
    ],
    [7, 11]
)

doc.add_heading('4.2. Quy trình hoạt động', level=2)
steps = [
    "Bước 1: Người dùng truy cập hệ thống → Đăng nhập bằng tài khoản đã đăng ký.",
    "Bước 2: Nếu quên mật khẩu → Sử dụng chức năng Forgot password để khôi phục.",
    "Bước 3: Sau khi hoàn thành công việc → Đăng xuất khỏi hệ thống.",
]
for s in steps:
    doc.add_paragraph(s, style='List Bullet')

doc.add_paragraph()

# ---- Actor 4: Ward Staff ----
doc.add_heading('5. Commune People\'s Committee Officer – Ward Staff (Cán bộ phường/xã)', level=1)
doc.add_paragraph('Cán bộ phường/xã đóng vai trò xử lý trung gian – tiếp nhận phản ánh từ công dân, điều phối xử lý và báo cáo kết quả.')

doc.add_heading('5.1. Danh sách Use Case', level=2)
add_table(doc,
    ["Use Case", "Mô tả", "Quan hệ"],
    [
        ["Forward inter-sectoral dossier", "Chuyển hồ sơ liên ngành đến đơn vị phối hợp", "«extends» → Forward inter-sectoral dossier"],
        ["Manage schedule implementation", "Quản lý lịch trình thực hiện xử lý", "—"],
        ["Consent to trash", "Đồng ý hủy/loại bỏ phản ánh không hợp lệ", "—"],
        ["Request to supplement information", "Yêu cầu công dân bổ sung thông tin", "—"],
        ["Report results (Attach supporting documents)", "Báo cáo kết quả xử lý kèm tài liệu", "«include» → Forward inter-sectoral dossier"],
    ],
    [5, 7, 6]
)

doc.add_heading('5.2. Quy trình hoạt động', level=2)
steps = [
    "Bước 1: Đăng nhập hệ thống → Nhận danh sách phản ánh được chuyển đến.",
    "Bước 2: Xem xét phản ánh – nếu thiếu thông tin → Yêu cầu bổ sung thông tin từ công dân.",
    "Bước 3: Nếu phản ánh không hợp lệ → Consent to trash (đồng ý loại bỏ).",
    "Bước 4: Nếu cần phối hợp liên ngành → Chuyển hồ sơ liên ngành.",
    "Bước 5: Quản lý lịch trình xử lý phản ánh.",
    "Bước 6: Báo cáo kết quả xử lý, đính kèm tài liệu chứng minh.",
]
for s in steps:
    doc.add_paragraph(s, style='List Bullet')

doc.add_paragraph()

# ---- Actor 5: Police Staff ----
doc.add_heading('6. Police Staff (Công an)', level=1)
doc.add_paragraph('Công an tập trung vào xử lý các phản ánh liên quan đến an ninh trật tự, quản lý bằng chứng video và phát cảnh báo khu vực.')

doc.add_heading('6.1. Danh sách Use Case', level=2)
add_table(doc,
    ["Use Case", "Mô tả", "Quan hệ"],
    [
        ["Issue a regional warning report", "Phát cảnh báo an ninh cho khu vực", "—"],
        ["Receive and respond to feedback", "Nhận và phản hồi phản ánh từ công dân", "«include» → Store and share video footage"],
        ["Store and share video footage", "Lưu trữ và chia sẻ video bằng chứng", "—"],
        ["Record violation/handling record", "Ghi nhận vi phạm và lập biên bản xử lý", "—"],
    ],
    [5, 7, 6]
)

doc.add_heading('6.2. Quy trình hoạt động', level=2)
steps = [
    "Bước 1: Đăng nhập hệ thống → Nhận phản ánh liên quan đến an ninh trật tự.",
    "Bước 2: Phản hồi phản ánh → Bắt buộc lưu trữ và chia sẻ video bằng chứng.",
    "Bước 3: Ghi nhận vi phạm và lập biên bản xử lý.",
    "Bước 4: Nếu tình huống nghiêm trọng → Phát cảnh báo an ninh khu vực.",
]
for s in steps:
    doc.add_paragraph(s, style='List Bullet')

doc.add_paragraph()

# ---- Actor 6: AI Service ----
doc.add_heading('7. AI Service (Dịch vụ AI)', level=1)
doc.add_paragraph('AI Service hoạt động tự động ở backend, hỗ trợ phân loại phản ánh, phát hiện trùng lặp, và xác thực bằng chứng ảnh.')

doc.add_heading('7.1. Danh sách Use Case', level=2)
add_table(doc,
    ["Use Case", "Mô tả", "Được kích hoạt khi"],
    [
        ["Chatbot AI questions and answers procedures", "Chatbot hỏi đáp thủ tục hành chính", "Citizen cần hỗ trợ thông tin"],
        ["AI classify feedback", "AI tự động phân loại phản ánh", "Có phản ánh mới được gửi"],
        ["AI Detect duplicate reflections", "AI phát hiện phản ánh trùng lặp", "Có phản ánh mới được gửi"],
        ["AI checks photo evidence", "AI kiểm tra và xác thực ảnh bằng chứng", "Có ảnh đính kèm trong phản ánh"],
    ],
    [5, 7, 6]
)

doc.add_heading('7.2. Quy trình hoạt động', level=2)
steps = [
    "Khi Citizen gửi phản ánh mới → AI tự động phân loại phản ánh vào danh mục phù hợp.",
    "AI kiểm tra phản ánh có trùng lặp với phản ánh đã tồn tại hay không.",
    "Nếu có ảnh đính kèm → AI kiểm tra và xác thực tính hợp lệ của ảnh bằng chứng.",
    "Khi Citizen cần hỗ trợ → Chatbot AI trả lời câu hỏi về thủ tục hành chính.",
]
for s in steps:
    doc.add_paragraph(s, style='List Bullet')

doc.add_paragraph()

# ---- Summary ----
doc.add_heading('8. Tổng kết luồng hoạt động chính', level=1)
doc.add_paragraph('Dưới đây là luồng hoạt động tổng thể của hệ thống từ khi phản ánh được gửi đến khi hoàn tất xử lý:')

steps = [
    "1. Citizen gửi phản ánh mới (kèm danh mục, GPS, ảnh).",
    "2. AI Service tự động: phân loại phản ánh → kiểm tra trùng lặp → xác thực ảnh bằng chứng.",
    "3. Hệ thống chuyển phản ánh đến Ward Staff hoặc Police Staff tùy theo danh mục.",
    "4. Ward Staff xử lý phản ánh: yêu cầu bổ sung thông tin, chuyển liên ngành nếu cần.",
    "5. Police Staff xử lý các phản ánh liên quan an ninh: ghi nhận vi phạm, lưu video bằng chứng.",
    "6. Đơn vị xử lý báo cáo kết quả.",
    "7. Citizen đánh giá kết quả xử lý.",
    "8. Super Admin giám sát KPI toàn bộ quy trình và quản lý hệ thống.",
]
for s in steps:
    doc.add_paragraph(s, style='List Number')

# Save
output_path = r"c:\Users\Admin\Documents\GitHub\swp391-su26-ai-audit-project-swp391_se20a11_group-05\UseCase_Analysis_DaNang_Listening_System.docx"
doc.save(output_path)
print(f"File saved: {output_path}")
