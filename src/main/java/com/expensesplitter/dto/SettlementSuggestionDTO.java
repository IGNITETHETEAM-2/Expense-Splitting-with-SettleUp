package com.expensesplitter.dto;

public class SettlementSuggestionDTO {
    private Long fromUserId;
    private String fromUserName;
    private String fromAvatar;
    private Long toUserId;
    private String toUserName;
    private String toAvatar;
    private Double amount;
    private String formattedAmount;

    public SettlementSuggestionDTO() {
    }

    public SettlementSuggestionDTO(Long fromUserId, String fromUserName, String fromAvatar,
                                 Long toUserId, String toUserName, String toAvatar,
                                 Double amount, String currency) {
        this.fromUserId = fromUserId;
        this.fromUserName = fromUserName;
        this.fromAvatar = fromAvatar;
        this.toUserId = toUserId;
        this.toUserName = toUserName;
        this.toAvatar = toAvatar;
        this.amount = Math.round(amount * 100.0) / 100.0;
        this.formattedAmount = (currency != null ? currency : "₹") + String.format("%.2f", this.amount);
    }

    public Long getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(Long fromUserId) {
        this.fromUserId = fromUserId;
    }

    public String getFromUserName() {
        return fromUserName;
    }

    public void setFromUserName(String fromUserName) {
        this.fromUserName = fromUserName;
    }

    public String getFromAvatar() {
        return fromAvatar;
    }

    public void setFromAvatar(String fromAvatar) {
        this.fromAvatar = fromAvatar;
    }

    public Long getToUserId() {
        return toUserId;
    }

    public void setToUserId(Long toUserId) {
        this.toUserId = toUserId;
    }

    public String getToUserName() {
        return toUserName;
    }

    public void setToUserName(String toUserName) {
        this.toUserName = toUserName;
    }

    public String getToAvatar() {
        return toAvatar;
    }

    public void setToAvatar(String toAvatar) {
        this.toAvatar = toAvatar;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getFormattedAmount() {
        return formattedAmount;
    }

    public void setFormattedAmount(String formattedAmount) {
        this.formattedAmount = formattedAmount;
    }
}
