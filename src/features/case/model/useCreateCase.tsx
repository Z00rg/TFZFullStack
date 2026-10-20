"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useCreateCaseMutation } from "@/entities/case";
import type { CalculateData } from "@/shared/api/caseApi";

export type UseCreateCaseFormProps = {
    closeModal: () => void;
    idPatient: number;
};

export function useCreateCaseForm({
    closeModal,
    idPatient,
}: UseCreateCaseFormProps) {
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<CalculateData>({
        defaultValues: {
            mode: "dtz",
            st4: "",
            ttg: "",
            atrttg: "",
            thyroid_volume: "",
            eop_stage: "",
            thyrostatic_daily_dose_mg: "",
            thyrostatic_therapy_duration_months: "",
            ccc_complications: false,
            compression_syndrome: false,
            slco1b1_polymorphism: false,
            multiple_thyroid_nodules: false,
        },
    });

    // Множественные узлы в обеих долях — это и есть МТЗ, поэтому режим
    // выводится из переключателя, а не выбирается отдельно.
    const multipleNodules = useWatch({
        control,
        name: "multiple_thyroid_nodules",
    });

    useEffect(() => {
        setValue("mode", multipleNodules ? "mtz" : "dtz");
    }, [multipleNodules, setValue]);

    const createCaseMutation = useCreateCaseMutation({
        idPatient,
        onSuccessActions: [closeModal],
    });

    return {
        control,
        errors,
        handleSubmit: handleSubmit((data) => createCaseMutation.mutate(data)),
        isSubmitting: createCaseMutation.isPending,
    };
}
