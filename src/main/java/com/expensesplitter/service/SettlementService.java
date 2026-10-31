package com.expensesplitter.service;

import com.expensesplitter.model.Group;
import com.expensesplitter.model.Settlement;
import com.expensesplitter.model.User;
import com.expensesplitter.repository.GroupRepository;
import com.expensesplitter.repository.SettlementRepository;
import com.expensesplitter.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public SettlementService(SettlementRepository settlementRepository,
                             GroupRepository groupRepository,
                             UserRepository userRepository) {
        this.settlementRepository = settlementRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    public List<Settlement> getAllSettlements() {
        return settlementRepository.findAllByOrderBySettledAtDesc();
    }

    public List<Settlement> getSettlementsByGroup(Long groupId) {
        return settlementRepository.findByGroupIdOrderBySettledAtDesc(groupId);
    }

    @Transactional
    public Settlement recordSettlement(Long groupId, Long payerId, Long payeeId, Double amount, String note) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));
        User payer = userRepository.findById(payerId)
                .orElseThrow(() -> new IllegalArgumentException("Payer not found: " + payerId));
        User payee = userRepository.findById(payeeId)
                .orElseThrow(() -> new IllegalArgumentException("Payee not found: " + payeeId));

        double roundedAmount = BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP).doubleValue();
        if (roundedAmount <= 0) {
            throw new IllegalArgumentException("Settlement amount must be greater than zero");
        }

        Settlement settlement = new Settlement(group, payer, payee, roundedAmount, note != null ? note : "Debt settled via SettleUp");
        return settlementRepository.save(settlement);
    }
}
