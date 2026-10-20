import { useMemo, useState } from "react";

import { usePatientListQuery } from "@/entities/patient";
import type { Patient } from "@/shared/api/patientApi";

/**
 * Список пациентов с выбором и поиском.
 *
 * Фильтрация делается на клиенте: список пациентов одной клиники невелик,
 * а запрос к API на каждое нажатие клавиши того не стоит.
 */
export function useGetPatientList(searchTerm = "") {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const patientListQuery = usePatientListQuery();
    const data = patientListQuery.data;

    const filteredPatientList = useMemo(() => {
        const patients = data ?? [];
        const query = searchTerm.trim().toLowerCase();
        if (!query) return patients;

        return patients.filter((patient) =>
            [patient.full_name, patient.birth_date, patient.gender_display]
                .join(" ")
                .toLowerCase()
                .includes(query),
        );
    }, [data, searchTerm]);

    return {
        patientList: filteredPatientList,
        totalCount: data?.length ?? 0,
        selectedPatient,
        setSelectedPatient,
        isLoading: patientListQuery.isPending,
        isError: patientListQuery.isError,
    };
}
