package com.expensesplitter.service;

import com.expensesplitter.dto.CreateExpenseRequestDTO;
import com.expensesplitter.dto.ShareInputDTO;
import com.expensesplitter.model.*;
import com.expensesplitter.repository.ExpenseRepository;
import com.expensesplitter.repository.GroupRepository;
import com.expensesplitter.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository,
                          GroupRepository groupRepository,
                          UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllOrderByCreatedAtDesc();
    }

    public List<Expense> getExpensesByGroup(Long groupId) {
        return expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
    }

    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found with id: " + id));
    }

    @Transactional
    public Expense createExpense(CreateExpenseRequestDTO dto) {
        Group group = groupRepository.findById(dto.getGroupId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + dto.getGroupId()));

        User paidBy = userRepository.findById(dto.getPaidById())
                .orElseThrow(() -> new IllegalArgumentException("Payer not found with id: " + dto.getPaidById()));

        double totalAmount = round(dto.getAmount());
        if (totalAmount <= 0) {
            throw new IllegalArgumentException("Total amount must be greater than zero");
        }

        Expense expense = new Expense();
        expense.setDescription(dto.getDescription());
        expense.setAmount(totalAmount);
        expense.setCategory(dto.getCategory() != null ? dto.getCategory() : "General");
        expense.setSplitType(dto.getSplitType());
        expense.setGroup(group);
        expense.setPaidBy(paidBy);

        List<ShareInputDTO> shareInputs = dto.getShares();
        if (shareInputs == null || shareInputs.isEmpty()) {
            // Default to equal split among all group members
            shareInputs = new ArrayList<>();
            for (User u : group.getMembers()) {
                shareInputs.add(new ShareInputDTO(u.getId(), 0.0));
            }
        }

        // Calculate precise shares according to SplitType
        List<ExpenseShare> calculatedShares = calculatePreciseShares(expense, shareInputs, totalAmount, dto.getSplitType());
        for (ExpenseShare share : calculatedShares) {
            expense.addShare(share);
        }

        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }

    /**
     * Calculates mathematically exact shares ensuring sum of shares == total expense down to 0.01 cent/paise.
     */
    private List<ExpenseShare> calculatePreciseShares(Expense expense, List<ShareInputDTO> inputs, double totalAmount, SplitType splitType) {
        int n = inputs.size();
        if (n == 0) {
            throw new IllegalArgumentException("At least one participant required for splitting");
        }

        Map<Long, User> userCache = new HashMap<>();
        for (ShareInputDTO s : inputs) {
            User u = userRepository.findById(s.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Participant user not found: " + s.getUserId()));
            userCache.put(u.getId(), u);
        }

        List<ExpenseShare> shares = new ArrayList<>();

        switch (splitType) {
            case EQUAL -> {
                // Total divided by N with exact penny remainder distribution
                BigDecimal totalBd = BigDecimal.valueOf(totalAmount).setScale(2, RoundingMode.HALF_UP);
                BigDecimal nBd = BigDecimal.valueOf(n);
                BigDecimal baseShare = totalBd.divide(nBd, 2, RoundingMode.FLOOR);
                BigDecimal allocated = baseShare.multiply(nBd);
                BigDecimal remainder = totalBd.subtract(allocated); // in cents, e.g. 0.01 or 0.02

                long centsRemainder = remainder.multiply(BigDecimal.valueOf(100)).longValue();

                for (int i = 0; i < n; i++) {
                    ShareInputDTO in = inputs.get(i);
                    BigDecimal memberShare = baseShare;
                    if (i < centsRemainder) {
                        memberShare = memberShare.add(BigDecimal.valueOf(0.01));
                    }
                    double amt = memberShare.doubleValue();
                    shares.add(new ExpenseShare(expense, userCache.get(in.getUserId()), amt, amt));
                }
            }

            case EXACT -> {
                double runningSum = 0.0;
                for (ShareInputDTO in : inputs) {
                    double val = in.getShareValue() != null ? round(in.getShareValue()) : 0.0;
                    runningSum += val;
                    shares.add(new ExpenseShare(expense, userCache.get(in.getUserId()), val, val));
                }
                runningSum = round(runningSum);
                if (Math.abs(runningSum - totalAmount) > 0.05) {
                    throw new IllegalArgumentException("Exact shares sum (" + runningSum + ") must equal total expense (" + totalAmount + ")");
                }
            }

            case PERCENTAGE -> {
                double pctSum = 0.0;
                for (ShareInputDTO in : inputs) {
                    pctSum += (in.getShareValue() != null ? in.getShareValue() : 0.0);
                }
                if (Math.abs(pctSum - 100.0) > 0.1) {
                    throw new IllegalArgumentException("Split percentages must sum to 100%. Current sum: " + pctSum + "%");
                }

                double distributedSum = 0.0;
                ExpenseShare largestShare = null;
                double maxPct = -1.0;

                for (ShareInputDTO in : inputs) {
                    double pct = in.getShareValue() != null ? in.getShareValue() : 0.0;
                    double shareAmt = round((pct / 100.0) * totalAmount);
                    distributedSum += shareAmt;

                    ExpenseShare es = new ExpenseShare(expense, userCache.get(in.getUserId()), shareAmt, pct);
                    shares.add(es);

                    if (pct > maxPct) {
                        maxPct = pct;
                        largestShare = es;
                    }
                }

                // Adjust cent rounding on largest share
                double roundingDiff = round(totalAmount - distributedSum);
                if (largestShare != null && Math.abs(roundingDiff) > 0.001) {
                    largestShare.setShareAmount(round(largestShare.getShareAmount() + roundingDiff));
                }
            }

            case SHARES -> {
                double totalShares = 0.0;
                for (ShareInputDTO in : inputs) {
                    totalShares += (in.getShareValue() != null && in.getShareValue() > 0 ? in.getShareValue() : 1.0);
                }
                if (totalShares <= 0) {
                    totalShares = n;
                }

                double distributedSum = 0.0;
                ExpenseShare largestShare = null;
                double maxShareVal = -1.0;

                for (ShareInputDTO in : inputs) {
                    double shareVal = (in.getShareValue() != null && in.getShareValue() > 0 ? in.getShareValue() : 1.0);
                    double shareAmt = round((shareVal / totalShares) * totalAmount);
                    distributedSum += shareAmt;

                    ExpenseShare es = new ExpenseShare(expense, userCache.get(in.getUserId()), shareAmt, shareVal);
                    shares.add(es);

                    if (shareVal > maxShareVal) {
                        maxShareVal = shareVal;
                        largestShare = es;
                    }
                }

                // Adjust cent rounding
                double roundingDiff = round(totalAmount - distributedSum);
                if (largestShare != null && Math.abs(roundingDiff) > 0.001) {
                    largestShare.setShareAmount(round(largestShare.getShareAmount() + roundingDiff));
                }
            }
        }

        return shares;
    }

    private double round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
