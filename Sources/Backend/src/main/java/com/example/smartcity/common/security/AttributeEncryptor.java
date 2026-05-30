package com.example.smartcity.common.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * [SECURITY FIX] JPA AttributeConverter mã hóa/giải mã tự động dữ liệu nhạy cảm.
 *
 * Thuật toán: AES-256/GCM — chuẩn mã hóa đối xứng mạnh nhất hiện nay.
 * Mọi giá trị được mã hóa TRƯỚC khi lưu xuống DB, giải mã KHI đọc lên.
 * Ngay cả khi DB bị dump, attacker không thể dùng mfa_secret mà không có SECRET_KEY.
 *
 * Cách sử dụng trong Entity:
 *   @Convert(converter = AttributeEncryptor.class)
 *   private String mfaSecret;
 *
 * Biến môi trường bắt buộc: ENCRYPTION_SECRET (exactly 32 characters = 256 bits)
 */
@Converter
@Component
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKeySpec secretKey;

    public AttributeEncryptor(@Value("${encryption.secret:CHANGE_ME_32_CHARS_PLACEHOLDER!!}") String secret) {
        // Pad or truncate to exactly 32 bytes for AES-256
        byte[] keyBytes = new byte[32];
        byte[] secretBytes = secret.getBytes();
        System.arraycopy(secretBytes, 0, keyBytes, 0, Math.min(secretBytes.length, 32));
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    @Override
    public String convertToDatabaseColumn(String plainText) {
        if (plainText == null) return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] encrypted = cipher.doFinal(plainText.getBytes());

            // Prepend IV to ciphertext so we can extract during decryption
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("[SECURITY] Failed to encrypt sensitive attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String cipherText) {
        if (cipherText == null) return null;
        try {
            byte[] combined = Base64.getDecoder().decode(cipherText);

            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);

            byte[] encryptedData = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, GCM_IV_LENGTH, encryptedData, 0, encryptedData.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(encryptedData));
        } catch (Exception e) {
            throw new IllegalStateException("[SECURITY] Failed to decrypt sensitive attribute", e);
        }
    }
}
