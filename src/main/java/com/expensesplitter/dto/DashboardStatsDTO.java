package com.expensesplitter.dto;

import java.util.HashMap;
import java.util.Map;

public class DashboardStatsDTO {
    private Double totalExpenses = 0.0;
    private int totalGroups = 0;
    private int totalUsers = 0;
    private int totalSettlements = 0;
    private Double totalSettledAmount = 0.0;
    private Map<String, Double> categorySpending = new HashMap<>();

    public DashboardStatsDTO() {
    }

    public Double getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(Double totalExpenses) {
        this.totalExpenses = Math.round(totalExpenses * 100.0) / 100.0;
    }

    public int getTotalGroups() {
        return totalGroups;
    }

    public void setTotalGroups(int totalGroups) {
        this.totalGroups = totalGroups;
    }

    public int getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(int totalUsers) {
        this.totalUsers = totalUsers;
    }

    public int getTotalSettlements() {
        return totalSettlements;
    }

    public void setTotalSettlements(int totalSettlements) {
        this.totalSettlements = totalSettlements;
    }

    public Double getTotalSettledAmount() {
        return totalSettledAmount;
    }

    public void setTotalSettledAmount(Double totalSettledAmount) {
        this.totalSettledAmount = Math.round(totalSettledAmount * 100.0) / 100.0;
    }

    public Map<String, Double> getCategorySpending() {
        return categorySpending;
    }

    public void setCategorySpending(Map<String, Double> categorySpending) {
        this.categorySpending = categorySpending;
    }
}
