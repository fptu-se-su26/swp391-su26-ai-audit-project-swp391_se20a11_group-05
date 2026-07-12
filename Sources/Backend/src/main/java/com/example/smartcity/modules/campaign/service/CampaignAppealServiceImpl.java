package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.campaign.dto.CampaignAppealRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealReviewRequest;
import com.example.smartcity.modules.campaign.dto.CampaignAppealResponse;
import com.example.smartcity.modules.campaign.entity.CampaignAppeal;
import com.example.smartcity.modules.campaign.repository.CampaignAppealRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.notification.service.NotificationService;
import com.example.smartcity.modules.notification.service.ExternalNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignAppealServiceImpl implements CampaignAppealService {

    private final CampaignAppealRepository appealRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ExternalNotificationService externalNotificationService;

    @Override
    @Transactional
    public CampaignAppealResponse submitAppeal(CampaignAppealRequest request, String username) {
        User citizen = requireUser(username);
        if (!citizen.isCampaignBanned() && !"BANNED".equalsIgnoreCase(citizen.getStatus())) {
            throw new CustomException("Tài khoản của bạn không bị cấm tham gia chiến dịch hoặc bị khóa.", HttpStatus.BAD_REQUEST.value());
        }
        if (appealRepository.existsByCitizenIdAndStatus(citizen.getId(), "PENDING")) {
            throw new CustomException("Bạn đã có đơn giải trình xin mở khóa đang chờ xử lý.", HttpStatus.BAD_REQUEST.value());
        }

        CampaignAppeal appeal = CampaignAppeal.builder()
                .citizen(citizen)
                .reason(request.getReason())
                .status("PENDING")
                .build();

        CampaignAppeal saved = appealRepository.save(appeal);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignAppealResponse getMyLastAppeal(String username) {
        User citizen = requireUser(username);
        CampaignAppeal appeal = appealRepository.findFirstByCitizenIdOrderByCreatedAtDesc(citizen.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn giải trình nào của bạn.", HttpStatus.NOT_FOUND.value()));
        return toResponse(appeal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignAppealResponse> getPendingAppeals(String username) {
        User user = requireUser(username);
        if (user.getRole() != Role.SUPER_ADMIN && user.getRole() != Role.WARD_STAFF) {
            throw new CustomException("Bạn không có quyền xem danh sách đơn giải trình.", HttpStatus.FORBIDDEN.value());
        }

        List<CampaignAppeal> appeals;
        if (user.getRole() == Role.SUPER_ADMIN) {
            appeals = appealRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        } else {
            if (user.getWard() == null) {
                throw new CustomException("Tài khoản của bạn chưa được gán khu vực phường quản lý.", HttpStatus.FORBIDDEN.value());
            }
            appeals = appealRepository.findPendingAppealsForWard("PENDING", user.getWard().getId());
        }

        return appeals.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CampaignAppealResponse approveAppeal(Long appealId, CampaignAppealReviewRequest request, String username) {
        User reviewer = requireUser(username);
        if (reviewer.getRole() != Role.SUPER_ADMIN && reviewer.getRole() != Role.WARD_STAFF) {
            throw new CustomException("Bạn không có quyền duyệt đơn giải trình.", HttpStatus.FORBIDDEN.value());
        }

        CampaignAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn giải trình.", HttpStatus.NOT_FOUND.value()));

        if (!"PENDING".equals(appeal.getStatus())) {
            throw new CustomException("Đơn giải trình này đã được xử lý từ trước.", HttpStatus.BAD_REQUEST.value());
        }

        appeal.setStatus("APPROVED");
        appeal.setReviewedBy(reviewer);
        appeal.setReviewNotes(request.getNotes());
        appeal.setUpdatedAt(LocalDateTime.now());
        CampaignAppeal saved = appealRepository.save(appeal);

        User citizen = appeal.getCitizen();
        citizen.setCampaignBanned(false);
        citizen.setLastCampaignUnbanAt(LocalDateTime.now());
        if ("BANNED".equalsIgnoreCase(citizen.getStatus())) {
            citizen.setStatus("ACTIVE");
            citizen.setWarningCount(0);
        }
        userRepository.save(citizen);

        // Gửi thông báo hệ thống
        String notesText = (request.getNotes() != null && !request.getNotes().isBlank()) ? " Ghi chú: " + request.getNotes() : "";
        notificationService.createCampaignNotification(
                citizen,
                null,
                "Đơn xin mở khóa chiến dịch được duyệt",
                "Đơn giải trình của bạn đã được phê duyệt. Bạn đã có thể đăng ký tham gia các chiến dịch cộng đồng mới." + notesText,
                "CAMPAIGN_APPEAL_APPROVED"
        );

        // Gửi email
        if (citizen.getEmail() != null && !citizen.getEmail().isBlank()) {
            String subject = "[SmartCity] Đơn giải trình xin mở khóa chiến dịch đã được duyệt";
            String body = String.format("Chào %s,\n\nĐơn giải trình xin mở khóa đăng ký tham gia chiến dịch của bạn đã được duyệt bởi Cán bộ phường.\n\n%s\n\nBạn có thể đăng ký tham gia các chiến dịch tình nguyện mới ngay bây giờ.\n\nTrân trọng,\nBan Quản Trị SmartCity",
                    citizen.getFullName(), notesText.trim());
            externalNotificationService.sendEmailNotification(citizen.getEmail(), subject, body);
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public CampaignAppealResponse rejectAppeal(Long appealId, CampaignAppealReviewRequest request, String username) {
        User reviewer = requireUser(username);
        if (reviewer.getRole() != Role.SUPER_ADMIN && reviewer.getRole() != Role.WARD_STAFF) {
            throw new CustomException("Bạn không có quyền duyệt đơn giải trình.", HttpStatus.FORBIDDEN.value());
        }

        CampaignAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn giải trình.", HttpStatus.NOT_FOUND.value()));

        if (!"PENDING".equals(appeal.getStatus())) {
            throw new CustomException("Đơn giải trình này đã được xử lý từ trước.", HttpStatus.BAD_REQUEST.value());
        }

        appeal.setStatus("REJECTED");
        appeal.setReviewedBy(reviewer);
        appeal.setReviewNotes(request.getNotes());
        appeal.setUpdatedAt(LocalDateTime.now());
        CampaignAppeal saved = appealRepository.save(appeal);

        User citizen = appeal.getCitizen();

        // Gửi thông báo hệ thống
        String notesText = (request.getNotes() != null && !request.getNotes().isBlank()) ? " Lý do từ chối: " + request.getNotes() : "";
        notificationService.createCampaignNotification(
                citizen,
                null,
                "Đơn xin mở khóa chiến dịch bị từ chối",
                "Đơn giải trình của bạn đã bị từ chối." + notesText,
                "CAMPAIGN_APPEAL_REJECTED"
        );

        // Gửi email
        if (citizen.getEmail() != null && !citizen.getEmail().isBlank()) {
            String subject = "[SmartCity] Đơn giải trình xin mở khóa chiến dịch bị từ chối";
            String body = String.format("Chào %s,\n\nĐơn giải trình xin mở khóa đăng ký tham gia chiến dịch của bạn đã bị từ chối bởi Cán bộ phường.\n\n%s\n\nVui lòng liên hệ trực tiếp văn phòng phường để biết thêm chi tiết.\n\nTrân trọng,\nBan Quản Trị SmartCity",
                    citizen.getFullName(), notesText.trim());
            externalNotificationService.sendEmailNotification(citizen.getEmail(), subject, body);
        }

        return toResponse(saved);
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại", HttpStatus.NOT_FOUND.value()));
    }

    private CampaignAppealResponse toResponse(CampaignAppeal appeal) {
        return CampaignAppealResponse.builder()
                .id(appeal.getId())
                .citizenId(appeal.getCitizen().getId())
                .citizenName(appeal.getCitizen().getFullName())
                .citizenPhone(appeal.getCitizen().getPhoneNumber())
                .reason(appeal.getReason())
                .status(appeal.getStatus())
                .reviewedById(appeal.getReviewedBy() != null ? appeal.getReviewedBy().getId() : null)
                .reviewedByName(appeal.getReviewedBy() != null ? appeal.getReviewedBy().getFullName() : null)
                .reviewNotes(appeal.getReviewNotes())
                .createdAt(appeal.getCreatedAt())
                .updatedAt(appeal.getUpdatedAt())
                .build();
    }
}
