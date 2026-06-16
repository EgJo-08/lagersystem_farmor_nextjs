"use server"

import z from "zod"
import fs from "fs/promises"
import path from "path"
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

    const filePath = path.join(
        process.cwd(),
        "app",
        "password.json"
    )

    const file = await fs.readFile(filePath, "utf8")

    const passwords = JSON.parse(file)

    const validPasswords = passwords.map((item) => item.password)

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