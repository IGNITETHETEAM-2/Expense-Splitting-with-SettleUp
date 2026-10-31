package com.expensesplitter.dto;

public class MemberBalanceDTO {
    private Long userId;
    private String userName;
    private String avatar;
    private Double totalPaid;
    private Double totalOwed;
    private Double netBalance;
    private String status; // "LENT", "BORROWED", "SETTLED"

    public MemberBalanceDTO() {
    }

    public MemberBalanceDTO(Long userId, String userName, String avatar, Double totalPaid, Double totalOwed, Double netBalance) {
        this.userId = userId;
        this.userName = userName;
        this.avatar = avatar;
        this.totalPaid = Math.round(totalPaid * 100.0) / 100.0;
        this.totalOwed = Math.round(totalOwed * 100.0) / 100.0;
        this.netBalance = Math.round(netBalance * 100.0) / 100.0;
        if (this.netBalance > 0.009) {
            this.status = "LENT";
        } else if (this.netBalance < -0.009) {
            this.status = "BORROWED";
        } else {
            this.status = "SETTLED";
        }
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public Double getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(Double totalPaid) {
        this.totalPaid = totalPaid;
    }

    public Double getTotalOwed() {
        return totalOwed;
    }

    public void setTotalOwed(Double totalOwed) {
        this.totalOwed = totalOwed;
    }

    public Double getNetBalance() {
        return netBalance;
    }

    public void setNetBalance(Double netBalance) {
        this.netBalance = netBalance;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
