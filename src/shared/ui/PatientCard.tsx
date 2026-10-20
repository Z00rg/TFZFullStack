import type { Patient } from "@/shared/api/patientApi";
import { calculateAge, formatDate } from "@/shared/lib/format";

type PatientCardProps = {
    patient: Patient;
    actions?: React.ReactNode;
};

export function PatientCard({ patient, actions }: PatientCardProps) {
    const age = calculateAge(patient.birth_date);

    return (
        <div className="bg-gradient-to-r from-white to-gray-50 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200/50">
            <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex-shrink-0">
                    Карточка пациента
                </h2>
                {actions && (
                    <div className="flex space-x-2 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200/50 shadow-sm min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        ФИО
                    </label>
                    <p className="mt-1 text-sm sm:text-base lg:text-lg font-semibold text-gray-800 break-words">
                        {patient.full_name}
                    </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200/50 shadow-sm min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Дата рождения
                    </label>
                    <p className="mt-1 text-sm sm:text-base lg:text-lg font-semibold text-gray-800">
                        {formatDate(patient.birth_date)}
                        {age !== null && (
                            <span className="text-gray-500 font-normal">
                                {" "}
                                ({age} г.)
                            </span>
                        )}
                    </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200/50 shadow-sm min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        Пол
                    </label>
                    <p className="mt-1 text-sm sm:text-base lg:text-lg font-semibold text-gray-800">
                        {patient.gender_display}
                    </p>
                </div>
            </div>
        </div>
    );
}