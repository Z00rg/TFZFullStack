import type { CalculationGender, CalculationMode } from "@/server/db/schema";

/**
 * Расчёт интегрального показателя тяжести тиреотоксикоза.
 *
 * Прямой перенос `main/services/calculator.py`: пороги, веса и формулировки
 * рекомендаций сохранены дословно, чтобы результаты совпадали с предыдущей
 * версией системы. Единственное отличие — пол теперь реально доходит до
 * расчёта (в Django в поле `gender` попадал код 0/1, который никогда не был
 * равен строке "male", из-за чего балл за мужской пол не начислялся).
 */

export interface CalculationInput {
    mode: CalculationMode;
    age: number;
    gender: CalculationGender;
    st4: number;
    ttg: number;
    atrttg: number;
    thyroid_volume: number;
    eop_stage: number;
    thyrostatic_daily_dose_mg: number;
    thyrostatic_therapy_duration_months: number;
    ccc_complications: boolean;
    compression_syndrome: boolean;
    slco1b1_polymorphism: boolean;
}

export interface CalculationResult {
    score: number;
    severity: Severity;
    recommendation: string;
}

export type Severity = "лёгкая" | "средняя" | "тяжёлая";

/** Код пола пациента (0/1) → значение, с которым работает расчёт. */
export function patientGenderToCalculationGender(
    gender: number,
): CalculationGender {
    return gender === 0 ? "male" : "female";
}

/** Полных лет на указанную дату. */
export function calculateAge(birthDate: string, today = new Date()): number {
    const [year, month, day] = birthDate.split("-").map(Number);

    let age = today.getUTCFullYear() - year;
    const hasHadBirthday =
        today.getUTCMonth() + 1 > month ||
        (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);

    if (!hasHadBirthday) age -= 1;
    return Math.max(0, age);
}

/* ------------------------------------------------------------------ *
 * Балл
 * ------------------------------------------------------------------ */

export function calculateScore(
    data: CalculationInput,
    multipleThyroidNodules: boolean,
): number {
    let score = 0;

    // 1. Возраст
    if (data.age <= 30) score += 3;
    else if (data.age <= 39) score += 2;
    else if (data.age <= 49) score += 1;

    // 2. Пол
    if (data.gender === "male") score += 1;

    // 3. сТ4 (нг/дл)
    if (data.st4 <= 1.78) score += 0;
    else if (data.st4 <= 2.78) score += 1;
    else if (data.st4 <= 3.78) score += 2;
    else if (data.st4 <= 4.78) score += 3;
    else score += 4;

    // 4. ТТГ (мкМЕ/мл)
    if (data.ttg > 2.5) score += 0;
    else if (data.ttg >= 0.1) score += 1;
    else score += 4;

    // 5. АтрТТГ (МЕ/л)
    if (data.atrttg <= 1.0) score += 0;
    else if (data.atrttg <= 3.0) score += 1;
    else if (data.atrttg <= 5.0) score += 2;
    else if (data.atrttg <= 10.0) score += 3;
    else score += 4;

    // 6. Объём ЩЖ (мл)
    if (data.thyroid_volume < 25) score += 0;
    else if (data.thyroid_volume <= 40) score += 1;
    else if (data.thyroid_volume <= 60) score += 2;
    else if (data.thyroid_volume <= 80) score += 3;
    else score += 4;

    // 7. Стадия ЭОП
    score += data.eop_stage;

    // 8. Суточная доза тиреостатиков (мг)
    const dose = data.thyrostatic_daily_dose_mg;
    if (dose <= 4.9) score += 0;
    else if (dose <= 10) score += 1;
    else if (dose <= 15) score += 2;
    else if (dose <= 20) score += 3;
    else score += 4;

    // 9. Длительность терапии (мес.)
    const duration = data.thyrostatic_therapy_duration_months;
    if (duration <= 12 || duration > 48) score += 4;
    else if (duration <= 24) score += 1;
    else if (duration <= 36) score += 2;
    else score += 3;

    // 10–13. Бинарные факторы
    if (data.ccc_complications) score += 4;
    if (data.compression_syndrome) score += 4;
    if (!data.slco1b1_polymorphism) score += 4;
    if (multipleThyroidNodules) score += 4;

    return score;
}

/* ------------------------------------------------------------------ *
 * Степень тяжести
 * ------------------------------------------------------------------ */

export function getSeverity(score: number): Severity {
    if (score <= 13) return "лёгкая";
    if (score <= 26) return "средняя";
    return "тяжёлая";
}

/* ------------------------------------------------------------------ *
 * Рекомендация
 * ------------------------------------------------------------------ */

const INDIVIDUAL_CONSULTATION =
    "Требуется индивидуальная консультация специалиста для определения " +
    "оптимального объёма операции.";

export function getRecommendation(
    data: CalculationInput,
    score: number,
    mode: CalculationMode,
): string {
    const severity = getSeverity(score);
    const summary =
        `Интегральный показатель: ${score} баллов.\n` +
        `Степень тяжести тиреотоксикоза: ${severity}.\n\n`;

    const hasPolymorphism = data.slco1b1_polymorphism;
    const isLightOrMedium = score <= 17;
    const isMediumOrHeavy = score >= 18;
    const lowAntibodies = data.atrttg <= 3.9;
    const highAntibodies = data.atrttg > 3.9;
    const noComplications = !data.ccc_complications;
    const isMale = data.gender === "male";

    let advice: string;

    if (mode === "dtz") {
        advice = "--- Рекомендация для ДТЗ ---\n";

        if (hasPolymorphism && isLightOrMedium && lowAntibodies && noComplications) {
            advice +=
                "Субтотальная резекция ЩЖ (СРЩЖ). Обоснование: наличие полиморфизма " +
                "SLCO1B1; лёгкая/средняя тяжесть (0–17 баллов); титр а/т к рТТГ " +
                "≤ 3,90 МЕ/л; отсутствие осложнений ССС.";
        } else if (!hasPolymorphism && isMediumOrHeavy && (highAntibodies || isMale)) {
            const reasons = [
                "отсутствие полиморфизма SLCO1B1",
                "средняя/тяжёлая тяжесть (18–40 баллов)",
            ];
            if (highAntibodies) reasons.push("титр а/т к рТТГ > 3,90 МЕ/л");
            if (isMale) reasons.push("мужской пол");
            advice += `Тиреоидэктомия. Обоснование: ${reasons.join("; ")}.`;
        } else {
            advice += INDIVIDUAL_CONSULTATION;
        }
    } else {
        advice = "--- Рекомендация для МТЗ ---\n";

        if (hasPolymorphism && isLightOrMedium && noComplications) {
            advice +=
                "Субтотальная резекция ЩЖ (СРЩЖ). Обоснование: наличие полиморфизма " +
                "SLCO1B1; лёгкая/средняя тяжесть (0–17 баллов); отсутствие " +
                "осложнений ССС.";
        } else if (!hasPolymorphism && isMediumOrHeavy) {
            advice +=
                "Тиреоидэктомия. Обоснование: отсутствие полиморфизма SLCO1B1; " +
                "средняя/тяжёлая тяжесть (18–40 баллов); множественные узлы в обеих " +
                "долях ЩЖ.";
        } else {
            advice += INDIVIDUAL_CONSULTATION;
        }
    }

    return summary + advice;
}

/* ------------------------------------------------------------------ *
 * Точка входа
 * ------------------------------------------------------------------ */

export function runCalculation(data: CalculationInput): CalculationResult {
    // Режим МТЗ по определению означает множественные узлы в обеих долях.
    const multipleThyroidNodules = data.mode === "mtz";

    const score = calculateScore(data, multipleThyroidNodules);

    return {
        score,
        severity: getSeverity(score),
        recommendation: getRecommendation(data, score, data.mode),
    };
}
