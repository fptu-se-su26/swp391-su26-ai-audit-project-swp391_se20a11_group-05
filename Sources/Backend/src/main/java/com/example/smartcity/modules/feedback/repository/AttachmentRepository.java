package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.modules.feedback.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByFeedbackId(Long feedbackId);
}
