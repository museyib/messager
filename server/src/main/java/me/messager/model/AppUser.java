package me.messager.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;
import org.hibernate.proxy.HibernateProxy;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    @Nationalized
    private String username;

    @Column(length = 100)
    @Nationalized
    private String password;

    @Column(unique = true, nullable = false, length = 100)
    @Nationalized
    private String email;

    @Column(unique = true, nullable = false, length = 100)
    @Nationalized
    private String phone;

    @Column(length = 50)
    private String status;

    @OneToMany(fetch = FetchType.EAGER)
    private List<AppRole> roleList;

    @Column(nullable = false)
    private Boolean verified = false;

    @Column(length = 100)
    @Nationalized
    private String verificationCode;

    @Column
    private LocalDateTime verificationCodeExpiryDate;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private UserPrivacySettings privacySettings;

    @Override
    public final boolean equals(Object object) {
        if (this == object) return true;
        if (object == null) return false;
        Class<?> oEffectiveClass = object instanceof HibernateProxy ? ((HibernateProxy) object).getHibernateLazyInitializer().getPersistentClass() : object.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        AppUser appUser = (AppUser) object;
        return getId() != null && Objects.equals(getId(), appUser.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}
