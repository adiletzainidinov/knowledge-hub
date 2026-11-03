# KnowledgeHub — retrieval evaluation (2026-11-03)

## Baseline
- 99 saved transcripts. Original texts must not be overwritten.
- Production deployment for commit 1d71a386: READY.
- Current retrieval: lexical matches + related concept stems + title boost; **not semantic embeddings**.
- Authenticated live POST /api/admin/research was NOT exercised during this audit. No precision/recall claims yet.

## Coverage smoke test (SQL: count of transcripts containing stem, NOT search relevance)
| Stem | Transcript count |
|---|---:|
| подума | 15 |
| дорог | 22 |
| согласова | 8 |
| решени | 31 |
| пропал | 3 |
| довер | 30 |
| скидк | 14 |
| возражен | 24 |
| звон | 26 |
| crm | 13 |

## Next manual relevance test
For each question, inspect top 5 excerpts and label relevant / partly relevant / irrelevant:
1. Что ответить на «Я подумаю»?
2. Клиент говорит «Дорого».
3. Нужно посоветоваться с женой.
4. Нужно посоветоваться с мужем.
5. Клиент пропал после презентации.
6. Как назначить следующий контакт?
7. Клиент просит скидку.
8. Как повысить доверие?
9. Как выяснить потребность?
10. Как закрыть зависшую сделку?

## Acceptance criteria
- At least 4/5 top results relevant on each question, based on manual reading.
- Every displayed excerpt links to a real source video.
- Mark transcript verification status correctly.
- Separate author-supported statements from practical adaptations.
- If results are weak, say so; do not hallucinate an answer.

## Known limitations
- Stems can match irrelevant contexts.
- Search operates on 900-character windows, sometimes cutting sentences.
- Title boost may outweigh fragment relevance.
- No embeddings, no transcript-level verified claims.
- Source ranking needs authenticated live test before declaring success.
