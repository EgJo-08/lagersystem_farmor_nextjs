"use server"

import z from "zod"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const loginSchema = z.object({
    password: z.string().min(1, "Indtast adgangskoden"),
})

export default async function logout() {
    const cookieStore = await cookies()

    cookieStore.delete("token")

    redirect("/")
}

export async function LoginAction(previousState, formdata) {
    const password = formdata.get("password")?.toString().trim()

    const result = loginSchema.safeParse({ password })

    if (!result.success) {
        return {
            values: { password },
            errors: z.flattenError(result.error).fieldErrors,
        }
    }

    const expectedPassword = process.env.LOGIN_PASSWORD?.toString().trim()

    if (!expectedPassword) {
        return {
            values: { password },
            errors: {
                form: ["Login er ikke konfigureret på serveren."],
            },
        }
    }

    const isValid = password === expectedPassword

    if (!isValid) {
        return {
            values: { password },
            errors: {
                form: ["forkert kode"],
            },
        }
    }

    const cookieStore = await cookies()

    cookieStore.set("token", "logged-in", {
        httpOnly: true,
        maxAge: 60 * 60 * 24,
        path: "/",
    })

    redirect("/drinks")
}