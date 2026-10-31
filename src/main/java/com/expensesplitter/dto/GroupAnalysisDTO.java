package com.expensesplitter.dto;

import java.util.ArrayList;
import java.util.List;

public class GroupAnalysisDTO {
    private Long groupId;
    private String groupName;
    private String currency;
    private Double totalExpenses;
    private int membersCount;
    private int expensesCount;
    private List<MemberBalanceDTO> memberBalances = new ArrayList<>();
    private List<SettlementSuggestionDTO> suggestedSettlements = new ArrayList<>();

    public GroupAnalysisDTO() {
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Double getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(Double totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public int getMembersCount() {
        return membersCount;
    }

    public void setMembersCount(int membersCount) {
        this.membersCount = membersCount;
    }

    public int getExpensesCount() {
        return expensesCount;
    }

    public void setExpensesCount(int expensesCount) {
        this.expensesCount = expensesCount;
    }

    public List<MemberBalanceDTO> getMemberBalances() {
        return memberBalances;
    }

    public void setMemberBalances(List<MemberBalanceDTO> memberBalances) {
        this.memberBalances = memberBalances;
    }

    public List<SettlementSuggestionDTO> getSuggestedSettlements() {
        return suggestedSettlements;
    }

    public void setSuggestedSettlements(List<SettlementSuggestionDTO> suggestedSettlements) {
        this.suggestedSettlements = suggestedSettlements;
    }
}
