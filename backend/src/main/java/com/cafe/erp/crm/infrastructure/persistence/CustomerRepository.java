package com.cafe.erp.crm.infrastructure.persistence;
import com.cafe.erp.crm.domain.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; import java.util.UUID;
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByPhoneAndDeletedFalse(String phone);
    boolean existsByPhone(String phone);
}
