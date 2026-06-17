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
    const password = formdata.get("password")

    const result = loginSchema.safeParse({ password })

    if (!result.success) {
        return {
            values: { password },
            errors: z.flattenError(result.error).fieldErrors,
        }
    }

    const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000"

    const res = await fetch(`${baseUrl}/password.json`, { cache: "no-store" })
    if (!res.ok) {
        return {
            values: { password },
            errors: {
                form: ["Kunne ikke indlæse adgangskoder"],
            },
        }
    }

    const data = await res.json()
    const validPasswords = data.map((item) => item.password)

    if (!validPasswords.includes(password)) {
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