import { useGetPatientCasesList } from "@/features/patient/model/useGetPatientCasesList";
import { PatientCaseCardSkeleton } from "@/shared/ui/Skeleton";
import { Button } from "@/shared/ui/Button";
import type { Patient, PatientCase } from "@/shared/api/patientApi";
import { UiModal } from "@/shared/ui/UiModal";
import { CreateCaseForm } from "@/features/case/ui/createCaseForm";
import { PatientCasesChart } from "@/features/patient/ui/PatientCasesChart";
import { formatDateTime } from "@/shared/lib/format";

type PatientCasesListProps = {
    selectedCase: PatientCase | null;
    setSelectedCase: (selectedCase: PatientCase) => void;
    idPatient: number;
    onOpenCase: (patientCase: PatientCase) => void;
    selectedPatient: Patient;
};

/** Подсветка степени тяжести — те же три градации, что и в расчёте. */
const SEVERITY_STYLES: Record<string, string> = {
    "лёгкая": "bg-emerald-100 text-emerald-800",
    "средняя": "bg-amber-100 text-amber-800",
    "тяжёлая": "bg-red-100 text-red-800",
};

export function PatientCasesList({
    selectedCase,
    setSelectedCase,
    idPatient,
    onOpenCase,
}: PatientCasesListProps) {
    const { patientCasesList, isError, isLoading } =
        useGetPatientCasesList(idPatient);

    const handleCaseClick = (patientCase: PatientCase) => {
        setSelectedCase(patientCase);
        onOpenCase(patientCase);
    };

    const addCaseButton = (
        <UiModal
            button={
                <Button
                    variant="secondary"
                    className="w-full min-h-[60px] sm:h-23 text-3xl sm:text-4xl text-blue-800 font-medium bg-blue-100 hover:border hover:border-blue-500 hover:bg-blue-100"
                >
                    +
                </Button>
            }
        >
            {({ close }) => (
                <CreateCaseForm closeModal={close} idPatient={idPatient} />
            )}
        </UiModal>
    );

    return (
        <div className="bg-gradient-to-r from-white to-gray-50 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200/50">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Список приемов
                </h2>
            </div>

            {/* Состояние загрузки */}
            {isLoading && (
                <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <PatientCaseCardSkeleton key={index} />
                    ))}
                </div>
            )}

            {/* Состояние ошибки */}
            {isError && !isLoading && (
                <div className="p-6 sm:p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                        <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                        Ошибка загрузки
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4">
                        Не удалось загрузить список приемов
                    </p>
                    <Button variant="secondary" onPress={() => window.location.reload()}>
                        Попробовать снова
                    </Button>
                </div>
            )}

            {/* Пустой список */}
            {!isLoading && !isError && patientCasesList.length === 0 && (
                <div className="p-6 sm:p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                        <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                        Приемы не найдены
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
                        Добавьте первый прием, нажав кнопку ниже
                    </p>
                    <div className="w-full sm:w-1/2 mx-auto">{addCaseButton}</div>
                </div>
            )}

            {/* График динамики показателей */}
            {!isLoading && !isError && patientCasesList.length >= 2 && (
                <PatientCasesChart cases={patientCasesList} />
            )}

            {/* Список приемов */}
            {!isLoading && !isError && patientCasesList.length > 0 && (
                <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {patientCasesList.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleCaseClick(item)}
                            aria-pressed={selectedCase?.id === item.id}
                            className={`p-3 sm:p-4 border rounded-lg text-left cursor-pointer transition-all duration-200 ${
                                selectedCase?.id === item.id
                                    ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-inner"
                                    : "border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex flex-col gap-2">
                                <h3 className="font-medium text-sm sm:text-base text-gray-800">
                                    Прием от {formatDateTime(item.created_at)}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                        {item.mode === "dtz" ? "ДТЗ" : "МТЗ"}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                            SEVERITY_STYLES[item.severity] ??
                                            "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {item.score} б. — {item.severity}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}

                    {addCaseButton}
                </div>
            )}
        </div>
    );
}
