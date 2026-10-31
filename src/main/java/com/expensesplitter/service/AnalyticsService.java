package com.expensesplitter.service;

import com.expensesplitter.dto.DashboardStatsDTO;
import com.expensesplitter.model.Expense;
import com.expensesplitter.model.Settlement;
import com.expensesplitter.repository.ExpenseRepository;
import com.expensesplitter.repository.GroupRepository;
import com.expensesplitter.repository.SettlementRepository;
import com.expensesplitter.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final SettlementRepository settlementRepository;

    public AnalyticsService(ExpenseRepository expenseRepository,
                            GroupRepository groupRepository,
                            UserRepository userRepository,
                            SettlementRepository settlementRepository) {
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.settlementRepository = settlementRepository;
    }

    public DashboardStatsDTO getDashboardStats() {
        DashboardStatsDTO stats = new DashboardStatsDTO();
        
        List<Expense> expenses = expenseRepository.findAll();
        double totalExp = expenses.stream().mapToDouble(Expense::getAmount).sum();
        stats.setTotalExpenses(round(totalExp));

        stats.setTotalGroups((int) groupRepository.count());
        stats.setTotalUsers((int) userRepository.count());

        List<Settlement> settlements = settlementRepository.findAll();
        stats.setTotalSettlements(settlements.size());
        double totalSettled = settlements.stream().mapToDouble(Settlement::getAmount).sum();
        stats.setTotalSettledAmount(round(totalSettled));

        // Category breakdown
        Map<String, Double> categoryMap = new HashMap<>();
        for (Expense e : expenses) {
            String cat = e.getCategory() != null && !e.getCategory().isBlank() ? e.getCategory() : "General";
            categoryMap.put(cat, round(categoryMap.getOrDefault(cat, 0.0) + e.getAmount()));
        }
        stats.setCategorySpending(categoryMap);

        return stats;
    }

    private double round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
