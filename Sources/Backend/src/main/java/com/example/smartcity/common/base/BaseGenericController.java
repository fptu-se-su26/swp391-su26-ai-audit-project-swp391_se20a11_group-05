package com.example.smartcity.common.base;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

public abstract class BaseGenericController<E extends BaseEntity, D, ID> {

    protected abstract BaseService<E, ID> getService();
    protected abstract BaseMapper<E, D> getMapper();

    @PostMapping
    public ResponseEntity<D> create(@RequestBody D dto) {
        E entity = getMapper().toEntity(dto);
        E savedEntity = getService().save(entity);
        return new ResponseEntity<>(getMapper().toDto(savedEntity), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<D> update(@PathVariable ID id, @RequestBody D dto) {
        E entity = getMapper().toEntity(dto);
        E updatedEntity = getService().update(id, entity);
        return ResponseEntity.ok(getMapper().toDto(updatedEntity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<D> getById(@PathVariable ID id) {
        E entity = getService().findById(id);
        return ResponseEntity.ok(getMapper().toDto(entity));
    }

    @GetMapping
    public ResponseEntity<List<D>> getAll() {
        List<E> entities = getService().findAll();
        return ResponseEntity.ok(getMapper().toDtoList(entities));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<D>> getAllPaged(Pageable pageable) {
        Page<E> entities = getService().findAll(pageable);
        return ResponseEntity.ok(entities.map(getMapper()::toDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable ID id) {
        getService().deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
