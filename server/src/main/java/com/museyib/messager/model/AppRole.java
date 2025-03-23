package com.museyib.messager.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class AppRole {

    @Id
    private String roleId;

    @Column
    private String roleName;
}
