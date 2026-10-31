package com.expensesplitter.dto;

import jakarta.validation.constraints.NotNull;

public class ShareInputDTO {
    @NotNull(message = "User ID is required")
    private Long userId;

    private Double shareValue; // Raw value: exact amount, percentage %, or shares count

    private Double shareAmount; // Precomputed or calculated amount

    public ShareInputDTO() {
    }

    public ShareInputDTO(Long userId, Double shareValue) {
        this.userId = userId;
        this.shareValue = shareValue;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Double getShareValue() {
        return shareValue;
    }

    public void setShareValue(Double shareValue) {
        this.shareValue = shareValue;
    }

    public Double getShareAmount() {
        return shareAmount;
    }

    public void setShareAmount(Double shareAmount) {
        this.shareAmount = shareAmount;
    }
}
