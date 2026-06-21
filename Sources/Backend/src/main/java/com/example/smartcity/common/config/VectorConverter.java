package com.example.smartcity.common.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.postgresql.util.PGobject;
import java.sql.SQLException;
import java.util.Arrays;

@Converter
public class VectorConverter implements AttributeConverter<float[], Object> {

    @Override
    public Object convertToDatabaseColumn(float[] attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            PGobject pgobj = new PGobject();
            pgobj.setType("vector");
            pgobj.setValue(Arrays.toString(attribute));
            return pgobj;
        } catch (SQLException e) {
            throw new IllegalArgumentException("Failed to convert float[] to PGobject vector", e);
        }
    }

    @Override
    public float[] convertToEntityAttribute(Object dbData) {
        if (dbData == null) {
            return null;
        }
        String value;
        if (dbData instanceof PGobject) {
            value = ((PGobject) dbData).getValue();
        } else {
            value = dbData.toString();
        }
        
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        String clean = value.replace("[", "").replace("]", "").trim();
        if (clean.isEmpty()) {
            return new float[0];
        }
        String[] parts = clean.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }
}
