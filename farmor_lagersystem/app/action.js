"use server"

import z from "zod"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import fs from "fs/promises"
import path from "path"

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

let data

try {
    const filePath = path.join(process.cwd(), "public", "password.json")
    const file = await fs.readFile(filePath, "utf-8")
    data = JSON.parse(file)
} catch (err) {
    return {
        values: { password },
        errors: {
            form: ["Kunne ikke indlæse adgangskoder"],
        },
    }
}

const validPasswords = data.map((item) =>
    item.password?.toString().trim()
)

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