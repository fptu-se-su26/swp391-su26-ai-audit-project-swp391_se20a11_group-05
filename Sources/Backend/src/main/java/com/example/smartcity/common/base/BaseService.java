package com.example.smartcity.common.base;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BaseService<T extends BaseEntity, ID> {
    T save(T entity);
    T update(ID id, T entity);
    T findById(ID id);
    List<T> findAll();
    Page<T> findAll(Pageable pageable);
    void deleteById(ID id);
}
