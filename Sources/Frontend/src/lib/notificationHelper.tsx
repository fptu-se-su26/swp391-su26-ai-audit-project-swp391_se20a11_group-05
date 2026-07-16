import React from "react";

/**
 * Parses notification content to highlight key words such as status strings and feedback codes
 * @param content The notification content text
 */
export function highlightNotificationContent(content: string | undefined | null) {
  if (!content) return "";

  // Regex to split by the key phrases, tracking codes, or campaign names in single quotes
  const regex = /('[^']+'|FB-[A-Z0-9]+|Đã xử lý|Đang xử lý|Cần bổ sung thông tin|Chờ bổ sung thông tin|Đang chờ duyệt|Đã hoàn thành|Đã phân công|Đã từ chối|Phòng ngừa|Đã tiếp nhận|Từ chối|Hoàn thành|Đã đóng|Đăng ký được duyệt|Đăng ký bị từ chối|Chiến dịch bị hủy|Thay đổi lịch trình|Đăng ký mới|Hủy tham gia|Chiến dịch tự động hủy|Chiến dịch tự động kết thúc|Chiến dịch đã chốt|Chiến dịch kết thúc|Xác nhận tham gia)/gi;

  const parts = content.split(regex);
  if (parts.length === 1) return content;

  // Casing-independent matching regex for loop checks
  const matchRegex = /^('[^']+'|FB-[A-Z0-9]+|Đã xử lý|Đang xử lý|Cần bổ sung thông tin|Chờ bổ sung thông tin|Đang chờ duyệt|Đã hoàn thành|Đã phân công|Đã từ chối|Phòng ngừa|Đã tiếp nhận|Từ chối|Hoàn thành|Đã đóng|Đăng ký được duyệt|Đăng ký bị từ chối|Chiến dịch bị hủy|Thay đổi lịch trình|Đăng ký mới|Hủy tham gia|Chiến dịch tự động hủy|Chiến dịch tự động kết thúc|Chiến dịch đã chốt|Chiến dịch kết thúc|Xác nhận tham gia)$/i;

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
