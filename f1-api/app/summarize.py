"""Resumo extrativo simples (sem dependencias externas).

Pontua frases por frequencia de palavras-significativas e favorece o comeco
do texto; as melhores sao devolvidas na ordem original do artigo.
"""

import re
from collections import Counter

STOPWORDS = set(
    """
    a an and or of to in for on with is are was were it its his her they them
    that this these those from as at by be been being will would can could
    shall should may might must have has had not but so if into about after
    before during which who whom whose what when where how all more most
    other some such no nor own same than too very just now then here there
    also we you he she i us our your their said says says new team teams
    he
    """.split()
)

_SENT_SPLIT = re.compile(r"(?<=[.!?…])\s+(?=[“\"A-ZÀ-Ý0-9])")
_WORD = re.compile(r"[a-z']+")


def split_sentences(paragraph):
    return [s.strip() for s in _SENT_SPLIT.split(paragraph) if s.strip()]


def summarize(paragraphs, max_sentences=10):
    sentences = []
    for paragraph in paragraphs:
        sentences.extend(
            s for s in split_sentences(paragraph) if len(s) > 60
        )
    if len(sentences) <= max_sentences:
        return sentences

    words = _WORD.findall(" ".join(sentences).lower())
    freq = Counter(
        w for w in words if w not in STOPWORDS and len(w) > 2
    )

    def score(index, sentence):
        ws = _WORD.findall(sentence.lower())
        meaningful = [w for w in ws if w in freq]
        base = sum(freq[w] for w in meaningful) / max(1, len(meaningful) or 1)
        position = 1.5 * (len(sentences) - index) / len(sentences)
        return base + position

    ranked = sorted(
        range(len(sentences)),
        key=lambda i: score(i, sentences[i]),
        reverse=True,
    )[:max_sentences]
    return [sentences[i] for i in sorted(ranked)]
