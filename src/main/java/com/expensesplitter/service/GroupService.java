package com.expensesplitter.service;

import com.expensesplitter.dto.CreateGroupRequestDTO;
import com.expensesplitter.dto.GroupAnalysisDTO;
import com.expensesplitter.model.Group;
import com.expensesplitter.model.User;
import com.expensesplitter.repository.ExpenseRepository;
import com.expensesplitter.repository.GroupRepository;
import com.expensesplitter.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final SettleUpService settleUpService;

    public GroupService(GroupRepository groupRepository,
                        UserRepository userRepository,
                        ExpenseRepository expenseRepository,
                        SettleUpService settleUpService) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.settleUpService = settleUpService;
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + id));
    }

    @Transactional
    public Group createGroup(CreateGroupRequestDTO dto) {
        Group group = new Group(dto.getName(), dto.getDescription(), dto.getCategory(), dto.getCurrency());
        
        // Add all specified members without any team size limit!
        if (dto.getMemberIds() != null && !dto.getMemberIds().isEmpty()) {
            List<User> members = userRepository.findAllById(dto.getMemberIds());
            group.setMembers(new ArrayList<>(members));
        }
        
        return groupRepository.save(group);
    }

    @Transactional
    public Group addMember(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        group.addMember(user);
        return groupRepository.save(group);
    }

    @Transactional
    public Group removeMember(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        group.removeMember(user);
        return groupRepository.save(group);
    }

    public void deleteGroup(Long id) {
        groupRepository.deleteById(id);
    }

    public GroupAnalysisDTO getGroupAnalysis(Long groupId) {
        Group group = getGroupById(groupId);
        var expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        
        double totalExp = expenses.stream().mapToDouble(e -> e.getAmount()).sum();
        totalExp = Math.round(totalExp * 100.0) / 100.0;

        GroupAnalysisDTO analysis = new GroupAnalysisDTO();
        analysis.setGroupId(group.getId());
        analysis.setGroupName(group.getName());
        analysis.setCurrency(group.getCurrency());
        analysis.setTotalExpenses(totalExp);
        analysis.setMembersCount(group.getMembers().size());
        analysis.setExpensesCount(expenses.size());
        analysis.setMemberBalances(settleUpService.calculateMemberBalances(group));
        analysis.setSuggestedSettlements(settleUpService.calculateOptimalSettlements(group));

        return analysis;
    }
}
