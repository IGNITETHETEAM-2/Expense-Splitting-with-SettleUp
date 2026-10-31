package com.expensesplitter.repository;

import com.expensesplitter.model.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, Long> {
    List<ExpenseShare> findByUserId(Long userId);
    List<ExpenseShare> findByExpenseId(Long expenseId);
}
