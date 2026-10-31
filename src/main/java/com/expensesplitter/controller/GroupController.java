package com.expensesplitter.controller;

import com.expensesplitter.dto.CreateGroupRequestDTO;
import com.expensesplitter.dto.GroupAnalysisDTO;
import com.expensesplitter.model.Group;
import com.expensesplitter.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<GroupAnalysisDTO> getGroupAnalysis(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupAnalysis(id));
    }

    @PostMapping
    public ResponseEntity<Group> createGroup(@Valid @RequestBody CreateGroupRequestDTO dto) {
        Group created = groupService.createGroup(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Group> addMember(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(groupService.addMember(id, userId));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Group> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(groupService.removeMember(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
