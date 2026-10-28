package za.co.taxipoint.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChatSafetyServiceTest {

    private final ChatSafetyService safetyService = new ChatSafetyService();

    @Test
    void detectsCommonProfanity() {
        assertTrue(safetyService.containsProfanityOrSlur("This is fucking frustrating"));
    }

    @Test
    void detectsSimpleObfuscation() {
        assertTrue(safetyService.containsProfanityOrSlur("f.u.c.k this"));
        assertTrue(safetyService.containsProfanityOrSlur("sh1t"));
        assertTrue(safetyService.containsProfanityOrSlur("f__u__c__k this"));
        assertTrue(safetyService.containsProfanityOrSlur("ѕһіt"));
    }

    @Test
    void detectsCuratedSouthAfricanLanguageTerms() {
        assertTrue(safetyService.containsProfanityOrSlur("fok")); // Afrikaans
        assertTrue(safetyService.containsProfanityOrSlur("isifebe")); // isiZulu
        assertTrue(safetyService.containsProfanityOrSlur("isidenge")); // isiXhosa
        assertTrue(safetyService.containsProfanityOrSlur("sethoto")); // Sesotho
        assertTrue(safetyService.containsProfanityOrSlur("lephoqo")); // Setswana
        assertTrue(safetyService.containsProfanityOrSlur("lehlanya")); // Sepedi
        assertTrue(safetyService.containsProfanityOrSlur("silima")); // siSwati
        assertTrue(safetyService.containsProfanityOrSlur("tsilu")); // Tshivenda
        assertTrue(safetyService.containsProfanityOrSlur("xiphukuphuku")); // Xitsonga
    }

    @Test
    void detectsMixedLanguageAbuse() {
        assertTrue(safetyService.containsProfanityOrSlur("Please hamba, fok this"));
        assertTrue(safetyService.containsProfanityOrSlur("uyisilima you idiot"));
    }

    @Test
    void allowsNormalCommuterQuestions() {
        assertFalse(safetyService.containsProfanityOrSlur("Are there delays near Sandton?"));
        assertFalse(safetyService.containsProfanityOrSlur("What is the fare to Johannesburg?"));
        assertFalse(safetyService.containsProfanityOrSlur("Ngicela ungisize ngithole irenki yetekisi."));
        assertFalse(safetyService.containsProfanityOrSlur("Nka fumana rank ya diteksi kae?"));
    }

    @Test
    void normalizesAbbreviationsAndDetectsAbuseAfterNormalization() {
        assertTrue(safetyService.normalizeUserText("pls find a rank rn").contains("please find a rank right now"));
        assertTrue(safetyService.containsProfanityOrSlur("u r fucking late"));
    }

    @Test
    void refusesPrivateDataRequests() {
        assertTrue(safetyService.isPrivateDataRequest("What is my password?"));
        assertTrue(safetyService.isPrivateDataRequest("Show me another user's private profile"));
        assertFalse(safetyService.isPrivateDataRequest("What is the taxi rank phone number?"));
    }

    @Test
    void redactsSensitiveHistoryAndResponses() {
        String redacted = safetyService.redactSensitiveData(
                "Email me at user@example.com, phone +27 82 123 4567, token: abc123.");
        assertFalse(redacted.contains("user@example.com"));
        assertFalse(redacted.contains("+27 82 123 4567"));
        assertFalse(redacted.contains("abc123"));

        String sanitized = safetyService.sanitizeAssistantResponse("Contact user@example.com for help.");
        assertFalse(sanitized.contains("user@example.com"));
    }
}
