import React from "react";

/**
 * Translates notification title dynamically based on its type and current locale.
 */
export function translateNotificationTitle(
  title: string | undefined | null,
  type: string | undefined | null,
  locale: string,
): string {
  if (!title) return "";
  if (locale === "vi") return title;

  switch (type) {
    case "FEEDBACK_SUBMITTED":
      return "Feedback Submitted Successfully";
    case "FEEDBACK_REJECTED":
      return title.includes("❌") ? "❌ Report Not Accepted" : "Report Rejected";
    case "FEEDBACK_WAITING_INFO":
      return "Ward Officer Requests Additional Information";
    case "FEEDBACK_INFO_SUPPLEMENTED":
      return "Citizen Supplemented Information";
    case "FEEDBACK_ASSIGNED_TO_WARD":
      return "New Report Pending Processing";
    case "FEEDBACK_COMPLETED":
      return "Report Completed";
    case "FEEDBACK_IN_PROGRESS":
      return "Report In Progress";
    case "FEEDBACK_STATUS_UPDATED":
      return "Report Status Updated";
    case "CAMPAIGN_CANCELLED":
      return title.includes("thành công")
        ? "Campaign Cancelled Successfully"
        : "Campaign Cancelled";
    case "CAMPAIGN_RESCHEDULED":
      return title.includes("thành công")
        ? "Campaign Updated Successfully"
        : "Campaign Rescheduled";
    case "CAMPAIGN_FINALIZED":
      return title.includes("thành công") ? "Campaign Finalized Successfully" : "Campaign Active";
    case "CAMPAIGN_ENDED":
      return title.includes("thành công") ? "Campaign Ended Successfully" : "Campaign Ended";
    case "CAMPAIGN_APPROVED":
      return "Campaign Registration Approved";
    case "CAMPAIGN_REJECTED":
      return "Campaign Registration Rejected";
    case "CAMPAIGN_WARNING":
      return "Campaign Absence Warning";
    case "CAMPAIGN_BANNED":
      return "Banned from Campaigns";
    case "NEW_CAMPAIGN_APPEAL":
      return "New Appeal Submitted";
    case "CAMPAIGN_APPEAL_APPROVED":
      return "Campaign Appeal Approved";
    case "CAMPAIGN_APPEAL_REJECTED":
      return "Campaign Appeal Rejected";
    default:
      // Fallback translation rules for general titles
      if (title.includes("Gửi phản ánh thành công")) return "Feedback Submitted Successfully";
      if (title.includes("phản ánh chưa được tiếp nhận") || title.includes("phản ánh bị từ chối"))
        return "Report Rejected";
      if (title.includes("bổ sung thông tin")) return "Information Supplement Request";
      if (title.includes("phản ánh đã hoàn thành")) return "Report Completed";
      if (title.includes("phản ánh đang xử lý")) return "Report In Progress";
      if (title.includes("Chiến dịch đã bị hủy")) return "Campaign Cancelled";
      if (title.includes("Chiến dịch thay đổi lịch trình")) return "Campaign Rescheduled";
      if (title.includes("Chiến dịch đã kết thúc")) return "Campaign Ended";
      if (title.includes("Đăng ký chiến dịch được duyệt")) return "Campaign Registration Approved";
      if (title.includes("Đăng ký chiến dịch bị từ chối")) return "Campaign Registration Rejected";
      if (title.includes("Cảnh cáo vắng mặt chiến dịch")) return "Campaign Absence Warning";
      if (title.includes("Bị cấm tham gia chiến dịch")) return "Banned from Campaigns";
      if (title.includes("Có đơn giải trình mới")) return "New Appeal Submitted";
      if (title.includes("Đơn xin mở khóa chiến dịch được duyệt"))
        return "Campaign Appeal Approved";
      if (title.includes("Đơn xin mở khóa chiến dịch bị từ chối"))
        return "Campaign Appeal Rejected";
      return title;
  }
}

function translateStatusWord(status: string): string {
  switch (status.trim()) {
    case "Đã gửi":
      return "Submitted";
    case "Chờ tiếp nhận":
      return "Awaiting review";
    case "Đang xử lý":
      return "In progress";
    case "Cần bổ sung thông tin":
      return "Needs info supplement";
    case "Đã xử lý":
      return "Resolved";
    case "Đã hoàn thành":
      return "Completed";
    case "Đã từ chối":
      return "Rejected";
    default:
      return status;
  }
}

/**
 * Translates notification content template dynamically based on its type and current locale.
 */
export function translateNotificationContent(
  content: string | undefined | null,
  type: string | undefined | null,
  locale: string,
): string {
  if (!content) return "";
  if (locale === "vi") return content;

  // 1. FEEDBACK_SUBMITTED
  if (content.includes("Phản ánh của bạn đã được ghi nhận và đang chờ tiếp nhận.")) {
    return "Your report has been received and is awaiting review.";
  }

  // 2. FEEDBACK_REJECTED
  // "Phản ánh của bạn chứa ngôn từ chưa phù hợp..."
  if (content.includes("chứa ngôn từ chưa phù hợp")) {
    return "Your report contains language that does not comply with community standards. Please adjust the content and resubmit. We are always ready to listen!";
  }
  // "Hình ảnh hoặc nội dung mô tả trong phản ánh chưa đủ rõ ràng..."
  if (content.includes("chưa đủ rõ ràng để xác minh")) {
    return "The image or description in the report is not clear enough for verification. Please add actual photo/video with clear angle and detailed description, then resubmit.";
  }
  // "Phản ánh FB-XXX đã bị từ chối. Lý do: ..."
  const rejectRegex = /^Phản ánh\s+(FB-[A-Z0-9]+)\s+đã bị từ chối\.\s+Lý do:\s+(.*)$/i;
  const rejectMatch = content.match(rejectRegex);
  if (rejectMatch) {
    return `Report ${rejectMatch[1]} has been rejected. Reason: ${rejectMatch[2]}`;
  }

  // 3. FEEDBACK_WAITING_INFO
  // "Vui lòng bổ sung thông tin cho phản ánh FB-XXX."
  const waitInfoRegex =
    /^Vui\s+lòng\s+bổ\s+sung\s+thông\s+tin\s+cho\s+phản\s+ánh\s+(FB-[A-Z0-9]+)\./i;
  const waitInfoRegexUnaccented =
    /^Vui\s+long\s+bo\s+sung\s+thong\s+tin\s+cho\s+phan\s+anh\s+(FB-[A-Z0-9]+)\./i;
  const waitInfoMatch = content.match(waitInfoRegex) || content.match(waitInfoRegexUnaccented);
  if (waitInfoMatch) {
    return `Please supplement information for report ${waitInfoMatch[1]}.`;
  }

  // 4. FEEDBACK_INFO_SUPPLEMENTED
  // "Phản ánh FB-XXX đã được người dân bổ sung thông tin: ..."
  const infoSupplRegex =
    /^Phản ánh\s+(FB-[A-Z0-9]+)\s+đã được người dân bổ sung thông tin:\s*(.*)$/i;
  const infoSupplMatch = content.match(infoSupplRegex);
  if (infoSupplMatch) {
    return `Report ${infoSupplMatch[1]} has been supplemented by the citizen: ${infoSupplMatch[2]}`;
  }

  // 5. FEEDBACK_ASSIGNED_TO_WARD
  // "Phản ánh FB-XXX đã được phân về Phường YYY. Vui lòng kiểm tra..."
  const assignRegex =
    /^Phản ánh\s+(FB-[A-Z0-9]+)\s+đã được phân về\s+(?:Phường\s+)?([^.]+)\.\s+Vui lòng kiểm tra và tiếp nhận xử lý\./i;
  const assignMatch = content.match(assignRegex);
  if (assignMatch) {
    return `Report ${assignMatch[1]} has been assigned to ${assignMatch[2]}. Please inspect and accept for processing.`;
  }

  // 6. FEEDBACK_COMPLETED
  // "Phản ánh FB-XXX đã được hoàn thành. Kết quả: YYY"
  const completedRegex = /^Phản ánh\s+(FB-[A-Z0-9]+)\s+đã được hoàn thành\.\s+Kết quả:\s*(.*)$/i;
  const completedMatch = content.match(completedRegex);
  if (completedMatch) {
    return `Report ${completedMatch[1]} has been completed. Result: ${completedMatch[2]}`;
  }

  // 7. FEEDBACK_IN_PROGRESS
  // "Phản ánh FB-XXX đang được tiến hành xử lý."
  const progressRegex = /^Phản ánh\s+(FB-[A-Z0-9]+)\s+đang được tiến hành xử lý\./i;
  const progressMatch = content.match(progressRegex);
  if (progressMatch) {
    return `Report ${progressMatch[1]} is currently in progress.`;
  }

  // 8. FEEDBACK_STATUS_UPDATED (officer notification)
  // "Bạn đã cập nhật trạng thái phản ánh FB-XXX thành YYY."
  const statusUpdatedRegex =
    /^Bạn đã cập nhật trạng thái phản ánh\s+(FB-[A-Z0-9]+)\s+thành\s+([^.]+)\./i;
  const statusUpdatedMatch = content.match(statusUpdatedRegex);
  if (statusUpdatedMatch) {
    return `You have updated report ${statusUpdatedMatch[1]} status to ${translateStatusWord(statusUpdatedMatch[2])}.`;
  }

  // 9. CAMPAIGN_CANCELLED
  // "Chiến dịch 'AAA' đã bị cán bộ hủy. Lý do: BBB"
  const campCancelRegex = /^Chiến dịch\s+'([^']+)'\s+đã bị cán bộ hủy\.\s+Lý do:\s*(.*)$/i;
  const campCancelMatch = content.match(campCancelRegex);
  if (campCancelMatch) {
    return `Campaign '${campCancelMatch[1]}' has been cancelled by the officer. Reason: ${campCancelMatch[2]}`;
  }
  // "Chiến dịch 'AAA' đã được bạn hủy thành công. Lý do: BBB"
  const campCancelCreatorRegex =
    /^Chiến dịch\s+'([^']+)'\s+đã được bạn hủy thành công\.\s+Lý do:\s*(.*)$/i;
  const campCancelCreatorMatch = content.match(campCancelCreatorRegex);
  if (campCancelCreatorMatch) {
    return `Campaign '${campCancelCreatorMatch[1]}' has been cancelled by you. Reason: ${campCancelCreatorMatch[2]}`;
  }

  // 10. CAMPAIGN_RESCHEDULED
  // "Chiến dịch 'AAA' đã thay đổi thời gian hoặc địa điểm..."
  const campReschedRegex =
    /^Chiến dịch\s+'([^']+)'\s+đã thay đổi thời gian hoặc địa điểm\.\s+Vui lòng kiểm tra lại thông tin\./i;
  const campReschedMatch = content.match(campReschedRegex);
  if (campReschedMatch) {
    return `Campaign '${campReschedMatch[1]}' has rescheduled its time or location. Please check the updated details.`;
  }
  // "Thông tin lịch trình chiến dịch 'AAA' đã được cập nhật thành công."
  const campReschedCreatorRegex =
    /^Thông tin lịch trình chiến dịch\s+'([^']+)'\s+đã được cập nhật thành công\./i;
  const campReschedCreatorMatch = content.match(campReschedCreatorRegex);
  if (campReschedCreatorMatch) {
    return `Schedule details for campaign '${campReschedCreatorMatch[1]}' have been updated successfully.`;
  }

  // 11. CAMPAIGN_FINALIZED
  // "Chiến dịch 'AAA' đã được chốt danh sách và chính thức bắt đầu hoạt động."
  const campFinalRegex =
    /^Chiến dịch\s+'([^']+)'\s+đã được chốt danh sách và chính thức bắt đầu hoạt động\./i;
  const campFinalMatch = content.match(campFinalRegex);
  if (campFinalMatch) {
    return `Campaign '${campFinalMatch[1]}' registration is finalized and is now active.`;
  }
  // "Chiến dịch 'AAA' đã được chốt thành công và bắt đầu đi vào hoạt động."
  const campFinalCreatorRegex =
    /^Chiến dịch\s+'([^']+)'\s+đã được chốt thành công và bắt đầu đi vào hoạt động\./i;
  const campFinalCreatorMatch = content.match(campFinalCreatorRegex);
  if (campFinalCreatorMatch) {
    return `Campaign '${campFinalCreatorMatch[1]}' has been finalized successfully and starts going active.`;
  }

  // 12. CAMPAIGN_ENDED
  // "Chiến dịch 'AAA' đã được ban tổ chức kết thúc. Cảm ơn sự tham gia..."
  const campEndRegex =
    /^Chiến dịch\s+'([^']+)'\s+đã(?: được ban tổ chức)? kết thúc\.\s+Cảm ơn sự tham gia của bạn!/i;
  const campEndMatch = content.match(campEndRegex);
  if (campEndMatch) {
    return `Campaign '${campEndMatch[1]}' has ended. Thank you for your participation!`;
  }
  // "Chiến dịch 'AAA' đã được bạn kết thúc thành công. Vui lòng hoàn thành điểm danh."
  const campEndCreatorRegex =
    /^Chiến dịch\s+'([^']+)'\s+đã được bạn kết thúc thành công\.\s+Vui lòng hoàn thành điểm danh\./i;
  const campEndCreatorMatch = content.match(campEndCreatorRegex);
  if (campEndCreatorMatch) {
    return `Campaign '${campEndCreatorMatch[1]}' was ended by you. Please complete attendance checking.`;
  }

  // 13. CAMPAIGN_APPROVED
  // "Yêu cầu tham gia chiến dịch 'AAA' của bạn đã được duyệt."
  const campApproveRegex =
    /^Yêu\s+cầu\s+tham\s+gia\s+chiến\s+dịch\s+'([^']+)'\s+của\s+bạn\s+đã\s+được\s+duyệt\./i;
  const campApproveMatch = content.match(campApproveRegex);
  if (campApproveMatch) {
    return `Your request to participate in campaign '${campApproveMatch[1]}' has been approved.`;
  }

  // 14. CAMPAIGN_REJECTED
  // "Yêu cầu tham gia chiến dịch 'AAA' của bạn đã bị từ chối. Lý do: BBB"
  const campRejectRegex =
    /^Yêu\s+cầu\s+tham\s+gia\s+chiến\s+dịch\s+'([^']+)'\s+của\s+bạn\s+đã\s+bị\s+từ\s+chối\.\s+Lý\s+do:\s*(.*)$/i;
  const campRejectMatch = content.match(campRejectRegex);
  if (campRejectMatch) {
    return `Your request to participate in campaign '${campRejectMatch[1]}' has been rejected. Reason: ${campRejectMatch[2]}`;
  }

  // 15. CAMPAIGN_WARNING
  // "Bạn đã vắng mặt 2 lần tại các chiến dịch cộng đồng (lần gần nhất tại 'AAA'). Nếu tiếp tục vắng mặt lần thứ 3, tài khoản của bạn sẽ bị cấm tham gia chiến dịch mới."
  const campWarnRegex =
    /^Bạn\s+đã\s+vắng\s+mặt\s+2\s+lần\s+tại\s+các\s+chiến\s+dịch\s+cộng\s+đồng\s+\(lần\s+gần\s+nhất\s+tại\s+'([^']+)'\)\.\s+Nếu\s+tiếp\s+tục\s+vắng\s+mặt\s+lần\s+thứ\s+3,\s+tài\s+khoản\s+của\s+bạn\s+sẽ\s+bị\s+cấm\s+tham\s+gia\s+chiến\s+dịch\s+mới\./i;
  const campWarnMatch = content.match(campWarnRegex);
  if (campWarnMatch) {
    return `You have been absent 2 times from community campaigns (most recently at '${campWarnMatch[1]}'). If you are absent a 3rd time, your account will be banned from registering for new campaigns.`;
  }

  // 16. CAMPAIGN_BANNED
  // "Tài khoản của bạn đã bị cấm đăng ký tham gia chiến dịch cộng đồng mới do vắng mặt lần thứ 3 tại chiến dịch 'AAA'. Bạn có thể gửi đơn xin mở khóa trong trang cá nhân."
  const campBannedRegex =
    /^Tài\s+khoản\s+của\s+bạn\s+đã\s+bị\s+cấm\s+đăng\s+ký\s+tham\s+gia\s+chiến\s+dịch\s+cộng\s+đồng\s+mới\s+do\s+vắng\s+mặt\s+lần\s+thứ\s+3\s+tại\s+chiến\s+dịch\s+'([^']+)'.\s+Bạn\s+có\s+thể\s+gửi\s+đơn\s+xin\s+mở\s+khóa\s+trong\s+trang\s+cá\s+nhân\./i;
  const campBannedMatch = content.match(campBannedRegex);
  if (campBannedMatch) {
    return `Your account has been banned from registering for new community campaigns due to your 3rd absence at campaign '${campBannedMatch[1]}'. You can submit an appeal in your profile page.`;
  }

  // 17. NEW_CAMPAIGN_APPEAL
  // "Công dân AAA đã gửi đơn giải trình xin mở khóa tham gia chiến dịch."
  const newCampAppealRegex =
    /^Công\s+dân\s+(.+)\s+đã\s+gửi\s+đơn\s+giải\s+trình\s+xin\s+mở\s+khóa\s+tham\s+gia\s+chiến\s+dịch\./i;
  const newCampAppealMatch = content.match(newCampAppealRegex);
  if (newCampAppealMatch) {
    return `Citizen ${newCampAppealMatch[1]} has submitted a campaign unlock appeal.`;
  }

  // 18. CAMPAIGN_APPEAL_APPROVED
  // "Đơn giải trình của bạn đã được phê duyệt. Bạn đã có thể đăng ký tham gia các chiến dịch cộng đồng mới. Ghi chú: BBB"
  const campAppealApproveRegex =
    /^Đơn\s+giải\s+trình\s+của\s+bạn\s+đã\s+được\s+(?:phê\s+)?duyệt\.\s+Bạn\s+đã\s+có\s+thể\s+đăng\s+ký\s+tham\s+gia\s+các\s+chiến\s+dịch\s+cộng\s+đồng\s+mới\.(?:\s+Ghi\s+chú:\s*(.*))?$/i;
  const campAppealApproveMatch = content.match(campAppealApproveRegex);
  if (campAppealApproveMatch) {
    return `Your appeal has been approved. You can now register for new community campaigns. ${campAppealApproveMatch[1] ? `Notes: ${campAppealApproveMatch[1]}` : ""}`;
  }

  // 19. CAMPAIGN_APPEAL_REJECTED
  // "Đơn giải trình của bạn đã bị từ chối. Lý do từ chối: BBB" or "Đơn giải trình của bạn đã bị từ chối."
  const campAppealRejectRegex =
    /^Đơn\s+giải\s+trình\s+của\s+bạn\s+đã\s+bị\s+từ\s+chối\.(?:\s+Lý\s+do\s+từ\s+chối:\s*(.*))?$/i;
  const campAppealRejectMatch = content.match(campAppealRejectRegex);
  if (campAppealRejectMatch) {
    return `Your appeal has been rejected. ${campAppealRejectMatch[1] ? `Reason: ${campAppealRejectMatch[1]}` : ""}`;
  }

  // Fallback string-based replacement if no strict regex matched
  let translated = content;
  translated = translated.replace(/Phản ánh/g, "Report");
  translated = translated.replace(/đã được phân về/g, "has been assigned to");
  translated = translated.replace(
    /Vui lòng kiểm tra và tiếp nhận xử lý\./g,
    "Please inspect and accept for processing.",
  );
  translated = translated.replace(/đang được tiến hành xử lý\./g, "is in progress.");
  translated = translated.replace(/đã được hoàn thành\./g, "has been completed.");
  translated = translated.replace(/Kết quả:/g, "Result:");
  translated = translated.replace(/Chiến dịch/g, "Campaign");
  translated = translated.replace(/đã bị cán bộ hủy\./g, "has been cancelled by the officer.");
  translated = translated.replace(/Lý do:/g, "Reason:");
  translated = translated.replace(
    /Yêu cầu tham gia chiến dịch/g,
    "Your request to participate in campaign",
  );
  translated = translated.replace(/của bạn đã được duyệt\./g, "has been approved.");
  translated = translated.replace(/của bạn đã bị từ chối\./g, "has been rejected.");
  translated = translated.replace(
    /Đơn giải trình của bạn đã bị từ chối\./g,
    "Your appeal has been rejected.",
  );
  translated = translated.replace(/Tài khoản của bạn đã bị cấm/g, "Your account has been banned");
  translated = translated.replace(
    /xin mở khóa trong trang cá nhân\./g,
    "submit an appeal in your profile page.",
  );

  return translated;
}

/**
 * Parses notification content to highlight key words such as status strings and feedback codes.
 * Supports localization automatically if locale is specified.
 * @param content The notification content text
 * @param type Optional notification type
 * @param locale Current UI locale ("vi" | "en")
 */
export function highlightNotificationContent(
  content: string | undefined | null,
  type?: string | undefined | null,
  locale: string = "vi",
) {
  if (!content) return "";

  // 1. Translate content first if English is requested
  const translatedContent =
    locale === "en" ? translateNotificationContent(content, type, locale) : content;

  // 2. Regex to split by key phrases, tracking codes, or campaign names in single quotes
  // Supports both Vietnamese and English keywords for highlighting
  const regex =
    /('[^']+'|FB-[A-Z0-9]+|Đã xử lý|Đang xử lý|Cần bổ sung thông tin|Chờ bổ sung thông tin|Đang chờ duyệt|Đã hoàn thành|Đã phân công|Đã từ chối|Phòng ngừa|Đã tiếp nhận|Từ chối|Hoàn thành|Đã đóng|Đăng ký được duyệt|Đăng ký bị từ chối|Chiến dịch bị hủy|Thay đổi lịch trình|Đăng ký mới|Hủy tham gia|Chiến dịch tự động hủy|Chiến dịch tự động kết thúc|Chiến dịch đã chốt|Chiến dịch kết thúc|Xác nhận tham gia|Đăng ký chiến dịch được duyệt|Đăng ký chiến dịch bị từ chối|Bị cấm tham gia chiến dịch|Cảnh cáo vắng mặt chiến dịch|Đơn xin mở khóa chiến dịch được duyệt|Đơn xin mở khóa chiến dịch bị từ chối|Có đơn giải trình mới|Report|Submitted|Awaiting review|In progress|Processing|Resolved|Rejected|Completed|Needs info supplement|Campaign|Cancelled|Rescheduled|Active|Ended|Campaign Registration Approved|Campaign Registration Rejected|Campaign Absence Warning|Banned from Campaigns|New Appeal Submitted|Campaign Appeal Approved|Campaign Appeal Rejected)/gi;

  const parts = translatedContent.split(regex);
  if (parts.length === 1) return translatedContent;

  const matchRegex =
    /^('[^']+'|FB-[A-Z0-9]+|Đã xử lý|Đang xử lý|Cần bổ sung thông tin|Chờ bổ sung thông tin|Đang chờ duyệt|Đã hoàn thành|Đã phân công|Đã từ chối|Phòng ngừa|Đã tiếp nhận|Từ chối|Hoàn thành|Đã đóng|Đăng ký được duyệt|Đăng ký bị từ chối|Chiến dịch bị hủy|Thay đổi lịch trình|Đăng ký mới|Hủy tham gia|Chiến dịch tự động hủy|Chiến dịch tự động kết thúc|Chiến dịch đã chốt|Chiến dịch kết thúc|Xác nhận tham gia|Đăng ký chiến dịch được duyệt|Đăng ký chiến dịch bị từ chối|Bị cấm tham gia chiến dịch|Cảnh cáo vắng mặt chiến dịch|Đơn xin mở khóa chiến dịch được duyệt|Đơn xin mở khóa chiến dịch bị từ chối|Có đơn giải trình mới|Report|Submitted|Awaiting review|In progress|Processing|Resolved|Rejected|Completed|Needs info supplement|Campaign|Cancelled|Rescheduled|Active|Ended|Campaign Registration Approved|Campaign Registration Rejected|Campaign Absence Warning|Banned from Campaigns|New Appeal Submitted|Campaign Appeal Approved|Campaign Appeal Rejected)$/i;

  return (
    <>
      {parts.map((part, index) => {
        if (matchRegex.test(part)) {
          // If it matches FB-XXX tracking code
          if (/^FB-[A-Z0-9]+$/i.test(part)) {
            return (
              <span key={index} className="font-bold text-slate-900 font-mono mx-0.5">
                {part}
              </span>
            );
          }

          // All other status/campaign keywords
          return (
            <span key={index} className="font-bold text-slate-900 mx-0.5">
              {part}
            </span>
          );
        }

        // Just regular text
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
