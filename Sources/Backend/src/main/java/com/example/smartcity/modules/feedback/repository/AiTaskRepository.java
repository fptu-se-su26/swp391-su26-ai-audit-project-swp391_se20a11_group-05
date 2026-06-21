package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.modules.feedback.entity.AiTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiTaskRepository extends JpaRepository<AiTask, Long> {

    @Query(value = "SELECT * FROM ai_tasks WHERE status = 'PENDING' ORDER BY task_priority DESC, created_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<AiTask> findPendingTasksForUpdate(@Param("limit") int limit);
}
