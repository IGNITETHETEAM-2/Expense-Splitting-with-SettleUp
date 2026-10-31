package com.expensesplitter.service;

import com.expensesplitter.model.User;
import com.expensesplitter.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        if (user.getAvatar() == null || user.getAvatar().isBlank()) {
            // Generate clean initials avatar or colorful placeholder
            String initials = user.getName().length() > 0 ? user.getName().substring(0, 1).toUpperCase() : "U";
            user.setAvatar(initials);
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
