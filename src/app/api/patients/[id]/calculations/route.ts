import { requireUser } from "@/server/auth/guards";
import {
    json,
    parseId,
    parseQuery,
    withApi,
    type RouteContext,
} from "@/server/http/handler";
import { listPatientCalculations } from "@/server/services/calculations";
import { getPatientOrFail } from "@/server/services/patients";
import { toCalculationDto } from "@/server/services/presenters";
import { calculationListQuerySchema } from "@/server/validation/schemas";

type Context = RouteContext<{ id: string }>;

/**
 * GET /api/patients/{id}/calculations — перенос `PatientCalculationHistoryView`.
 * Поддерживает фильтр `?mode=dtz|mtz`.
 */
export const GET = withApi<{ id: string }>(async (request, context: Context) => {
    await requireUser();

    const patientId = parseId((await context.params).id, "Идентификатор пациента");
    // Проверяем существование пациента, чтобы на неизвестный id отдать 404,
    // а не пустой список.
    await getPatientOrFail(patientId);

    const { mode } = parseQuery(request, calculationListQuerySchema);
    const rows = await listPatientCalculations(patientId, mode);

    return json(
        rows.map(({ record, patient, doctor }) =>
            toCalculationDto(record, patient, doctor),
        ),
    );
});
