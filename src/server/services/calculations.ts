import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
    accounts,
    calculationHistory,
    patients,
    type Account,
    type CalculationMode,
    type CalculationRecord,
    type Patient,
} from "@/server/db/schema";
import { ApiError } from "@/server/http/api-error";
import type { CalculateRequestInput } from "@/server/validation/schemas";
import {
    calculateAge,
    patientGenderToCalculationGender,
    runCalculation,
    type CalculationInput,
} from "./calculator";

/**
 * История расчётов — перенос `calculate_view`,
 * `PatientCalculationHistoryView` и `CalculationDetailView`.
 */

export interface CalculationWithRelations {
    record: CalculationRecord;
    patient: Patient | null;
    doctor: Account | null;
}

/* ------------------------------------------------------------------ *
 * Создание расчёта
 * ------------------------------------------------------------------ */

export async function createCalculation(params: {
    patient: Patient;
    doctorId: number;
    input: CalculateRequestInput;
}): Promise<CalculationWithRelations> {
    const { patient, doctorId, input } = params;

    // Возраст и пол берутся из карточки пациента, а не из запроса: клиент не
    // должен иметь возможность подменить параметры, влияющие на балл.
    const calculationInput: CalculationInput = {
        ...input,
        age: calculateAge(patient.birthDate),
        gender: patientGenderToCalculationGender(patient.gender),
    };

    const result = runCalculation(calculationInput);

    const [record] = await db
        .insert(calculationHistory)
        .values({
            doctorId,
            patientId: patient.id,
            mode: calculationInput.mode,
            age: calculationInput.age,
            gender: calculationInput.gender,
            st4: calculationInput.st4,
            ttg: calculationInput.ttg,
            atrttg: calculationInput.atrttg,
            thyroidVolume: calculationInput.thyroid_volume,
            eopStage: calculationInput.eop_stage,
            thyrostaticDailyDoseMg: calculationInput.thyrostatic_daily_dose_mg,
            thyrostaticTherapyDurationMonths:
                calculationInput.thyrostatic_therapy_duration_months,
            cccComplications: calculationInput.ccc_complications,
            compressionSyndrome: calculationInput.compression_syndrome,
            slco1b1Polymorphism: calculationInput.slco1b1_polymorphism,
            score: result.score,
            severity: result.severity,
            recommendation: result.recommendation,
        })
        .returning();

    return { record, patient, doctor: null };
}

/* ------------------------------------------------------------------ *
 * Чтение
 * ------------------------------------------------------------------ */

export async function listPatientCalculations(
    patientId: number,
    mode?: CalculationMode,
): Promise<CalculationWithRelations[]> {
    const filter = mode
        ? and(
              eq(calculationHistory.patientId, patientId),
              eq(calculationHistory.mode, mode),
          )
        : eq(calculationHistory.patientId, patientId);

    const rows = await db
        .select({
            record: calculationHistory,
            patient: patients,
            doctor: accounts,
        })
        .from(calculationHistory)
        // Пациент есть всегда (FK NOT NULL), врач может быть удалён — отсюда left join.
        .innerJoin(patients, eq(calculationHistory.patientId, patients.id))
        .leftJoin(accounts, eq(calculationHistory.doctorId, accounts.id))
        .where(filter)
        .orderBy(desc(calculationHistory.createdAt));

    return rows;
}

export async function findCalculationById(
    id: number,
): Promise<CalculationWithRelations | undefined> {
    const [row] = await db
        .select({
            record: calculationHistory,
            patient: patients,
            doctor: accounts,
        })
        .from(calculationHistory)
        .innerJoin(patients, eq(calculationHistory.patientId, patients.id))
        .leftJoin(accounts, eq(calculationHistory.doctorId, accounts.id))
        .where(eq(calculationHistory.id, id))
        .limit(1);

    return row;
}

export async function getCalculationOrFail(
    id: number,
): Promise<CalculationWithRelations> {
    const row = await findCalculationById(id);
    if (!row) {
        throw ApiError.notFound("Расчёт не найден.");
    }
    return row;
}

export async function deleteCalculation(id: number): Promise<void> {
    const [deleted] = await db
        .delete(calculationHistory)
        .where(eq(calculationHistory.id, id))
        .returning({ id: calculationHistory.id });

    if (!deleted) {
        throw ApiError.notFound("Расчёт не найден.");
    }
}
