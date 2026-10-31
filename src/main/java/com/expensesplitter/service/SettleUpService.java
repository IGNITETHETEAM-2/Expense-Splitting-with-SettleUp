package com.expensesplitter.service;

import com.expensesplitter.dto.MemberBalanceDTO;
import com.expensesplitter.dto.SettlementSuggestionDTO;
import com.expensesplitter.model.Group;
import com.expensesplitter.model.Settlement;
import com.expensesplitter.model.User;
import com.expensesplitter.repository.ExpenseRepository;
import com.expensesplitter.repository.SettlementRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class SettleUpService {

    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;

    public SettleUpService(ExpenseRepository expenseRepository, SettlementRepository settlementRepository) {
        this.expenseRepository = expenseRepository;
        this.settlementRepository = settlementRepository;
    }

    /**
     * Calculates precise net balances for each member of a group.
     * Net Balance = (Total Paid in Expenses + Total Paid in Settlements) 
     *             - (Total Share in Expenses + Total Received in Settlements)
     */
    public List<MemberBalanceDTO> calculateMemberBalances(Group group) {
        Map<Long, Double> paidMap = new HashMap<>();
        Map<Long, Double> owedMap = new HashMap<>();
        Map<Long, User> userMap = new HashMap<>();

        // Initialize for all members in group
        for (User member : group.getMembers()) {
            paidMap.put(member.getId(), 0.0);
            owedMap.put(member.getId(), 0.0);
            userMap.put(member.getId(), member);
        }

        // Process group expenses
        var expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(group.getId());
        for (var expense : expenses) {
            Long payerId = expense.getPaidBy().getId();
            paidMap.put(payerId, paidMap.getOrDefault(payerId, 0.0) + expense.getAmount());
            userMap.putIfAbsent(payerId, expense.getPaidBy());

            for (var share : expense.getShares()) {
                Long shareUserId = share.getUser().getId();
                owedMap.put(shareUserId, owedMap.getOrDefault(shareUserId, 0.0) + share.getShareAmount());
                userMap.putIfAbsent(shareUserId, share.getUser());
            }
        }

        // Process existing settlements for this group
        List<Settlement> settlements = settlementRepository.findByGroupIdOrderBySettledAtDesc(group.getId());
        for (Settlement settlement : settlements) {
            Long payerId = settlement.getPayer().getId();
            Long payeeId = settlement.getPayee().getId();
            Double amount = settlement.getAmount();

            // Payer settled a debt: paid more
            paidMap.put(payerId, paidMap.getOrDefault(payerId, 0.0) + amount);
            // Payee received settlement: owed/reduced
            owedMap.put(payeeId, owedMap.getOrDefault(payeeId, 0.0) + amount);
        }

        List<MemberBalanceDTO> balanceList = new ArrayList<>();
        for (User member : group.getMembers()) {
            Double paid = paidMap.getOrDefault(member.getId(), 0.0);
            Double owed = owedMap.getOrDefault(member.getId(), 0.0);
            Double net = round(paid - owed);

            balanceList.add(new MemberBalanceDTO(
                    member.getId(),
                    member.getName(),
                    member.getAvatar(),
                    round(paid),
                    round(owed),
                    net
            ));
        }

        // Sort: creditors (+net) first, then settled, then debtors (-net)
        balanceList.sort((a, b) -> Double.compare(b.getNetBalance(), a.getNetBalance()));
        return balanceList;
    }

    /**
     * Greedy debt minimization algorithm to find optimal minimal transactions.
     */
    public List<SettlementSuggestionDTO> calculateOptimalSettlements(Group group) {
        List<MemberBalanceDTO> balances = calculateMemberBalances(group);
        Map<Long, User> userMap = new HashMap<>();
        for (User u : group.getMembers()) {
            userMap.put(u.getId(), u);
        }

        // Min-heaps / Lists for debtors and creditors
        List<MemberAmount> debtors = new ArrayList<>();
        List<MemberAmount> creditors = new ArrayList<>();

        for (MemberBalanceDTO b : balances) {
            double net = round(b.getNetBalance());
            if (net < -0.009) {
                debtors.add(new MemberAmount(b.getUserId(), b.getUserName(), b.getAvatar(), -net)); // positive debt amount
            } else if (net > 0.009) {
                creditors.add(new MemberAmount(b.getUserId(), b.getUserName(), b.getAvatar(), net));
            }
        }

        // Sort descending
        debtors.sort((a, b) -> Double.compare(b.amount, a.amount));
        creditors.sort((a, b) -> Double.compare(b.amount, a.amount));

        List<SettlementSuggestionDTO> suggestions = new ArrayList<>();

        int dIdx = 0;
        int cIdx = 0;

        while (dIdx < debtors.size() && cIdx < creditors.size()) {
            MemberAmount debtor = debtors.get(dIdx);
            MemberAmount creditor = creditors.get(cIdx);

            double settleAmount = round(Math.min(debtor.amount, creditor.amount));

            if (settleAmount > 0.009) {
                suggestions.add(new SettlementSuggestionDTO(
                        debtor.userId,
                        debtor.userName,
                        debtor.avatar,
                        creditor.userId,
                        creditor.userName,
                        creditor.avatar,
                        settleAmount,
                        group.getCurrency()
                ));
            }

            debtor.amount = round(debtor.amount - settleAmount);
            creditor.amount = round(creditor.amount - settleAmount);

            if (debtor.amount <= 0.009) {
                dIdx++;
            }
            if (creditor.amount <= 0.009) {
                cIdx++;
            }
        }

        return suggestions;
    }

    public static double round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static class MemberAmount {
        Long userId;
        String userName;
        String avatar;
        double amount;

        MemberAmount(Long userId, String userName, String avatar, double amount) {
            this.userId = userId;
            this.userName = userName;
            this.avatar = avatar;
            this.amount = amount;
        }
    }
}
