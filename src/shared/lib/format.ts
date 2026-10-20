/**
 * Форматирование дат для интерфейса.
 *
 * API отдаёт даты в ISO 8601 (в отличие от прежнего бэкенда, который сразу
 * возвращал «ДД.ММ.ГГГГ»). ISO корректно сортируется и сравнивается, а под
 * локаль строка приводится здесь, в одном месте.
 */

const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
});

function parse(value: string | null | undefined): Date | null {
    if (!value) return null;

    // Дата без времени трактуется как UTC-полдень: иначе в часовых поясах
    // западнее UTC «2000-01-01» показывалось бы как 31.12.1999.
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T12:00:00Z`
        : value;

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** `2001-02-03` → `03.02.2001`. */
export function formatDate(value: string | null | undefined): string {
    const date = parse(value);
    return date ? DATE_FORMATTER.format(date) : "—";
}

/** `2001-02-03T10:20:30Z` → `03.02.2001, 13:20` (в локальном поясе). */
export function formatDateTime(value: string | null | undefined): string {
    const date = parse(value);
    return date ? DATE_TIME_FORMATTER.format(date) : "—";
}

/** Компактная подпись для осей графика: `03.02.01`. */
export function formatShortDate(value: string | null | undefined): string {
    const date = parse(value);
    return date ? SHORT_DATE_FORMATTER.format(date) : "—";
}

/** Полных лет на текущую дату. */
export function calculateAge(birthDate: string | null | undefined): number | null {
    const date = parse(birthDate);
    if (!date) return null;

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age -= 1;
    }

    return Math.max(0, age);
}
