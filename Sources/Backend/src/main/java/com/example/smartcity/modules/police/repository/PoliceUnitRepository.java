package com.example.smartcity.modules.police.repository;

import com.example.smartcity.modules.police.entity.PoliceUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PoliceUnitRepository extends JpaRepository<PoliceUnit, Long> {

    List<PoliceUnit> findByActiveTrue();

    List<PoliceUnit> findByDistrict(String district);

    List<PoliceUnit> findByDistrictAndActiveTrue(String district);

    Optional<PoliceUnit> findByUnitCode(String unitCode);

    boolean existsByUnitCode(String unitCode);
}
