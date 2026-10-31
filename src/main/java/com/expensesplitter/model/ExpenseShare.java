package com.expensesplitter.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "expense_shares")
public class ExpenseShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    @JsonBackReference
    private Expense expense;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double shareAmount = 0.0; // The actual currency amount owed

    private Double shareValue = 0.0;  // Raw value entered (e.g. percentage %, shares count, exact amt)

    private boolean settled = false;

    public ExpenseShare() {
    }

    public ExpenseShare(Expense expense, User user, Double shareAmount, Double shareValue) {
        this.expense = expense;
        this.user = user;
        this.shareAmount = shareAmount;
        this.shareValue = shareValue;
        this.settled = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Expense getExpense() {
        return expense;
    }

    public void setExpense(Expense expense) {
        this.expense = expense;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Double getShareAmount() {
        return shareAmount;
    }

    public void setShareAmount(Double shareAmount) {
        this.shareAmount = shareAmount;
    }

    public Double getShareValue() {
        return shareValue;
    }

    public void setShareValue(Double shareValue) {
        this.shareValue = shareValue;
    }

    public boolean isSettled() {
        return settled;
    }

    public void setSettled(boolean settled) {
        this.settled = settled;
    }
}
