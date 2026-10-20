"use client";

import type { PatientCase, Severity } from "@/shared/api/patientApi";
import { formatYears } from "@/shared/lib/format";

/** Те же токены, что и на карточках приёмов — результат должен читаться одинаково. */
const SEVERITY_STYLES: Record<Severity, string> = {
    "лёгкая": "bg-severity-light-bg text-severity-light",
    "средняя": "bg-severity-medium-bg text-severity-medium",
    "тяжёлая": "bg-severity-heavy-bg text-severity-heavy",
};

function yesNo(value: boolean) {
    return value ? "Есть" : "Нет";
}

type CaseResultProps = {
    patientCase: PatientCase;
};

/**
 * Результаты расчёта: исходные параметры и рекомендация.
 *
 * Балл и степень тяжести вынесены в отдельный блок наверху — это главный вывод
 * системы, и раньше он терялся в общем списке параметров.
 */
export function CaseResult({ patientCase }: CaseResultProps) {
    const parameters: Array<{ label: string; value: string | number }> = [
        { label: "Возраст на момент приёма", value: formatYears(patientCase.age) },
        { label: "Объём щитовидной железы, мл", value: patientCase.thyroid_volume },
        { label: "сТ4, нг/дл", value: patientCase.st4 },
        { label: "ТТГ, мкМЕ/мл", value: patientCase.ttg },
        { label: "АтрТТГ, МЕ/л", value: patientCase.atrttg },
        { label: "Эндокринная офтальмопатия, стадия", value: patientCase.eop_stage },
        {
            label: "Суточная доза тиреостатиков, мг/сут",
            value: patientCase.thyrostatic_daily_dose_mg,
        },
        {
            label: "Длительность терапии, мес.",
            value: patientCase.thyrostatic_therapy_duration_months,
        },
        {
            label: "Осложнения со стороны ССС",
            value: yesNo(patientCase.ccc_complications),
        },
        {
            label: "Компрессионный синдром",
            value: yesNo(patientCase.compression_syndrome),
        },
        {
            label: "Полиморфизм гена SLCO1B1",
            value: yesNo(patientCase.slco1b1_polymorphism),
        },
        {
            label: "Множественные узлы в ЩЖ",
            value: yesNo(patientCase.mode === "mtz"),
        },
    ];

    return (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Результаты расчёта</h2>

            {/* Главный вывод */}
            <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-brand-100 bg-brand-50 p-4">
                <div>
                    <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">
                        Интегральный показатель
                    </p>
                    <p className="text-3xl font-bold text-brand-600 tabular-nums">
                        {patientCase.score}
                        <span className="ml-1 text-base font-medium">
                            {patientCase.score % 10 === 1 && patientCase.score % 100 !== 11
                                ? "балл"
                                : "баллов"}
                        </span>
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">
                        Степень тяжести
                    </p>
                    <span
                        className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            SEVERITY_STYLES[patientCase.severity] ??
                            "bg-neutral-100 text-neutral-700"
                        }`}
                    >
                        {patientCase.severity}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
                {/* Параметры */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">
                        Исходные параметры
                    </h3>
                    <dl className="divide-y divide-neutral-100">
                        {parameters.map((parameter) => (
                            <div
                                key={parameter.label}
                                className="flex items-baseline justify-between gap-4 py-2.5"
                            >
                                <dt className="text-sm text-neutral-600">
                                    {parameter.label}
                                </dt>
                                <dd className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                                    {parameter.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Рекомендация */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">
                        Рекомендация
                    </h3>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-[15px] leading-relaxed whitespace-pre-line text-neutral-800">
                        {patientCase.recommendation}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                        Расчёт носит справочный характер и не заменяет решение
                        лечащего врача.
                    </p>
                </div>
            </div>
        </section>
    );
}
