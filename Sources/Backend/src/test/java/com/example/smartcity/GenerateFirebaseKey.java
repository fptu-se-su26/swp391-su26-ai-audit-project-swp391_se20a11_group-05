package com.example.smartcity;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.util.Base64;
import java.nio.file.Files;
import java.nio.file.Paths;

public class GenerateFirebaseKey {
    public static void main(String[] args) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        PrivateKey privateKey = kp.getPrivate();
        
        String encodedKey = Base64.getMimeEncoder().encodeToString(privateKey.getEncoded());
        String pemKey = "-----BEGIN PRIVATE KEY-----\n" + encodedKey + "\n-----END PRIVATE KEY-----\n";
        
        String json = "{\n" +
                "  \"type\": \"service_account\",\n" +
                "  \"project_id\": \"mock-project-id\",\n" +
                "  \"private_key_id\": \"mockprivatekeyid1234567890\",\n" +
                "  \"private_key\": \"" + pemKey.replace("\n", "\\n").replace("\r", "") + "\",\n" +
                "  \"client_email\": \"firebase-adminsdk-mock@mock-project-id.iam.gserviceaccount.com\",\n" +
                "  \"client_id\": \"123456789012345678901\",\n" +
                "  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n" +
                "  \"token_uri\": \"https://oauth2.googleapis.com/token\",\n" +
                "  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n" +
                "  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-mock%40mock-project-id.iam.gserviceaccount.com\"\n" +
                "}\n";
        
        Files.writeString(Paths.get("src/main/resources/serviceAccountKey.json"), json);
        System.out.println("serviceAccountKey.json generated successfully.");
    }
}
