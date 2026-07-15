package com.example.smartcity.modules.feedback.mapper;

import com.example.smartcity.modules.feedback.dto.CategoryDTO;
import com.example.smartcity.modules.feedback.entity.Category;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-15T11:11:24+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class CategoryMapperImpl implements CategoryMapper {

    @Override
    public CategoryDTO toDto(Category entity) {
        if ( entity == null ) {
            return null;
        }

        CategoryDTO.CategoryDTOBuilder categoryDTO = CategoryDTO.builder();

        categoryDTO.id( entity.getId() );
        categoryDTO.code( entity.getCode() );
        categoryDTO.name( entity.getName() );
        categoryDTO.description( entity.getDescription() );
        categoryDTO.nameVi( entity.getNameVi() );
        categoryDTO.nameEn( entity.getNameEn() );
        categoryDTO.descriptionVi( entity.getDescriptionVi() );
        categoryDTO.descriptionEn( entity.getDescriptionEn() );
        categoryDTO.managedByRole( entity.getManagedByRole() );
        categoryDTO.active( entity.isActive() );

        return categoryDTO.build();
    }

    @Override
    public Category toEntity(CategoryDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Category category = new Category();

        category.setId( dto.getId() );
        category.setCode( dto.getCode() );
        category.setName( dto.getName() );
        category.setDescription( dto.getDescription() );
        category.setNameVi( dto.getNameVi() );
        category.setNameEn( dto.getNameEn() );
        category.setDescriptionVi( dto.getDescriptionVi() );
        category.setDescriptionEn( dto.getDescriptionEn() );
        category.setManagedByRole( dto.getManagedByRole() );
        category.setActive( dto.isActive() );

        return category;
    }

    @Override
    public List<CategoryDTO> toDtoList(List<Category> entities) {
        if ( entities == null ) {
            return null;
        }

        List<CategoryDTO> list = new ArrayList<CategoryDTO>( entities.size() );
        for ( Category category : entities ) {
            list.add( toDto( category ) );
        }

        return list;
    }

    @Override
    public List<Category> toEntityList(List<CategoryDTO> dtos) {
        if ( dtos == null ) {
            return null;
        }

        List<Category> list = new ArrayList<Category>( dtos.size() );
        for ( CategoryDTO categoryDTO : dtos ) {
            list.add( toEntity( categoryDTO ) );
        }

        return list;
    }
}
