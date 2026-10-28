package za.co.taxipoint.service;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** Safety boundary for user messages and model responses. */
@Service
public class ChatSafetyService {

    public static final String RESPECTFUL_RESPONSE =
            "I'm happy to help, but please keep the conversation respectful. "
                    + "You can ask me about taxi ranks, routes, fares, delays, or using TaxiPoint.";

    public static final String PRIVATE_DATA_RESPONSE =
            "I can't access or share passwords, tokens, private profiles, or another person's personal data. "
                    + "I can still help with TaxiPoint routes, ranks, fares, and delays.";

    // Language-tagged starter terms. Native-speaker review is still required
    // before treating any language list as complete.
    private static final Map<String, Set<String>> BLOCKED_TERMS_BY_LANGUAGE = Map.of(
            "en", Set.of(
                    "fuck", "fucking", "fucked", "shit", "shitty", "bitch", "bitches",
                    "asshole", "assholes", "bastard", "bastards", "cunt", "cunts",
                    "dickhead", "motherfucker", "motherfuckers", "nigger", "niggers",
                    "faggot", "faggots"),
            "af", Set.of("fok", "fokken", "kak", "poes", "kont", "naai", "hoer"),
            "zu", Set.of("isifebe", "sifebe", "isithutha", "silima"),
            "xh", Set.of("isifebe", "sifebe", "isidenge"),
            "st", Set.of("sethoto", "lehlanya"),
            "tn", Set.of("sethoto", "lephoqo"),
            "nso", Set.of("sethoto", "lehlanya"),
            "ss", Set.of("silima", "sifebe"),
            "ve", Set.of("tsilu", "phombwe"),
            "ts", Set.of("xiphukuphuku", "xifebe")
    );

    private static final Set<String> BLOCKED_TERMS = BLOCKED_TERMS_BY_LANGUAGE.values().stream()
            .collect(HashSet::new, Set::addAll, Set::addAll);

    private static final Map<String, String> ABBREVIATIONS = new LinkedHashMap<>();

    static {
        ABBREVIATIONS.put("w/", "with");
        ABBREVIATIONS.put("w/o", "without");
        ABBREVIATIONS.put("pls", "please");
        ABBREVIATIONS.put("plz", "please");
        ABBREVIATIONS.put("u", "you");
        ABBREVIATIONS.put("ur", "your");
        ABBREVIATIONS.put("r", "are");
        ABBREVIATIONS.put("idk", "I don't know");
        ABBREVIATIONS.put("imo", "in my opinion");
        ABBREVIATIONS.put("btw", "by the way");
        ABBREVIATIONS.put("asap", "as soon as possible");
        ABBREVIATIONS.put("rn", "right now");
        ABBREVIATIONS.put("tmrw", "tomorrow");
        ABBREVIATIONS.put("thx", "thanks");
        ABBREVIATIONS.put("ty", "thank you");
    }

    private static final Pattern EMAIL = Pattern.compile(
            "(?i)(?<![\\w.+-])[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+(?![\\w.-])");
    private static final Pattern PHONE = Pattern.compile(
            "(?<!\\w)\\+?\\d[\\d\\s().-]{7,}\\d(?!\\w)");
    private static final Pattern SECRET = Pattern.compile(
            "(?i)\\b(?:password|passcode|pin|token|api[- ]?key|secret|authorization)\\b"
                    + "\\s*[:=]?\\s*[^\\s,;]+");
    private static final Pattern IDENTIFIER = Pattern.compile(
            "(?i)\\b(?:identity|account|reference|passport|license|licence)"
                    + "(?:\\s+number|\\s+id)?\\b\\s*[:#-]?\\s*[a-z0-9-]{4,}");
    private static final Pattern PRIVATE_REQUEST = Pattern.compile(
            "\\b(?:password|passcode|pin|token|api key|secret|login details|credentials)\\b"
                    + "|\\b(?:my|your|their|another|someone else's|other)\\b.*\\b"
                    + "(?:email|phone|number|profile|account|personal details|private data|id)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+", Pattern.CASE_INSENSITIVE);
    private static final Pattern ZERO_WIDTH = Pattern.compile("[\\u200B-\\u200D\\uFEFF]");
    private static final Pattern REPEATED_LETTERS = Pattern.compile("(.)\\1{2,}");

    public boolean containsProfanityOrSlur(String message) {
        if (message == null || message.isBlank()) return false;

        String normalized = normalizeForDetection(message);
        for (String word : normalized.split(" ")) {
            if (BLOCKED_TERMS.contains(word)) return true;
        }
        String compact = normalized.replace(" ", "");
        return BLOCKED_TERMS.stream().anyMatch(compact::contains);
    }

    public boolean isPrivateDataRequest(String message) {
        return message != null && PRIVATE_REQUEST.matcher(normalizeUserText(message)).find();
    }

    public String normalizeUserText(String message) {
        if (message == null) return "";

        String normalized = Normalizer.normalize(message, Normalizer.Form.NFKC)
                .replace('а', 'a').replace('е', 'e').replace('і', 'i').replace('о', 'o').replace('р', 'p')
                .replace('с', 'c').replace('х', 'x').replace('у', 'y').replace('ѕ', 's').replace('һ', 'h');
        normalized = ZERO_WIDTH.matcher(normalized).replaceAll("");

        for (Map.Entry<String, String> abbreviation : ABBREVIATIONS.entrySet()) {
            String expression = "(?i)(?<![a-z0-9])" + Pattern.quote(abbreviation.getKey()) + "(?![a-z0-9])";
            normalized = normalized.replaceAll(expression, abbreviation.getValue());
        }
        return normalized.replaceAll("\\s+", " ").trim();
    }

    public String redactSensitiveData(String message) {
        if (message == null || message.isBlank()) return message;

        String redacted = SECRET.matcher(message).replaceAll("[private credential removed]");
        redacted = EMAIL.matcher(redacted).replaceAll("[private email removed]");
        redacted = PHONE.matcher(redacted).replaceAll("[private phone removed]");
        return IDENTIFIER.matcher(redacted).replaceAll("[private identifier removed]");
    }

    public String sanitizeAssistantResponse(String response) {
        if (response == null || response.isBlank()) return RESPECTFUL_RESPONSE;
        if (containsProfanityOrSlur(response)) return RESPECTFUL_RESPONSE;

        String sanitized = response
                .replace("**", "")
                .replace("__", "")
                .replaceAll("```[\\s\\S]*?```", "")
                .replaceAll("(?i)\\bthe TaxiPoint database\\b", "TaxiPoint's records")
                .replaceAll("(?i)\\bour database\\b", "our records")
                .trim();
        return redactSensitiveData(sanitized);
    }

    private String normalizeForDetection(String message) {
        String normalized = normalizeUserText(message)
                .toLowerCase(Locale.ROOT)
                .replace('0', 'o').replace('1', 'i').replace('3', 'e')
                .replace('4', 'a').replace('5', 's').replace('7', 't')
                .replace('@', 'a').replace('$', 's');
        normalized = NON_ALPHANUMERIC.matcher(normalized).replaceAll(" ").trim();
        return REPEATED_LETTERS.matcher(normalized).replaceAll("$1$1");
    }
}
