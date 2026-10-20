"use client";

import { useWorkerProfilesQuery } from "@/entities/profile";
import { formatDate } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/Skeleton";

const ROLE_BADGE: Record<string, string> = {
    SUPERADMIN: "bg-purple-100 text-purple-800",
    ADMIN: "bg-blue-100 text-blue-800",
    WORKER: "bg-gray-100 text-gray-800",
};

/** Таблица сотрудников — заменяет раздел WorkerProfile из Django-админки. */
export function WorkerProfilesTable() {
    const { data, isPending, isError, error } = useWorkerProfilesQuery();

    if (isPending) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <p className="text-sm text-red-600">
                Не удалось загрузить список сотрудников
                {error instanceof Error ? `: ${error.message}` : ""}
            </p>
        );
    }

    if (!data || data.length === 0) {
        return (
            <p className="text-sm text-gray-500">
                Сотрудники пока не зарегистрированы.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                        <th scope="col" className="py-2 pr-4 font-medium">
                            Сотрудник
                        </th>
                        <th scope="col" className="py-2 pr-4 font-medium">
                            Email
                        </th>
                        <th scope="col" className="py-2 pr-4 font-medium">
                            Место работы
                        </th>
                        <th scope="col" className="py-2 pr-4 font-medium">
                            Должность
                        </th>
                        <th scope="col" className="py-2 pr-4 font-medium">
                            Роль
                        </th>
                        <th scope="col" className="py-2 font-medium">
                            Регистрация
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map(({ id, user, work, position }) => (
                        <tr key={id} className="hover:bg-gray-50">
                            <td className="py-3 pr-4 font-medium text-gray-800">
                                {[user.surname, user.name, user.patronymic]
                                    .filter(Boolean)
                                    .join(" ")}
                            </td>
                            <td className="py-3 pr-4 text-gray-600">{user.email}</td>
                            <td className="py-3 pr-4 text-gray-600">{work || "—"}</td>
                            <td className="py-3 pr-4 text-gray-600">
                                {position || "—"}
                            </td>
                            <td className="py-3 pr-4">
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        ROLE_BADGE[user.role] ??
                                        "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {user.role_display}
                                </span>
                            </td>
                            <td className="py-3 text-gray-500">
                                {formatDate(user.created_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
