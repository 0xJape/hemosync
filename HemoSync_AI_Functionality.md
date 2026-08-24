# HemoSync AI Functionality

## AI Purpose
Groq provides natural-language screening support and educational explanations.

## Inputs
- Heart rate
- SpO₂
- Signal quality
- Historical readings
- Measurement context

## Outputs
- Patient summary
- Healthcare worker summary
- Trend description
- Educational guidance
- Confidence based on data quality

## AI Boundaries
The AI must NOT:
- Diagnose hypertension
- Diagnose anemia
- Prescribe medication
- Replace clinical judgment

## Prompt Strategy
Backend sends structured JSON.
Require structured JSON response.
Fallback to rule-based summary if unavailable.
