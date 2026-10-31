package com.expensesplitter.config;

import com.expensesplitter.dto.CreateExpenseRequestDTO;
import com.expensesplitter.dto.CreateGroupRequestDTO;
import com.expensesplitter.dto.ShareInputDTO;
import com.expensesplitter.model.SplitType;
import com.expensesplitter.model.User;
import com.expensesplitter.repository.UserRepository;
import com.expensesplitter.service.ExpenseService;
import com.expensesplitter.service.GroupService;
import com.expensesplitter.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final GroupService groupService;
    private final ExpenseService expenseService;
    private final UserRepository userRepository;

    public DataInitializer(UserService userService,
                           GroupService groupService,
                           ExpenseService expenseService,
                           UserRepository userRepository) {
        this.userService = userService;
        this.groupService = groupService;
        this.expenseService = expenseService;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Already initialized
        }

        // 1. Create Initial Users
        User alice = userService.createUser(new User("Alice Johnson", "alice@example.com"));
        User bob = userService.createUser(new User("Bob Smith", "bob@example.com"));
        User charlie = userService.createUser(new User("Charlie Davis", "charlie@example.com"));
        User diana = userService.createUser(new User("Diana Miller", "diana@example.com"));
        User ethan = userService.createUser(new User("Ethan Clark", "ethan@example.com"));

        // 2. Create Initial Groups (demonstrating varying team sizes without limits!)
        // Group 1: Goa Trip (4 members)
        CreateGroupRequestDTO goaGroupDto = new CreateGroupRequestDTO();
        goaGroupDto.setName("Goa Road Trip");
        goaGroupDto.setDescription("Weekend getaway trip with friends");
        goaGroupDto.setCategory("Travel");
        goaGroupDto.setCurrency("₹");
        goaGroupDto.setMemberIds(Arrays.asList(alice.getId(), bob.getId(), charlie.getId(), diana.getId()));
        var goaGroup = groupService.createGroup(goaGroupDto);

        // Group 2: Apartment 402 Flatmates (3 members)
        CreateGroupRequestDTO flatGroupDto = new CreateGroupRequestDTO();
        flatGroupDto.setName("Flat 402 Flatmates");
        flatGroupDto.setDescription("Monthly household rent, wifi and groceries");
        flatGroupDto.setCategory("Home");
        flatGroupDto.setCurrency("₹");
        flatGroupDto.setMemberIds(Arrays.asList(alice.getId(), bob.getId(), ethan.getId()));
        var flatGroup = groupService.createGroup(flatGroupDto);

        // 3. Create Sample Expenses with different split types
        // Expense 1: Villa Booking - Equal Split among 4
        CreateExpenseRequestDTO exp1 = new CreateExpenseRequestDTO();
        exp1.setGroupId(goaGroup.getId());
        exp1.setDescription("Luxury Villa Booking (2 Nights)");
        exp1.setAmount(12000.00);
        exp1.setCategory("Travel");
        exp1.setPaidById(alice.getId());
        exp1.setSplitType(SplitType.EQUAL);
        exp1.setShares(Arrays.asList(
                new ShareInputDTO(alice.getId(), 0.0),
                new ShareInputDTO(bob.getId(), 0.0),
                new ShareInputDTO(charlie.getId(), 0.0),
                new ShareInputDTO(diana.getId(), 0.0)
        ));
        expenseService.createExpense(exp1);

        // Expense 2: Seafood Beach Dinner - Exact Split
        CreateExpenseRequestDTO exp2 = new CreateExpenseRequestDTO();
        exp2.setGroupId(goaGroup.getId());
        exp2.setDescription("Seafood Beach Shack Dinner");
        exp2.setAmount(3800.00);
        exp2.setCategory("Food");
        exp2.setPaidById(bob.getId());
        exp2.setSplitType(SplitType.EXACT);
        exp2.setShares(Arrays.asList(
                new ShareInputDTO(alice.getId(), 1000.00),
                new ShareInputDTO(bob.getId(), 1200.00),
                new ShareInputDTO(charlie.getId(), 800.00),
                new ShareInputDTO(diana.getId(), 800.00)
        ));
        expenseService.createExpense(exp2);

        // Expense 3: High-speed Fiber Internet - Percentage Split
        CreateExpenseRequestDTO exp3 = new CreateExpenseRequestDTO();
        exp3.setGroupId(flatGroup.getId());
        exp3.setDescription("Airtel Fiber 300 Mbps Internet");
        exp3.setAmount(1499.00);
        exp3.setCategory("Utilities");
        exp3.setPaidById(ethan.getId());
        exp3.setSplitType(SplitType.PERCENTAGE);
        exp3.setShares(Arrays.asList(
                new ShareInputDTO(alice.getId(), 33.34),
                new ShareInputDTO(bob.getId(), 33.33),
                new ShareInputDTO(ethan.getId(), 33.33)
        ));
        expenseService.createExpense(exp3);
    }
}
