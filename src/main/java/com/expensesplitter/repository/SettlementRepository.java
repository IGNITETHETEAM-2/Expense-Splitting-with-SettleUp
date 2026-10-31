package com.expensesplitter.repository;

import com.expensesplitter.model.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findByGroupIdOrderBySettledAtDesc(Long groupId);
    List<Settlement> findAllByOrderBySettledAtDesc();
}
