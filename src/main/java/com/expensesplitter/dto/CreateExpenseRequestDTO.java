package com.expensesplitter.dto;

import com.expensesplitter.model.SplitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class CreateExpenseRequestDTO {
    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private Double amount;

    private String category = "General";

    @NotNull(message = "Paid By User ID is required")
    private Long paidById;

    @NotNull(message = "Split type is required")
    private SplitType splitType = SplitType.EQUAL;

    // List of shares for participants
    private List<ShareInputDTO> shares = new ArrayList<>();

    public CreateExpenseRequestDTO() {
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Long getPaidById() {
        return paidById;
    }

    public void setPaidById(Long paidById) {
        this.paidById = paidById;
    }

    public SplitType getSplitType() {
        return splitType;
    }

    public void setSplitType(SplitType splitType) {
        this.splitType = splitType;
    }

    public List<ShareInputDTO> getShares() {
        return shares;
    }

    public void setShares(List<ShareInputDTO> shares) {
        this.shares = shares;
    }
}
