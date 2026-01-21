#!/usr/bin/env python3
import sys
import json
import re
from collections import Counter

def analyze_logs(log_file):
    """Analizza un file di log alla ricerca di pattern di errore comuni."""
    error_patterns = [
        re.compile(r"ERROR|Critical|Exception|Fail"),
        re.compile(r"Timeout|Connection|Network")
    ]
    
    errors = []
    try:
        with open(log_file, 'r') as f:
            for line in f:
                for pattern in error_patterns:
                    if pattern.search(line):
                        errors.append(line.strip())
                        break
    except FileNotFoundError:
        print(f"Errore: File {log_file} non trovato.")
        return

    if not errors:
        print("Nessun errore rilevato nei log.")
        return

    print(f"Rilevati {len(errors)} errori.")
    most_common = Counter(errors).most_common(5)
    print("\nErrori più frequenti:")
    for err, count in most_common:
        print(f"[{count}] {err}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Utilizzo: python error-analyzer.py <file_di_log>")
    else:
        analyze_logs(sys.argv[1])
