import {
    bigint,
    bigserial,
    boolean,
    check,
    date,
    doublePrecision,
    index,
    integer,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ *
 * Перечисления
 * ------------------------------------------------------------------ */

export const accountRoleEnum = pgEnum("account_role", [
    "SUPERADMIN",
    "ADMIN",
    "WORKER",
]);

export const calculationModeEnum = pgEnum("calculation_mode", ["dtz", "mtz"]);

export const calculationGenderEnum = pgEnum("calculation_gender", [
    "male",
    "female",
]);

export const ACCOUNT_ROLES = accountRoleEnum.enumValues;
export const CALCULATION_MODES = calculationModeEnum.enumValues;
export const CALCULATION_GENDERS = calculationGenderEnum.enumValues;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];
export type CalculationMode = (typeof CALCULATION_MODES)[number];
export type CalculationGender = (typeof CALCULATION_GENDERS)[number];

/** Пол пациента хранится числом — так же, как в исходной модели Django. */
export const PATIENT_GENDER = { MALE: 0, FEMALE: 1 } as const;

/* ------------------------------------------------------------------ *
 * Аккаунты
 * ------------------------------------------------------------------ */

export const accounts = pgTable(
    "accounts",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        email: text("email").notNull(),
        passwordHash: text("password_hash").notNull(),
        name: text("name").notNull(),
        surname: text("surname").notNull(),
        patronymic: text("patronymic").notNull().default(""),
        role: accountRoleEnum("role").notNull().default("WORKER"),
        isActive: boolean("is_active").notNull().default(true),
        isStaff: boolean("is_staff").notNull().default(false),
        isSuperuser: boolean("is_superuser").notNull().default(false),
        /**
         * Поколение сессий пользователя.
         *
         * Access-токен не проверяется по Redis (это стоило бы сетевого запроса
         * на каждый вызов API), поэтому сам по себе остался бы валидным до
         * истечения срока — даже после отзыва сессий. Номер поколения
         * записывается в токен и сверяется с аккаунтом, который
         * `getCurrentUser` и так читает из БД: отзыв становится мгновенным,
         * не добавляя ни одного обращения к внешним сервисам.
         *
         * В отличие от сравнения с временем отзыва, здесь нет зависимости от
         * точности часов и секундного разрешения поля `iat`.
         */
        sessionVersion: integer("session_version").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        // Email хранится и ищется в нижнем регистре (см. normalizeEmail),
        // поэтому обычного уникального индекса достаточно.
        uniqueIndex("accounts_email_unique").on(table.email),
        index("accounts_created_at_idx").on(table.createdAt),
    ],
);

/* ------------------------------------------------------------------ *
 * Профиль сотрудника
 * ------------------------------------------------------------------ */

export const workerProfiles = pgTable(
    "worker_profiles",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        userId: bigint("user_id", { mode: "number" })
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),
        work: text("work").notNull().default(""),
        position: text("position").notNull().default(""),
    },
    (table) => [uniqueIndex("worker_profiles_user_id_unique").on(table.userId)],
);

/* ------------------------------------------------------------------ *
 * Пациенты
 * ------------------------------------------------------------------ */

export const patients = pgTable(
    "patients",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        name: text("name").notNull(),
        surname: text("surname").notNull(),
        patronymic: text("patronymic").notNull().default(""),
        birthDate: date("birth_date", { mode: "string" }).notNull(),
        gender: smallint("gender").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("patients_created_at_idx").on(table.createdAt),
        // Пол ограничен на уровне БД: в Django это были только `choices`,
        // то есть проверка на уровне приложения, которую мог обойти любой
        // прямой запрос к базе.
        check("patients_gender_check", sql`${table.gender} in (0, 1)`),
    ],
);

/* ------------------------------------------------------------------ *
 * История расчётов
 * ------------------------------------------------------------------ */

export const calculationHistory = pgTable(
    "calculation_history",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),

        // SET NULL — расчёт должен сохраниться, даже если врача удалили.
        doctorId: bigint("doctor_id", { mode: "number" }).references(
            () => accounts.id,
            { onDelete: "set null" },
        ),
        patientId: bigint("patient_id", { mode: "number" })
            .notNull()
            .references(() => patients.id, { onDelete: "cascade" }),

        mode: calculationModeEnum("mode").notNull(),

        age: integer("age").notNull(),
        gender: calculationGenderEnum("gender").notNull(),
        st4: doublePrecision("st4").notNull(),
        ttg: doublePrecision("ttg").notNull(),
        atrttg: doublePrecision("atrttg").notNull(),
        thyroidVolume: doublePrecision("thyroid_volume").notNull(),
        eopStage: integer("eop_stage").notNull(),
        thyrostaticDailyDoseMg: doublePrecision(
            "thyrostatic_daily_dose_mg",
        ).notNull(),
        thyrostaticTherapyDurationMonths: doublePrecision(
            "thyrostatic_therapy_duration_months",
        ).notNull(),
        cccComplications: boolean("ccc_complications").notNull().default(false),
        compressionSyndrome: boolean("compression_syndrome")
            .notNull()
            .default(false),
        slco1b1Polymorphism: boolean("slco1b1_polymorphism")
            .notNull()
            .default(false),

        score: integer("score").notNull(),
        severity: text("severity").notNull(),
        recommendation: text("recommendation").notNull(),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("calculation_history_patient_created_idx").on(
            table.patientId,
            table.createdAt,
        ),
        index("calculation_history_doctor_idx").on(table.doctorId),
    ],
);

/* ------------------------------------------------------------------ *
 * Связи (для relational queries drizzle)
 * ------------------------------------------------------------------ */

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    workerProfile: one(workerProfiles, {
        fields: [accounts.id],
        references: [workerProfiles.userId],
    }),
    calculations: many(calculationHistory),
}));

export const workerProfilesRelations = relations(workerProfiles, ({ one }) => ({
    user: one(accounts, {
        fields: [workerProfiles.userId],
        references: [accounts.id],
    }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
    calculations: many(calculationHistory),
}));

export const calculationHistoryRelations = relations(
    calculationHistory,
    ({ one }) => ({
        patient: one(patients, {
            fields: [calculationHistory.patientId],
            references: [patients.id],
        }),
        doctor: one(accounts, {
            fields: [calculationHistory.doctorId],
            references: [accounts.id],
        }),
    }),
);

/* ------------------------------------------------------------------ *
 * Выводимые типы
 * ------------------------------------------------------------------ */

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type WorkerProfile = typeof workerProfiles.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type CalculationRecord = typeof calculationHistory.$inferSelect;
export type NewCalculationRecord = typeof calculationHistory.$inferInsert;
