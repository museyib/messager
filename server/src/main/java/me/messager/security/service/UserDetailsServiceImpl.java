package me.messager.security.service;

import me.messager.exception.UserNotVerifiedException;
import me.messager.security.model.UserDetailsImpl;
import me.messager.model.AppUser;
import me.messager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<AppUser> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            AppUser appUser = user.get();
            if (!appUser.getVerified())
                throw new UserNotVerifiedException(username);
            return new UserDetailsImpl(user.get());
        }
        else
            throw new UsernameNotFoundException("Invalid username: " + username);
    }
}
