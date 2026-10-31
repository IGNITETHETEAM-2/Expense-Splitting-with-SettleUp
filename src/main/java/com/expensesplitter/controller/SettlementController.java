package com.expensesplitter.controller;

import com.expensesplitter.model.Settlement;
import com.expensesplitter.service.SettlementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settlements")
@CrossOrigin(origins = "*")
public class SettlementController {

    private final SettlementService settlementService;

    public SettlementController(SettlementService settlementService) {
        this.settlementService = settlementService;
    }

    @GetMapping
    public ResponseEntity<List<Settlement>> getSettlements(@RequestParam(required = false) Long groupId) {
        if (groupId != null) {
            return ResponseEntity.ok(settlementService.getSettlementsByGroup(groupId));
        }
        return ResponseEntity.ok(settlementService.getAllSettlements());
    }

    @PostMapping
    public ResponseEntity<Settlement> recordSettlement(@RequestBody Map<String, Object> payload) {
        Long groupId = Long.valueOf(payload.get("groupId").toString());
        Long payerId = Long.valueOf(payload.get("payerId").toString());
        Long payeeId = Long.valueOf(payload.get("payeeId").toString());
        Double amount = Double.valueOf(payload.get("amount").toString());
        String note = payload.get("note") != null ? payload.get("note").toString() : null;

        Settlement created = settlementService.recordSettlement(groupId, payerId, payeeId, amount, note);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
