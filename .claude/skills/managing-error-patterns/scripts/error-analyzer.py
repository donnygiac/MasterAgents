#!/usr/bin/env python3
"""
Analizza log applicativi (JSON strutturati o testo libero) alla ricerca
di pattern di errore, allineato alla gerarchia definita in
resources/exception-hierarchy-design.md (AppError -> code, statusCode, details).

Utilizzo:
    python error-analyzer.py <file_di_log> [--known-codes CODE1,CODE2,...]
"""
import sys
import json
import re
import argparse
from collections import Counter

# Codici noti definiti nella gerarchia standard della skill.
# Aggiorna questa lista (o passa --known-codes) se il progetto ne definisce altri.
DEFAULT_KNOWN_CODES = {
    "VALIDATION_ERROR",
    "NOT_FOUND",
    "NETWORK_ERROR",
    "DATABASE_ERROR",
}

# Fallback per log non strutturati (testo libero).
# Pattern più specifici per evitare falsi positivi (es. "Failover", "Failsafe").
TEXT_ERROR_PATTERN = re.compile(
    r"\b(ERROR|CRITICAL|EXCEPTION|FAILED|FAILURE)\b", re.IGNORECASE
)
TEXT_TRANSIENT_PATTERN = re.compile(
    r"\b(TIMEOUT|CONNECTION REFUSED|NETWORK ERROR|ECONNRESET|ETIMEDOUT)\b",
    re.IGNORECASE,
)


def try_parse_json_line(line: str):
    """Prova a interpretare la riga come oggetto JSON (log strutturato)."""
    line = line.strip()
    if not line.startswith("{"):
        return None
    try:
        return json.loads(line)
    except json.JSONDecodeError:
        return None


def analyze_logs(log_file: str, known_codes: set):
    structured_errors = []
    unstructured_errors = []
    unknown_codes = Counter()

    try:
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                parsed = try_parse_json_line(line)
                if parsed is not None:
                    # Log strutturato: cerchiamo i campi tipici di AppError
                    code = parsed.get("code") or parsed.get("errorCode")
                    if code:
                        structured_errors.append(parsed)
                        if code not in known_codes:
                            unknown_codes[code] += 1
                        continue
                # Fallback: log testuale libero
                if TEXT_ERROR_PATTERN.search(line) or TEXT_TRANSIENT_PATTERN.search(line):
                    unstructured_errors.append(line.strip())
    except FileNotFoundError:
        print(f"Errore: file '{log_file}' non trovato.")
        return
    except OSError as e:
        print(f"Errore di lettura: {e}")
        return

    total = len(structured_errors) + len(unstructured_errors)
    if total == 0:
        print("Nessun errore rilevato nei log.")
        return

    print(f"Rilevati {total} errori totali "
          f"({len(structured_errors)} strutturati, {len(unstructured_errors)} testo libero).\n")

    if structured_errors:
        by_code = Counter(e.get("code") or e.get("errorCode") for e in structured_errors)
        print("Errori strutturati per code (più frequenti):")
        for code, count in by_code.most_common(10):
            print(f"  [{count}] {code}")

        by_status = Counter(e.get("statusCode") for e in structured_errors if e.get("statusCode"))
        if by_status:
            print("\nDistribuzione per statusCode HTTP:")
            for status, count in sorted(by_status.items()):
                print(f"  {status}: {count}")

    if unknown_codes:
        print("\n⚠️  Codici non presenti nella gerarchia documentata "
              "(controlla resources/exception-hierarchy-design.md):")
        for code, count in unknown_codes.most_common():
            print(f"  [{count}] {code}")

    if unstructured_errors:
        print("\nRighe di log non strutturate più frequenti (considera di migrarle a errori tipizzati):")
        for line, count in Counter(unstructured_errors).most_common(5):
            print(f"  [{count}] {line}")


def main():
    parser = argparse.ArgumentParser(description="Analizza log di errore applicativi.")
    parser.add_argument("log_file", help="Percorso del file di log da analizzare")
    parser.add_argument(
        "--known-codes",
        help="Lista separata da virgole di codici errore noti/attesi (sovrascrive i default)",
        default=None,
    )
    args = parser.parse_args()

    known_codes = (
        set(c.strip() for c in args.known_codes.split(","))
        if args.known_codes
        else DEFAULT_KNOWN_CODES
    )

    analyze_logs(args.log_file, known_codes)


if __name__ == "__main__":
    main()
