package com.expensesplitter.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payee_id", nullable = false)
    private User payee;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Settlement amount must be positive")
    @Column(nullable = false)
    private Double amount;

    private String note;

    @Column(name = "settled_at", nullable = false)
    private LocalDateTime settledAt = LocalDateTime.now();

    public Settlement() {
    }

    public Settlement(Group group, User payer, User payee, Double amount, String note) {
        this.group = group;
        this.payer = payer;
        this.payee = payee;
        this.amount = amount;
        this.note = note;
        this.settledAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public User getPayer() {
        return payer;
    }

    public void setPayer(User payer) {
        this.payer = payer;
    }

    public User getPayee() {
        return payee;
    }

    public void setPayee(User payee) {
        this.payee = payee;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getSettledAt() {
        return settledAt;
    }

    public void setSettledAt(LocalDateTime settledAt) {
        this.settledAt = settledAt;
    }
}
